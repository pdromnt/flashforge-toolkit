import { Router } from 'express';
import { uploadGcode } from '../services/printerUploadService';
import {
  connectToPrinter,
  getPrinterStatus,
  getPrintProgress,
  getExtruderTemperature,
  getPrinterInfo
} from '../services/printerStatusService';
import { PRINTER_IP, PRINTER_PORT } from '../stores/configStore';
import { PrinterData } from '../types/PrinterData';
import fs from 'fs';
import { upload, sanitizeFilename } from '../middleware/uploadValidation';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { log } from '../utils/logger';

const router = Router();

// Fake OctoPrint endpoint to support Orca's direct upload
router.get('/api/version', (_req, res) => {
  res.json({
    api: "0.1",
    server: "1.3.10",
    text: "OctoPrint 1.3.10" // OrcaSlicer looks for "OctoPrint" in this string
  });
});

// Status endpoint with proper error handling
router.get('/status', asyncHandler(async (_req, res) => {
  const printerData: PrinterData = {
    printerConnection: '',
    printerStatus: '',
    printProgress: 0,
    extruderTemperature: '',
    printerInfo: {
      machineName: '',
      firmware: '',
      serialNumber: ''
    },
    printerAddress: ''
  };

  log.printer.request();

  try {
    printerData.printerConnection = await connectToPrinter();
    printerData.printerStatus = await getPrinterStatus();
    printerData.printProgress = await getPrintProgress();
    printerData.extruderTemperature = await getExtruderTemperature();
    printerData.printerInfo = await getPrinterInfo();
    printerData.printerAddress = PRINTER_IP;
  } catch (error: any) {
    printerData.printerConnection = error.message || 'Connection failed';
    // Don't throw here - we want to return partial data
  }

  res.status(200).json(printerData);
}));

// Upload endpoint with validation
router.post(
  ['/upload', '/api/files/local'], 
  upload.single('file'), 
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const filePath = req.file.path;
    const remoteFileName = sanitizeFilename(req.file.originalname);
    const startPrint = req.body.print === 'true' || req.body.print === true;

    log.printer.upload(`${req.file.originalname} -> ${remoteFileName}`);

    try {
      await uploadGcode({
        host: PRINTER_IP,
        port: PRINTER_PORT,
        localFilePath: filePath,
        remoteFileName,
        startPrint,
        onProgress: (sent, total) => {
          const pct = ((sent / total) * 100).toFixed(2);
          log.printer.uploadProgress(sent, total, pct);
          res.write(`data: ${JSON.stringify({ sent, total, pct })}\n\n`);
        }
      });

      log.printer.uploadComplete();
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    } finally {
      // cleanup temp files
      try {
        if (fs.existsSync(filePath + '.gx')) fs.unlinkSync(filePath + '.gx');
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        log.printer.error('Failed to cleanup temp files', e);
      }
    }
  })
);

export default router;
