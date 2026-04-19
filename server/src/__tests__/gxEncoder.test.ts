import { gxEncoder } from '../utils/gxEncoder';
import { GxMetaData } from '../types/GxMetaData';

describe('gxEncoder', () => {
  let encoder: gxEncoder;
  let mockGcode: Buffer;
  let mockBitmap: Buffer;
  let mockMeta: GxMetaData;

  beforeEach(() => {
    encoder = new gxEncoder();
    mockGcode = Buffer.from('G1 X10 Y10\nG1 X20 Y20\n');
    mockBitmap = Buffer.alloc(100, 0xFF); // 100 bytes of white
    mockMeta = {
      printTime: 3600, // 1 hour
      filamentUsage: 5000, // 5 meters
      filamentUsageLeft: 0,
      multiExtruderType: 0,
      layerHeight: 20, // 0.2mm in hundredths
      shells: 2,
      printSpeed: 60,
      bedTemperature: 50,
      printTemperature: 200,
      printTemperatureLeft: 0
    };
  });

  describe('encode', () => {
    it('should return a buffer', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should create buffer with correct header size', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      // Header (58) + bitmap (100) + gcode (variable)
      expect(result.length).toBe(58 + 100 + mockGcode.length);
    });

    it('should write correct version string', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const version = result.toString('utf8', 0, 12);
      expect(version).toBe('xgcode 1.0\n\0');
    });

    it('should calculate correct bitmap start offset', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const bitmapStart = result.readInt32LE(16); // offset 16
      expect(bitmapStart).toBe(58); // Header size
    });

    it('should calculate correct gcode start offset', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const gcodeStart = result.readInt32LE(20); // offset 20
      expect(gcodeStart).toBe(58 + mockBitmap.length);
    });

    it('should write print time correctly', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const printTime = result.readInt32LE(28); // offset 28
      expect(printTime).toBe(mockMeta.printTime);
    });

    it('should write filament usage correctly', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const filamentUsage = result.readInt32LE(32); // offset 32
      expect(filamentUsage).toBe(mockMeta.filamentUsage);
    });

    it('should write layer height correctly', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const layerHeight = result.readInt16LE(42); // offset 42
      expect(layerHeight).toBe(mockMeta.layerHeight);
    });

    it('should write print speed correctly', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const printSpeed = result.readInt16LE(48); // offset 48
      expect(printSpeed).toBe(mockMeta.printSpeed);
    });

    it('should write bed temperature correctly', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const bedTemp = result.readInt16LE(50); // offset 50
      expect(bedTemp).toBe(mockMeta.bedTemperature);
    });

    it('should write print temperature correctly', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const printTemp = result.readInt16LE(52); // offset 52
      expect(printTemp).toBe(mockMeta.printTemperature);
    });

    it('should append bitmap data after header', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const bitmapData = result.slice(58, 58 + mockBitmap.length);
      expect(bitmapData.equals(mockBitmap)).toBe(true);
    });

    it('should append gcode data after bitmap', () => {
      const result = encoder.encode(mockGcode, mockBitmap, mockMeta);
      const gcodeStart = 58 + mockBitmap.length;
      const gcodeData = result.slice(gcodeStart, gcodeStart + mockGcode.length);
      expect(gcodeData.equals(mockGcode)).toBe(true);
    });

    it('should handle empty bitmap', () => {
      const emptyBitmap = Buffer.alloc(0);
      const result = encoder.encode(mockGcode, emptyBitmap, mockMeta);
      expect(result.length).toBe(58 + mockGcode.length);
    });

    it('should handle large metadata values', () => {
      const largeMeta = {
        ...mockMeta,
        printTime: 2147483647, // Max int32
        filamentUsage: 2147483647
      };
      const result = encoder.encode(mockGcode, mockBitmap, largeMeta);
      expect(result.readInt32LE(28)).toBe(largeMeta.printTime);
      expect(result.readInt32LE(32)).toBe(largeMeta.filamentUsage);
    });
  });
});
