// Grid + path helpers. The game uses a 20x20 grid with 30px tiles.
// Path is defined per-map as a sequence of waypoints.
export const GRID_SIZE = 20;
export const TILE_SIZE = 30; // canvas 600x600

// Legacy default path (used by unit tests / fallback only).
export const PATH_POINTS = [
  { c: -1, r: 3 }, { c: 4, r: 3 }, { c: 4, r: 10 }, { c: 1, r: 10 },
  { c: 1, r: 17 }, { c: 8, r: 17 }, { c: 8, r: 6 }, { c: 13, r: 6 },
  { c: 13, r: 14 }, { c: 17, r: 14 }, { c: 17, r: 2 }, { c: 20, r: 2 },
];

// Precompute the set of path tiles (grid cells the path traverses).
export function buildPathTiles(points) {
  const set = new Set();
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dc = Math.sign(b.c - a.c);
    const dr = Math.sign(b.r - a.r);
    let c = a.c, r = a.r;
    while (c !== b.c || r !== b.r) {
      if (c >= 0 && c < GRID_SIZE && r >= 0 && r < GRID_SIZE) set.add(key(c, r));
      c += dc; r += dr;
    }
    if (b.c >= 0 && b.c < GRID_SIZE && b.r >= 0 && b.r < GRID_SIZE) set.add(key(b.c, b.r));
  }
  return set;
}

export function key(c, r) { return `${c},${r}`; }

export function tileCenter(c, r) {
  return { x: c * TILE_SIZE + TILE_SIZE / 2, y: r * TILE_SIZE + TILE_SIZE / 2 };
}

// Convert a pixel position into a grid tile (or null if out of bounds).
export function pixelToTile(px, py) {
  const c = Math.floor(px / TILE_SIZE);
  const r = Math.floor(py / TILE_SIZE);
  if (c < 0 || c >= GRID_SIZE || r < 0 || r >= GRID_SIZE) return null;
  return { c, r };
}

// Path-segment cache — used by enemies walking along the path.
export function buildPathSegments(points) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const ax = a.c * TILE_SIZE + TILE_SIZE / 2;
    const ay = a.r * TILE_SIZE + TILE_SIZE / 2;
    const bx = b.c * TILE_SIZE + TILE_SIZE / 2;
    const by = b.r * TILE_SIZE + TILE_SIZE / 2;
    const len = Math.hypot(bx - ax, by - ay);
    segs.push({ ax, ay, bx, by, len, startDist: total });
    total += len;
  }
  return { segments: segs, total, points };
}

// Given a distance along the path, return {x, y} and whether we've reached the end.
export function positionAtDistance(segments, total, dist) {
  if (dist >= total) {
    const last = segments[segments.length - 1];
    return { x: last.bx, y: last.by, done: true };
  }
  for (const s of segments) {
    if (dist <= s.startDist + s.len) {
      const t = (dist - s.startDist) / s.len;
      return { x: s.ax + (s.bx - s.ax) * t, y: s.ay + (s.by - s.ay) * t, done: false };
    }
  }
  const last = segments[segments.length - 1];
  return { x: last.bx, y: last.by, done: true };
}
