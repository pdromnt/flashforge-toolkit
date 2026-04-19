import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { sanitizeFilename, validatePrinterAddress } from '../middleware/uploadValidation';
import { AppError } from '../middleware/errorHandler';

describe('Upload Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('sanitizeFilename', () => {
    it('should keep valid filenames unchanged', () => {
      expect(sanitizeFilename('test.gcode')).toBe('test.gcode');
      expect(sanitizeFilename('MyFile.gx')).toBe('MyFile.gx');
    });

    it('should replace spaces with underscores', () => {
      expect(sanitizeFilename('my file.gcode')).toBe('my_file.gcode');
    });

    it('should remove special characters', () => {
      expect(sanitizeFilename('file@#$%.gcode')).toBe('file_.gcode');
    });

    it('should prevent path traversal', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('.._.._.._etc_passwd');
    });

    it('should handle empty filename', () => {
      expect(sanitizeFilename('')).toBe('');
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(300) + '.gcode';
      expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(255);
    });

    it('should handle filenames with multiple dots', () => {
      expect(sanitizeFilename('my.file.name.gcode')).toBe('my.file.name.gcode');
    });
  });

  describe('validatePrinterAddress', () => {
    it('should pass with valid IPv4 address', () => {
      mockReq = { body: { host: '192.168.1.100', port: 8899 } };
      validatePrinterAddress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass with valid hostname', () => {
      mockReq = { body: { host: 'printer.local', port: 8899 } };
      validatePrinterAddress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass with no host/port', () => {
      mockReq = { body: {} };
      validatePrinterAddress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid IP address', () => {
      mockReq = { body: { host: '999.999.999.999' } };
      validatePrinterAddress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid printer host address');
    });

    it('should reject invalid port number', () => {
      mockReq = { body: { port: 99999 } };
      validatePrinterAddress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid printer port number');
    });

    it('should reject port 0', () => {
      mockReq = { body: { port: 0 } };
      validatePrinterAddress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reject negative port', () => {
      mockReq = { body: { port: -1 } };
      validatePrinterAddress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should accept valid string port', () => {
      mockReq = { body: { port: '8899' } };
      validatePrinterAddress(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
