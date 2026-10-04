import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const port = 5500;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  let filename = path.resolve(root, `.${pathname}`);

  if (!filename.startsWith(`${root}${path.sep}`) && filename !== root) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  if (existsSync(filename) && statSync(filename).isDirectory()) {
    filename = path.join(filename, "index.html");
  }

  if (!existsSync(filename) || !statSync(filename).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }

  response.writeHead(200, { "Content-Type": mime[path.extname(filename).toLowerCase()] ?? "application/octet-stream" });
  createReadStream(filename).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`Local site listening on http://0.0.0.0:${port}`);
});
