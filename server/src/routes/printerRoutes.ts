import { Router } from 'express';
import { uploadGcode } from '../services/printerUploadService';
import { connectToPrinter, getPrinterStatus, getPrintProgress, getExtruderTemperature } from '../services/printerStatusService';
import { PRINTER_IP, PRINTER_PORT } from '../stores/configStore';
import { PrinterData } from '../types/printerData';
import multer from 'multer';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

//Status endpoint
router.get('/status', async (_req: any, res: any) => {
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

// Upload endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  const remoteFileName = req.file.originalname;

  try {
    await uploadGcode({
      host: PRINTER_IP,
      port: PRINTER_PORT,
      localFilePath: filePath,
      remoteFileName,
      startPrint: false,
      onProgress: (sent, total) => {
        const pct = ((sent / total) * 100).toFixed(2);
        process.stdout.write(`Uploaded: ${sent}/${total} bytes (${pct}%)\r`);
        res.write(`data: ${JSON.stringify({ sent, total, pct })}\n\n`)

        if (pct === '100.00') {
          process.stdout.write('\n');
        }
      }
    });
    console.log('Upload complete.');
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