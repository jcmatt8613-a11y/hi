import express from 'express';
import { createServer } from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { publicPath } from 'ultraviolet-static';
import { uvPath } from '@titaniumnetwork-dev/ultraviolet';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve transport dist dirs (these packages don't expose a /node export)
const bareModulePath = join(__dirname, 'node_modules', '@mercuryworkshop', 'bare-as-module3', 'dist');
const epoxyPath = join(__dirname, 'node_modules', '@mercuryworkshop', 'epoxy-transport', 'dist');

const bare = createBareServer('/bare/');
const app = express();

// Our custom frontend
app.use(express.static(join(__dirname, 'public')));

// Ultraviolet core assets (sw.js, bundle, client, handler)
app.use('/uv/', express.static(uvPath));

// Default UV UI shipped by ultraviolet-static (kept as an alt entrypoint)
app.use('/uv-default/', express.static(publicPath));

// bare-mux client used by the page to talk to the service worker
app.use('/baremux/', express.static(baremuxPath));

// Transports — loaded as modules by bare-mux's setTransport()
app.use('/baremod/', express.static(bareModulePath));
app.use('/epoxy/', express.static(epoxyPath));

const server = createServer();

server.on('request', (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`\n  Unblocked Browser running at http://localhost:${port}\n`);
});
