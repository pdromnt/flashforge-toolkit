import net from 'net';
import fs from 'fs';
import crc from 'crc';
import { GxMetaParser } from '../utils/GxMetaParser.js';
import { GxEncoder } from '../utils/GxEncoder.js';

class SerialMessage {
  content: any;
  type: any;
  constructor(content, type) {
    this.content = content; // string for "command", object for "data" (see below)
    this.type = type;       // "command" | "data"
  }
}

class TCPConsole {
  host: any;
  port: any;
  queue: any[];
  client: net.Socket;
  readTimeoutMs: number;
  writeTimeoutMs: number;
  _buffer: string;
  constructor(host, port, { readTimeoutMs = 10 * 60 * 1000, writeTimeoutMs = 10 * 60 * 1000 } = {}) {
    this.host = host;
    this.port = port;
    this.queue = [];
    this.client = new net.Socket();
    this.readTimeoutMs = readTimeoutMs;
    this.writeTimeoutMs = writeTimeoutMs;
    this._buffer = ''; // accumulate textual responses
  }

  enqueueCmd(msg) {
    this.queue.push(msg);
  }

  async runQueue() {
    await this._connect();
    try {
      for (const msg of this.queue) {
        if (msg.type === 'command') {
          await this._sendCommandAndWait(msg.content);
        } else if (msg.type === 'data') {
          // msg.content is { filePath, packetSize, progressCb }
          await this._sendPacketizedData(msg.content);
        }
      }
      this.client.end();
      return true;
    } catch (err) {
      this.client.destroy();
      throw err;
    }
  }

  _connect() {
    return new Promise<void>((resolve, reject) => {
      this.client.setTimeout(this.readTimeoutMs);
      this.client.once('timeout', () => reject(new Error('Socket read timeout')));
      this.client.once('error', reject);
      this.client.connect(this.port, this.host, () => {
        // Accumulate textual replies for command handling
        this.client.on('data', (data) => {
          this._buffer += data.toString('utf8');
        });
        resolve();
      });
    });
  }

  _sendCommandAndWait(cmd, { expectRegex = /ok|Ready|READY|Start|Status|MachineStatus|Done|Finish/i, timeoutMs = 30000 } = {}) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Command timeout: ${cmd.trim()}`)), timeoutMs);

      // Send command
      this.client.write(cmd, (err) => {
        if (err) {
          clearTimeout(timer);
          reject(err);
          return;
        }
      });

      // Poll buffer for an expected acknowledgment line
      const poll = () => {
        if (expectRegex.test(this._buffer)) {
          clearTimeout(timer);
          const reply = this._buffer;
          this._buffer = ''; // reset after consuming
          resolve(reply);
        } else {
          setImmediate(poll);
        }
      };
      poll();
    });
  }

  async _sendPacketizedData({ filePath, packetSize = 4096, progressCb }) {
    return new Promise<void>(async (resolve, reject) => {
      const fd = fs.openSync(filePath, 'r');
      const stat = fs.fstatSync(fd);
      const totalBytes = stat.size;

      try {
        let counter = 0;
        let remaining = totalBytes;
        const tmpBuf = Buffer.alloc(packetSize);

        while (remaining > 0) {
          const toRead = Math.min(packetSize, remaining);
          const bytesRead = fs.readSync(fd, tmpBuf, 0, toRead, null);
          if (bytesRead <= 0) break;

          const chunk = tmpBuf.slice(0, bytesRead);
          const packet = buildPacket(counter, chunk, packetSize);

          if (!this.client.write(packet)) {
            // Wait for drain once, then continue
            await new Promise((resolve) => this.client.once('drain', resolve));
          }

          counter++;
          remaining -= bytesRead;

          if (typeof progressCb === 'function') {
            progressCb(totalBytes - remaining, totalBytes);
          }
        }

        fs.closeSync(fd);
        resolve();
      } catch (err) {
        try { fs.closeSync(fd); } catch (_) { }
        reject(err);
      }
    });
  }
}

// Build packet with 16-byte header + padded payload
function buildPacket(counter, dataChunk, packetSize) {
  // 16-byte header layout:
  // [0..3]   Magic: 0x5A 0x5A 0xA5 0xA5 (big-endian 32-bit value 0x5A5AA5A5)
  // [4..7]   Counter: big-endian uint32
  // [8..11]  Data length: big-endian uint32 (actual chunk length)
  // [12..15] CRC32 of actual chunk (without padding), big-endian uint32

  const header = Buffer.alloc(16);
  header.writeUInt32BE(0x5a5aa5a5, 0);
  header.writeUInt32BE(counter >>> 0, 4);
  header.writeUInt32BE(dataChunk.length >>> 0, 8);

  const crcVal = (crc.crc32(dataChunk) >>> 0);
  header.writeUInt32BE(crcVal, 12);

  // Pad payload to packetSize with 0x00; CRC is for unpadded chunk
  const payload = Buffer.alloc(packetSize);
  dataChunk.copy(payload, 0);

  return Buffer.concat([header, payload], header.length + payload.length);
}

// Core upload logic
async function uploadGcode({
  host,
  port,
  localFilePath,
  remoteFileName,
  startPrint,
  onProgress, // function(sentBytes, totalBytes)
}) {
  // Parse G-code to GX
  const gcodeContent = fs.readFileSync(localFilePath, 'utf8');
  const parser = new GxMetaParser();
  const { meta, thumbnail } = await parser.parse(gcodeContent);

  const gxService = new GxEncoder();

  // Ensure we have a valid buffer for G-code part
  const gcodeBuffer = Buffer.from(gcodeContent, 'utf8');

  // Create GX file paths
  const gxFilePath = localFilePath.replace(/\.gcode$/i, '') + '.gx';
  const gxRemoteFileName = remoteFileName.replace(/\.gcode$/i, '') + '.gx';

  // Encode
  const gxBuffer = gxService.encode(gcodeBuffer, thumbnail || Buffer.alloc(0), meta);
  fs.writeFileSync(gxFilePath, gxBuffer);

  const tcpConsole = new TCPConsole(host, port);

  // 1) Queue setup commands
  tcpConsole.enqueueCmd(new SerialMessage("~M601 S1\r\n", "command")); // control enable
  tcpConsole.enqueueCmd(new SerialMessage("~M650\r\n", "command"));    // connect
  tcpConsole.enqueueCmd(new SerialMessage("~M119\r\n", "command"));    // status

  // 2) File upload command with exact size (original file size, not padded)
  const fileSize = fs.statSync(gxFilePath).size;
  tcpConsole.enqueueCmd(new SerialMessage(`~M28 ${fileSize} 0:/user/${gxRemoteFileName}\r\n`, "command"));

  // 3) Packetized data stream
  tcpConsole.enqueueCmd(new SerialMessage({
    filePath: gxFilePath,
    packetSize: 4096,
    progressCb: onProgress,
  }, "data"));

  // 4) Save file
  tcpConsole.enqueueCmd(new SerialMessage("~M29\r\n", "command"));

  // 5) Optional start print
  if (startPrint) {
    tcpConsole.enqueueCmd(new SerialMessage(`~M23 0:/user/${gxRemoteFileName}\r\n`, "command"));
  }

  // 6) Run the queue
  return tcpConsole.runQueue();
}

export { uploadGcode };