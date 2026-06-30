const fs = require('fs');
const https = require('https');
const zlib = require('zlib');
const url = 'https://storage.googleapis.com/eas-workflows-production/logs/77ab067c-f7d1-4998-bf96-6ed76c5dbc12/80605395-6212-4a95-9f23-1094542cc0d8/2026-06-29T19%3A13%3A38Z-1253092a-bfbe-4841-980f-8dfb77d81369.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260629%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260629T192038Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=4190195779a740ac64cc6f8075484bfd942670adcf77dfa4302095439bc7ff496d9a49a5d94e55f5ddacf0b36e1e3e9b41745d575a4ba42b801f57e7ea6deed3d53b8107de6cb76ad9046b283f4d90b9f02afc5c6231c79276ec33d33f897ce3cf176a6500a34fa3a2d9108513c3d3a8ecc1bac5b855d39385049075762830a9baa3261809528db43d4460fd13fc1bce5238b635a509556004b4f92cbf01ab0dff6fabb0d1f5684defd314bffe035bdf10468930ed9d02b86228a2d5a36071f0ed0497fe5ceb2cab1b93caa51f9e040911a37f14cb2e6f3c38ef18a5f2d89ebd504156f4930ef0e4fc9e8bb194c23c287d967761bb20614c6b3d36fce70448a4';
const outPath = require('path').join(__dirname, 'eas_remote_log.txt');

https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.error('HTTP', res.statusCode);
    process.exit(1);
  }
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    fs.writeFileSync(outPath, buf);
    console.log('Saved', outPath);
    console.log('Size', buf.length);
    console.log('Header', buf.slice(0, 16).toString('hex'));
    console.log('Ascii', buf.slice(0, 16).toString('ascii'));
    const tryDecompress = (name, fn) => {
      try {
        const result = fn(buf);
        console.log('===', name, 'ok ===');
        console.log(result.toString('utf8').slice(0, 1200));
      } catch (err) {
        console.log('===', name, 'failed ===');
        console.log(err.message);
      }
    };
    tryDecompress('gunzip', (b) => zlib.gunzipSync(b));
    tryDecompress('inflate', (b) => zlib.inflateSync(b));
    tryDecompress('brotli', (b) => zlib.brotliDecompressSync(b));
    tryDecompress('deflateRaw', (b) => zlib.inflateRawSync(b));
    tryDecompress('unzlib', (b) => zlib.unzipSync(b));
    console.log('=== as utf8 start ===');
    console.log(buf.toString('utf8', 0, 1200));
    console.log('=== end ===');
  });
}).on('error', (err) => {
  console.error('download err', err);
  process.exit(1);
});