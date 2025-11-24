import { Router } from 'express';
import { PRINTER_IP } from '../stores/configStore';
import { connectToPrinter, getPrinterStatus, getPrintProgress, getExtruderTemperature } from '../services/printerSocketService';
import { PrinterData } from '../types/printerData';

const router = Router();

router.get('/getData', async (_req: any, res: any) => {
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

export default router;