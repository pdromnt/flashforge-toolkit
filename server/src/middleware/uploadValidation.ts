import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { AppError } from './errorHandler';

// Allowed file extensions for upload
const ALLOWED_EXTENSIONS = ['.gcode', '.gx'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new AppError(
      `Invalid file type. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed`,
      400
    ));
  }
  
  cb(null, true);
};

// Configure multer with validation
export const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  },
  fileFilter
});

// Validation middleware for printer address
export const validatePrinterAddress = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const { host, port } = req.body;
  
  if (host) {
    // Check if it looks like an IP address (all dots and numbers)
    const looksLikeIP = /^[\d.]+$/.test(host);
    
    if (looksLikeIP) {
      // Must be a valid IP
      if (!isValidIP(host)) {
        return next(new AppError('Invalid printer host address', 400));
      }
    } else {
      // Must be a valid hostname
      if (!isValidHostname(host)) {
        return next(new AppError('Invalid printer host address', 400));
      }
    }
  }
  
  if (port !== undefined && port !== null && port !== '') {
    const portNum = Number(port);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      return next(new AppError('Invalid printer port number', 400));
    }
  }
  
  next();
};

// Helper functions
function isValidIP(ip: string): boolean {
  // IPv4 validation with proper octet checking
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  if (!ipv4Regex.test(ip)) {
    return false;
  }
  
  // Additional validation: ensure each octet is 0-255
  const octets = ip.split('.');
  for (const octet of octets) {
    const num = parseInt(octet, 10);
    if (num < 0 || num > 255 || isNaN(num)) {
      return false;
    }
  }
  
  return true;
}

function isValidHostname(hostname: string): boolean {
  const hostnameRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*$/;
  return hostnameRegex.test(hostname);
}

// Sanitize filename to prevent path traversal
export const sanitizeFilename = (filename: string): string => {
  // Remove path components and non-alphanumeric characters (except dots and dashes)
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
};
