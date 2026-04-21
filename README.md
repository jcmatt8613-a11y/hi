# Unblocked Browser

A fully functional web browser UI — address bar, tabs, back/forward, reload, home — that loads **any** site (Google, YouTube, Wikipedia, Reddit, etc.) through an [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) proxy running on a tiny Node/Express server.

Two flavours ship in this repo:

| File / entrypoint | Description | Works on all sites? |
|---|---|---|
| `server.js` + `public/` (run with `npm start`) | Full Ultraviolet + bare-server-node proxy. Strips anti-framing headers, rewrites requests server-side. | **Yes** — Google, YouTube, everything. |
| `standalone.html` (just open the file) | Single-file pure HTML. Uses iframes + an optional public CORS proxy. No server required. | Works for many sites; **Google/YouTube block direct iframing** regardless of CORS, so this is a best-effort fallback. |

## Quick start (full version)

```bash
npm install
npm start          # listens on http://localhost:8080
```

Then open http://localhost:8080 in a browser. Type any URL or search query in the address bar and hit Enter.

### How it works

1. The page registers a service worker (`/uv/sw.js`) scoped to `/service/`.
2. The SW intercepts `/service/<encoded-url>` requests and asks the Ultraviolet runtime to rewrite them.
3. Ultraviolet makes the actual network request via `bare-mux` → `/bare/` (the `@tomphttp/bare-server-node` endpoint), which proxies it from our server.
4. Response HTML/CSS/JS is rewritten so all sub-requests stay inside the `/service/` prefix.
5. The rewritten content is shown in an iframe inside our browser UI.

### Keyboard shortcuts

- `Ctrl+L` — focus address bar
- `Ctrl+T` — new tab
- `Ctrl+W` — close current tab

## Quick start (standalone HTML)

```bash
# no install, no server — just open the file
xdg-open standalone.html       # Linux
open standalone.html           # macOS
# or drag-and-drop into Chrome / Edge / Firefox
```

It falls back to [corsproxy.io](https://corsproxy.io) to strip headers on sites that allow it. Major sites that set `X-Frame-Options: DENY` (Google, YouTube, Instagram, etc.) still can't be iframed — browsers enforce this even if the proxy strips the header, because the header is cached from the original response. Use the full version above for those.

## Project layout

```
.
├── server.js                # Express + bare-server-node + Ultraviolet wiring
├── package.json
├── public/
│   ├── index.html           # Browser chrome (tabs, address bar)
│   ├── index.css            # Styles
│   ├── index.js             # Tab manager, navigation, service-worker registration
│   └── uv/
│       ├── sw.js            # Top-level service worker → imports Ultraviolet SW
│       └── uv.config.js     # Ultraviolet config (prefix, encoder, paths)
└── standalone.html          # No-server single-file fallback
```

## Tech used

- [`@titaniumnetwork-dev/ultraviolet`](https://www.npmjs.com/package/@titaniumnetwork-dev/ultraviolet) — the proxy runtime
- [`@tomphttp/bare-server-node`](https://www.npmjs.com/package/@tomphttp/bare-server-node) — server side of the "bare" transport
- [`@mercuryworkshop/bare-mux`](https://www.npmjs.com/package/@mercuryworkshop/bare-mux) — multiplexes requests through the SW
- [`@mercuryworkshop/bare-as-module3`](https://www.npmjs.com/package/@mercuryworkshop/bare-as-module3) — client-side bare transport
- [`express`](https://expressjs.com/) — static file serving

## Legal / ethical note

This project is for learning how web proxies work and for use on networks where you have permission to proxy traffic. Respect your school/employer's acceptable-use policy and local laws. Don't use it for anything shady.

## License

MIT
