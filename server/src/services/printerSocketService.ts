import { Server as SocketIOServer } from 'socket.io';
import { PrinterData } from '../types/PrinterData';
import {
  connectToPrinter,
  getPrinterStatus,
  getPrintProgress,
  getExtruderTemperature,
  getPrinterInfo
} from './printerStatusService';
import { PRINTER_IP } from '../stores/configStore';
import { log } from '../utils/logger';

const UPDATE_INTERVAL_MS = 5000; // 5 seconds
let updateInterval: NodeJS.Timeout | null = null;

async function fetchPrinterData(): Promise<PrinterData> {
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
    printerAddress: PRINTER_IP
  };

  try {
    printerData.printerConnection = await connectToPrinter();
    printerData.printerStatus = await getPrinterStatus();
    printerData.printProgress = await getPrintProgress();
    printerData.extruderTemperature = await getExtruderTemperature();
    printerData.printerInfo = await getPrinterInfo();
  } catch (error: any) {
    printerData.printerConnection = error.message || 'Connection failed';
  }

  return printerData;
}

export function setupPrinterSocket(io: SocketIOServer) {
  io.on('connection', (socket) => {
    log.socket.connect(socket.id);

    // Send initial data immediately
    fetchPrinterData().then(data => {
      socket.emit('printer:status', data);
    }).catch(err => {
      log.socket.error(socket.id, err);
    });

    socket.on('disconnect', (reason) => {
      log.socket.disconnect(socket.id, reason);
    });

    socket.on('error', (error) => {
      log.socket.error(socket.id, error);
    });
  });

  // Start broadcasting to all clients
  if (!updateInterval) {
    updateInterval = setInterval(async () => {
      try {
        const data = await fetchPrinterData();
        io.emit('printer:status', data);
      } catch (error) {
        log.error('Error broadcasting printer data', error);
      }
    }, UPDATE_INTERVAL_MS);
  }

  log.info('Printer socket service initialized');
}

export function stopPrinterSocket() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    log.info('Printer socket service stopped');
  }
}
