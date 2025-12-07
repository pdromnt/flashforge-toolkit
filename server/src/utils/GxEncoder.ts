import { Buffer } from 'node:buffer';

export interface GxMetaData {
    printTime: number; // seconds
    filamentUsage: number; // mm
    filamentUsageLeft: number; // mm
    multiExtruderType: number;
    layerHeight: number;
    shells: number;
    printSpeed: number; // mm/s
    bedTemperature: number;
    printTemperature: number; // right extruder
    printTemperatureLeft: number; // left extruder
}

export interface GxHeader extends GxMetaData {
    version: string;
    bitmapStart: number;
    gcodeStart: number;
}

export class GxEncoder {
    private static readonly HEADER_SIGNATURE = 'xgcode 1.0\n';
    /**
     * Wraps G-code and metadata into a GX binary buffer.
     */
    public encode(
        gcode: Buffer,
        bitmap: Buffer,
        meta: GxMetaData
    ): Buffer {
        // 1. Construct Header
        const headerBuffer = Buffer.alloc(58);

        // Version "xgcode 1.0\n\0" - 12 bytes
        headerBuffer.write('xgcode 1.0\n\0', 0, 12, 'utf8');

        // Constants: 4 x Int32
        // 0, bitmap_start, gcode_start, gcode_start
        const bitmapStart = 58;
        const gcodeStart = bitmapStart + bitmap.length;

        let offset = 12;
        headerBuffer.writeInt32LE(0, offset); offset += 4;
        headerBuffer.writeInt32LE(bitmapStart, offset); offset += 4;
        headerBuffer.writeInt32LE(gcodeStart, offset); offset += 4;
        headerBuffer.writeInt32LE(gcodeStart, offset); offset += 4;

        // Metadata 1: time, fil, fil2, type -> 3 ints, 1 short
        // offset 28 (0x1C)
        offset = 28;
        headerBuffer.writeInt32LE(meta.printTime, offset); offset += 4;
        headerBuffer.writeInt32LE(meta.filamentUsage, offset); offset += 4;
        headerBuffer.writeInt32LE(meta.filamentUsageLeft, offset); offset += 4;
        headerBuffer.writeInt16LE(meta.multiExtruderType, offset); offset += 2;

        // Metadata 2: lh, 0, sh, spd, bed, t1, t2, 1 -> 8 shorts
        // offset 42 (0x2A)
        // lh
        headerBuffer.writeInt16LE(meta.layerHeight, offset); offset += 2;
        // 0 (padding)
        headerBuffer.writeInt16LE(0, offset); offset += 2;
        // shells
        headerBuffer.writeInt16LE(meta.shells, offset); offset += 2;
        // speed
        headerBuffer.writeInt16LE(meta.printSpeed, offset); offset += 2;
        // bed temp
        headerBuffer.writeInt16LE(meta.bedTemperature, offset); offset += 2;
        // temp 1
        headerBuffer.writeInt16LE(meta.printTemperature, offset); offset += 2;
        // temp 2
        headerBuffer.writeInt16LE(meta.printTemperatureLeft, offset); offset += 2;
        // 1 (constant?)
        headerBuffer.writeInt16LE(1, offset); offset += 2;

        // Concat everything
        const result = Buffer.concat([
            headerBuffer, // 58 bytes
            bitmap,
            gcode
        ]);

        return result;
    }
}
