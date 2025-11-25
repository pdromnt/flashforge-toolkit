import { once } from 'events';
import net from 'net';
import * as fs from 'fs'

const BLOCK_SIZE = 4096;
const HEADER_SIZE = 16;

const CRC32_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
    }
    return table;
})();

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC32_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeHeader(counter, dataLen, dataCrc) {
    const header = Buffer.alloc(HEADER_SIZE);
    header[0] = 0x5a;
    header[1] = 0x5a;
    header[2] = 0xa5;
    header[3] = 0xa5;
    header.writeUInt32BE(counter >>> 0, 4);
    header.writeUInt32BE(dataLen >>> 0, 8);
    header.writeUInt32BE(dataCrc >>> 0, 12);
    return header;
}

async function sendCmd(socket, cmd) {
    const line = cmd.endsWith('\r\n') ? cmd : `${cmd}\r\n`;
    const buf = Buffer.from(line, 'utf8');
    const ok = socket.write(buf);
    if (!ok) await once(socket, 'drain');
}

async function sendPacket(socket, header, payload) {
    const packet = Buffer.concat([header, payload]);
    const ok = socket.write(packet);
    if (!ok) await once(socket, 'drain');
}

async function uploadFileToPrinter({ host, port, filename, filePath, model = '5m', startPrint = false }) {
  const stat = await fs.promises.stat(filePath);
  const fileSize = stat.size;

  const socket = net.createConnection({ host, port });
  socket.setNoDelay(true);
  socket.setTimeout(10 * 60 * 1000); // 10 min timeout

  socket.on('data', (data) => console.log('[Printer]', data.toString().trim()));
  socket.on('error', (err) => console.error('[Socket error]', err.message));

  await once(socket, 'connect');
  console.log(`Connected to ${host}:${port}`);

  try {
    // Handshake
    await sendCmd(socket, '~M601 S1');
    await sendCmd(socket, model === 'm5' ? '~M640' : '~M650');
    await sendCmd(socket, '~M119');

    // Begin upload
    await sendCmd(socket, `~M28 ${fileSize} 0:/user/${filename}`);

    // Stream file in packets
    const stream = fs.createReadStream(filePath, { highWaterMark: BLOCK_SIZE });
    let counter = 0;
    for await (const chunk of stream) {
      const dataLen = chunk.length;
      const crc = crc32(chunk);
      const header = writeHeader(counter, dataLen, crc);

      let payload = chunk;
      if (dataLen < BLOCK_SIZE) {
        const padded = Buffer.alloc(BLOCK_SIZE);
        chunk.copy(padded, 0);
        payload = padded;
      }

      await sendPacket(socket, header, payload);
      counter++;
    }
    console.log(`Data phase complete (${counter} packets).`);

    // Finalize
    await sendCmd(socket, '~M29');

    // Optional start
    if (startPrint) {
      await sendCmd(socket, `~M23 0:/user/${filename}`);
    }

    socket.end();
    await once(socket, 'close');
    console.log('Upload complete, socket closed.');
  } catch (err) {
    socket.destroy();
    throw err;
  }
}

export { uploadFileToPrinter };