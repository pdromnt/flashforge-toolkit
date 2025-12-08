import { Router } from 'express';
import { uploadGcode } from '../services/printerUploadService';
import { connectToPrinter, getPrinterStatus, getPrintProgress, getExtruderTemperature, getPrinterInfo } from '../services/printerStatusService';
import { PRINTER_IP, PRINTER_PORT } from '../stores/configStore';
import { PrinterData } from '../types/PrinterData';
import multer from 'multer';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Fake OctoPrint endpoint to support Orca's direct upload
router.get('/api/version', (req, res) => {
  res.json({
    api: "0.1",
    server: "1.3.10",
    text: "OctoPrint 1.3.10" // OrcaSlicer looks for "OctoPrint" in this string
  });
});

//Status endpoint
router.get('/status', async (_req: any, res: any) => {
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

  console.log(`[LOG] Printer data request - ${new Date()}`);

  try {
    printerData.printerConnection = await connectToPrinter();
    printerData.printerStatus = await getPrinterStatus();
    printerData.printProgress = await getPrintProgress();
    printerData.extruderTemperature = await getExtruderTemperature();
    printerData.printerInfo = await getPrinterInfo();
    printerData.printerAddress = PRINTER_IP;
  } catch (res) {
    printerData.printerConnection = res;
  }

  res.status(200).send(printerData);
});

// Upload endpoint
router.post(['/upload', '/api/files/local'], upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const remoteFileName = req.file.originalname;
  const startPrint = req.body.print;

  console.log(`[LOG] Received file for upload: ${req.file.originalname} - ${new Date()}`);

  try {
    await uploadGcode({
      host: PRINTER_IP,
      port: PRINTER_PORT,
      localFilePath: filePath,
      remoteFileName,
      startPrint,
      onProgress: (sent, total) => {
        const pct = ((sent / total) * 100).toFixed(2);
        process.stdout.write(`[LOG] Uploaded: ${sent}/${total} bytes (${pct}%)\r`);
        res.write(`data: ${JSON.stringify({ sent, total, pct })}\n\n`)

        if (pct === '100.00') {
          process.stdout.write('\n');
        }
      }
    });
    console.log('[LOG] Upload complete.');
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    // cleanup temp files
    fs.unlinkSync(filePath + '.gx');
    fs.unlinkSync(filePath);
  }
});

export default router;