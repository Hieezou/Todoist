const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) {
    crc = (crc >>> 8) ^ table[(crc ^ b) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(width, height, rgba) {
  const header = Buffer.from('89504e470d0a1a0a', 'hex');
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlines = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const i = 1 + x * 4;
      row[i] = rgba[0];
      row[i + 1] = rgba[1];
      row[i + 2] = rgba[2];
      row[i + 3] = rgba[3];
    }
    scanlines.push(row);
  }

  const idat = zlib.deflateSync(Buffer.concat(scanlines));
  return Buffer.concat([header, makeChunk('IHDR', ihdr), makeChunk('IDAT', idat), makeChunk('IEND', Buffer.alloc(0))]);
}

function writeFile(outputPath, pngBuffer) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, pngBuffer);
  console.log('wrote', outputPath, fs.statSync(outputPath).size);
}

const icon = makePng(192, 192, [0, 122, 255, 255]);
const splash = makePng(1200, 1200, [0, 0, 0, 255]);
const mipmapDirs = ['mipmap-hdpi', 'mipmap-mdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
const drawableDirs = ['drawable-hdpi', 'drawable-mdpi', 'drawable-xhdpi', 'drawable-xxhdpi', 'drawable-xxxhdpi'];

for (const dir of mipmapDirs) {
  writeFile(path.join('android', 'app', 'src', 'main', 'res', dir, 'ic_launcher.png'), icon);
  writeFile(path.join('android', 'app', 'src', 'main', 'res', dir, 'ic_launcher_foreground.png'), icon);
}

for (const dir of drawableDirs) {
  writeFile(path.join('android', 'app', 'src', 'main', 'res', dir, 'splashscreen_image.png'), splash);
}

writeFile(path.join('assets', 'icon.png'), icon);
writeFile(path.join('assets', 'splash.png'), splash);
console.log('Android launcher icons, splash asset, and splashscreen drawables replaced with valid PNGs.');
