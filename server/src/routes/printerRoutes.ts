import { Router } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import Busboy from 'busboy';
import { uploadFileToPrinter } from '../services/printerUploadService';
import { connectToPrinter, getPrinterStatus, getPrintProgress, getExtruderTemperature } from '../services/printerSocketService';
import { PRINTER_IP, PRINTER_PORT } from '../stores/configStore';
import { PrinterData } from '../types/printerData';

const router = Router();

router.get('/data', async (_req: any, res: any) => {
  const printerData: PrinterData = {
    printerConnection: '',
    printerStatus: '',
    printProgress: 0,
    extruderTemperature: '',
    printerAddress: ''
  };

  try {
    printerData.printerConnection = await connectToPrinter();
    printerData.printerStatus = await getPrinterStatus();
    printerData.printProgress = await getPrintProgress();
    printerData.extruderTemperature = await getExtruderTemperature();
    printerData.printerAddress = PRINTER_IP;
  } catch (res) {
    printerData.printerConnection = res;
  }

  console.log(printerData);

  res.status(200).send(printerData);
});


// Usage: POST a .gx file to /upload?host=PRINTER_IP&start=true
// Add ?model=m5 to specify printer model (default is classic)
/** DOCS:
 * Buffering: Upload is written to a temp file in /tmp. Once finished, we know the file size and can announce it in ~M28.

 * Handshake: Sends ~M601 S1, then ~M640 (or ~M650 for Guider), then ~M119.

 * Data phase: Streams file in 4096-byte packets with 16-byte headers. Last packet padded with 0x00. CRC computed on unpadded data.

 * Finalize: Sends ~M29.

 * Optional start: If ?start=true, sends ~M23 0:/user/<filename>.
**/
router.post('/upload', (req, res) => {
  const model = (req.query.model as string || 'classic').toLowerCase();
  const startPrint = (req.query.start as string || 'false').toLowerCase() === 'true';

  const busboy = Busboy({ headers: req.headers });
  let handled = false;

  busboy.on('file', (fieldname, fileStream, info) => {
    if (fieldname !== 'file' || handled) {
      fileStream.resume();
      return;
    }
    handled = true;

    const filename = path.basename(info.filename || `upload-${Date.now()}.gx`);
    const tmpPath = path.join(os.tmpdir(), `ffgx-${crypto.randomUUID()}-${filename}`);
    const tmpWrite = fs.createWriteStream(tmpPath);

    fileStream.pipe(tmpWrite);

    tmpWrite.on('finish', async () => {
      try {
        await uploadFileToPrinter({ host: PRINTER_IP, port: PRINTER_PORT, filename, filePath: tmpPath, model, startPrint });
        res.status(200).send('File uploaded to printer successfully');
      } catch (err) {
        console.error(err);
        res.status(500).send('Upload failed');
      } finally {
        fs.unlink(tmpPath, () => {});
      }
    });

    tmpWrite.on('error', (err) => {
      console.error('Temp write error:', err);
      res.status(500).send('Failed to buffer upload');
    });
  });

  busboy.on('finish', () => {
    if (!handled && !res.headersSent) {
      res.status(400).send('No file field named "file" provided');
    }
  });

  req.pipe(busboy);
});

export default router;