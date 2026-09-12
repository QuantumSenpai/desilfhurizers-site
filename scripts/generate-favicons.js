import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CRC-32 table
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1)
    else c = c >>> 1
  }
  crcTable[n] = c
}

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

function makeChunk(type, data) {
  const len = data.length
  const buf = Buffer.alloc(8 + len + 4)
  buf.writeUInt32BE(len, 0)
  buf.write(type, 4, 4, 'ascii')
  data.copy(buf, 8)
  const toCrc = buf.subarray(4, 8 + len)
  buf.writeUInt32BE(crc32(toCrc), 8 + len)
  return buf
}

function generatePng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type RGBA
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData)

  // Uncompressed raw scanlines: each row starts with filter byte 0
  const rowBytes = 1 + size * 4
  const rawData = Buffer.alloc(rowBytes * size)

  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.44
  const innerRadius = size * 0.36
  const hexRadius = size * 0.25
  const centerDotRadius = size * 0.12

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowBytes
    rawData[rowOffset] = 0 // Filter type None
    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Base rounded rectangle dark background (#121212)
      // Check rounded corner distance
      const cornerR = size * 0.22
      const qx = Math.max(0, Math.abs(dx) - (cx - cornerR))
      const qy = Math.max(0, Math.abs(dy) - (cy - cornerR))
      const cornerDist = Math.sqrt(qx * qx + qy * qy)

      if (cornerDist <= cornerR) {
        // Inside background container
        let r = 18, g = 18, b = 18, a = 255 // #121212

        // Outer Blue Technical Ring (#2F6FEF)
        if (dist >= innerRadius && dist <= radius) {
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI
          // Ring segment with gap
          if (angle > -140 && angle < 140) {
            r = 47; g = 111; b = 239; a = 255 // #2F6FEF
          }
        }

        // Inner Hex target ring (#2F6FEF subtle tint)
        if (dist >= hexRadius - 1.5 && dist <= hexRadius + 1.5) {
          r = 47; g = 111; b = 239; a = 200
        }

        // Active Green Center Dot (#22C55E)
        if (dist <= centerDotRadius) {
          if (dist <= centerDotRadius * 0.4) {
            r = 255; g = 255; b = 255; a = 255 // White core
          } else {
            r = 34; g = 197; b = 94; a = 255 // #22C55E
          }
        }

        rawData[pxOffset] = r
        rawData[pxOffset + 1] = g
        rawData[pxOffset + 2] = b
        rawData[pxOffset + 3] = a
      } else {
        // Transparent outside rounded corners
        rawData[pxOffset] = 0
        rawData[pxOffset + 1] = 0
        rawData[pxOffset + 2] = 0
        rawData[pxOffset + 3] = 0
      }
    }
  }

  // Compress with deflate
  const compressed = zlib.deflateSync(rawData, { level: 9 })
  const idatChunk = makeChunk('IDAT', compressed)

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

const pubDir = path.resolve(__dirname, '../public')
fs.writeFileSync(path.join(pubDir, 'favicon-32x32.png'), generatePng(32))
fs.writeFileSync(path.join(pubDir, 'favicon-192x192.png'), generatePng(192))
console.log('Successfully generated favicon-32x32.png and favicon-192x192.png')
