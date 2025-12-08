import net from 'net';
import crc from 'crc';
import fs from 'fs';

export class SerialMessage {
    content: any;
    type: 'command' | 'data';

    constructor(content: any, type: 'command' | 'data') {
        this.content = content;
        this.type = type;
    }
}

interface PrinterSocketOptions {
    readTimeoutMs?: number;
    writeTimeoutMs?: number;
}

export class PrinterSocketClient {
    host: string;
    port: number;
    queue: SerialMessage[];
    client: net.Socket;
    readTimeoutMs: number;
    writeTimeoutMs: number;
    _buffer: string;

    constructor(host: string, port: number, options: PrinterSocketOptions = {}) {
        this.host = host;
        this.port = port;
        this.queue = [];
        this.client = new net.Socket();
        this.readTimeoutMs = options.readTimeoutMs || 10 * 60 * 1000;
        this.writeTimeoutMs = options.writeTimeoutMs || 10 * 60 * 1000;
        this._buffer = '';
    }

    enqueueCmd(msg: SerialMessage) {
        this.queue.push(msg);
    }

    async runQueue() {
        await this._connect();
        try {
            const results: string[] = [];
            for (const msg of this.queue) {
                if (msg.type === 'command') {
                    const result = await this._sendCommandAndWait(msg.content);
                    results.push(result as string);
                } else if (msg.type === 'data') {
                    // msg.content is { filePath, packetSize, progressCb }
                    await this._sendPacketizedData(msg.content);
                    results.push('Data sent');
                }
            }
            this.client.end();
            return results;
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
                this.client.on('data', (data) => {
                    this._buffer += data.toString('utf8');
                });
                resolve();
            });
        });
    }

    _sendCommandAndWait(cmd: string, { expectRegex = /ok|Ready|READY|Start|Status|MachineStatus|Done|Finish/i, timeoutMs = 30000 } = {}) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`Command timeout: ${cmd.trim()}`)), timeoutMs);

            this.client.write(cmd, (err) => {
                if (err) {
                    clearTimeout(timer);
                    reject(err);
                    return;
                }
            });

            const poll = () => {
                if (expectRegex.test(this._buffer)) {
                    clearTimeout(timer);
                    const reply = this._buffer;
                    this._buffer = ''; // reset after consuming
                    resolve(reply);
                } else {
                    if (this.client.destroyed) {
                        clearTimeout(timer);
                        reject(new Error('Socket destroyed while waiting for response'));
                        return;
                    }
                    setImmediate(poll);
                }
            };
            poll();
        });
    }

    async _sendPacketizedData({ filePath, packetSize = 4096, progressCb }: { filePath: string, packetSize?: number, progressCb?: (sent: number, total: number) => void }) {
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
                    const packet = this._buildPacket(counter, chunk, packetSize);

                    if (!this.client.write(packet)) {
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

    _buildPacket(counter: number, dataChunk: Buffer, packetSize: number) {
        const header = Buffer.alloc(16);
        header.writeUInt32BE(0x5a5aa5a5, 0);
        header.writeUInt32BE(counter >>> 0, 4);
        header.writeUInt32BE(dataChunk.length >>> 0, 8);

        const crcVal = (crc.crc32(dataChunk) >>> 0);
        header.writeUInt32BE(crcVal, 12);

        const payload = Buffer.alloc(packetSize);
        dataChunk.copy(payload, 0);

        return Buffer.concat([header, payload], header.length + payload.length);
    }
}
