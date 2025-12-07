import { Socket } from "net";
import { PRINTER_IP, PRINTER_PORT } from '../stores/configStore';
import { PrinterInfo } from '../types/printerData';

function connectToPrinter(): Promise<string> {
  const client = new Socket();

  client.connect(PRINTER_PORT, PRINTER_IP, () => {
    console.log('Connecting...');
    client.write('~M601 S1\r\n'); // Req. Control
  });

  return new Promise((resolve, reject) => {
    client.on('data', (data) => {
      if (data.includes('Control Success.')) {
        console.log('Connected - ' + new Date());
        client.destroy();
        resolve('Connected');
      }
    });

    client.on('error', () => {
      console.log('Connection failed - ' + new Date());
      client.destroy();
      reject('Connection failed (Printer offline?)');
    });
  });
}

function getPrinterStatus(): Promise<string> {
  const client = new Socket();
  client.connect(PRINTER_PORT, PRINTER_IP, () => {
    console.log('Requesting machine status...');
    client.write('~M119\r\n'); // Status
  });

  return new Promise((resolve) => {
    client.on('data', (data) => {
      console.log(`Data returned:\n ${data.toString()}`);
      client.destroy();
      resolve(
        data.toString().includes('MachineStatus: READY')
          ? 'Idle/Ready'
          : data.toString().includes('MachineStatus: BUILDING_FROM_SD')
            ? 'Printing'
            : 'Unknown Status',
      );
    });
  });
}

function getPrintProgress(): Promise<number> {
  const client = new Socket();
  client.connect(PRINTER_PORT, PRINTER_IP, () => {
    console.log('Requesting print progress...');
    client.write('~M27\r\n'); // Progress
  });

  return new Promise((resolve) => {
    client.on('data', (data) => {
      console.log(`Data returned:\n ${data.toString()}`);
      client.destroy();
      resolve(Number(data.toString().split('byte ')[1].split('/')[0]));
    });
  });
}

function getExtruderTemperature(): Promise<string> {
  const client = new Socket();
  client.connect(PRINTER_PORT, PRINTER_IP, () => {
    console.log('Requesting extruder temperature...');
    client.write('~M105\r\n'); // Temperature
  });

  return new Promise((resolve) => {
    client.on('data', (data) => {
      console.log(`Data returned:\n ${data.toString()}`);
      client.destroy();
      resolve(
        data.toString().split(' ')[2].replace('Received.\r\nT0:', '') + 'ºC',
      );
    });
  });
}

function getPrinterInfo(): Promise<PrinterInfo> {
  const client = new Socket();
  client.connect(PRINTER_PORT, PRINTER_IP, () => {
    console.log('Requesting printer information...');
    client.write('~M115\r\n'); // Printer info
  });

  return new Promise((resolve) => {
    client.on('data', (data) => {
      console.log(`Data returned:\n ${data.toString()}`);
      client.destroy();

      const machineNameMatch = data.toString().match(/Machine Name: (.+)/);
      const firmwareMatch = data.toString().match(/Firmware: (.+)/);
      const serialNumberMatch = data.toString().match(/SN: (.+)/);

      resolve({
        machineName: machineNameMatch ? machineNameMatch[1].trim() : 'Unknown',
        firmware: firmwareMatch ? firmwareMatch[1].trim() : 'Unknown',
        serialNumber: serialNumberMatch ? serialNumberMatch[1].trim() : 'Unknown',
      });
    });
  });
}

export {
  connectToPrinter,
  getPrinterStatus,
  getPrintProgress,
  getExtruderTemperature,
  getPrinterInfo,
};