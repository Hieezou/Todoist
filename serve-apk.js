const http = require('http');
const fs = require('fs');
const path = require('path');
const port = 8000;
const dir = process.cwd();
const server = http.createServer((req, res) => {
  const requested = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(dir, requested === '/' ? 'index.html' : requested.slice(1));
  if (!filePath.startsWith(dir)) { res.writeHead(403); return res.end('Forbidden'); }
  if (requested === '/' || requested === '/index.html') {
    const html = '<html><body><h1>APK Download</h1><a href="/app-release.apk">Download app-release.apk</a></body></html>';
    res.writeHead(200, {'Content-Type': 'text/html'});
    return res.end(html);
  }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': stats.size,
      'Content-Disposition': 'attachment; filename="app-release.apk"'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});
server.listen(port, () => console.log('HTTP server running on port ' + port));
