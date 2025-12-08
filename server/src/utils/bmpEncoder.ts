import { Buffer } from 'node:buffer';

export class bmpEncoder {
    /**
     * Encodes raw RGB/RGBA data into a BMP buffer (24-bit).
     * @param width Image width
     * @param height Image height
     * @param data Raw pixel data (RGB or RGBA)
     * @returns BMP Buffer
     */
    public static encode(width: number, height: number, data: Buffer): Buffer {
        const channels = data.length / (width * height);
        if (channels !== 3 && channels !== 4) {
            throw new Error(`Invalid channel count: ${channels}. Expected 3 (RGB) or 4 (RGBA).`);
        }

        const fileHeaderSize = 14;
        const infoHeaderSize = 40; // BITMAPINFOHEADER
        const headerSize = fileHeaderSize + infoHeaderSize;

        // Rows are padded to 4-byte boundaries
        const rowSize = Math.ceil((width * 3) / 4) * 4;
        const pixelArraySize = rowSize * height;
        const fileSize = headerSize + pixelArraySize;

        const buffer = Buffer.alloc(fileSize);

        // --- File Header ---
        buffer.write('BM', 0); // Signature
        buffer.writeInt32LE(fileSize, 2); // File size
        buffer.writeInt16LE(0, 6); // Reserved
        buffer.writeInt16LE(0, 8); // Reserved
        buffer.writeInt32LE(headerSize, 10); // Offset to pixel array

        // --- Info Header (BITMAPINFOHEADER) ---
        buffer.writeInt32LE(infoHeaderSize, 14); // Header size
        buffer.writeInt32LE(width, 18); // Width
        buffer.writeInt32LE(height, 22);
        buffer.writeInt16LE(1, 26); // Planes
        buffer.writeInt16LE(24, 28); // Bit depth (24 = RGB)
        buffer.writeInt32LE(0, 30); // Compression (BI_RGB)
        buffer.writeInt32LE(pixelArraySize, 34); // Image size
        buffer.writeInt32LE(2835, 38); // X pixels/meter (72 DPI)
        buffer.writeInt32LE(2835, 42); // Y pixels/meter
        buffer.writeInt32LE(0, 46); // Colors used
        buffer.writeInt32LE(0, 50); // Colors important

        // --- Pixel Array ---
        // BMP stores BGR. Sharp input is RGB(A).
        let ptr = headerSize;
        for (let y = height - 1; y >= 0; y--) {
            const rowOffset = ptr;
            for (let x = 0; x < width; x++) {
                const srcIdx = (y * width + x) * channels;
                const r = data[srcIdx];
                const g = data[srcIdx + 1];
                const b = data[srcIdx + 2];

                // Write BGR
                buffer.writeUInt8(b, rowOffset + x * 3);
                buffer.writeUInt8(g, rowOffset + x * 3 + 1);
                buffer.writeUInt8(r, rowOffset + x * 3 + 2);
            }
            ptr += rowSize;
        }

        return buffer;
    }
}
