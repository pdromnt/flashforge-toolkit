import { PrinterSocketClient, SerialMessage } from '../utils/printerSocket';
import { PRINTER_IP, PRINTER_PORT, PRINTER_DEBUG } from '../stores/configStore';
import { PrinterInfo } from '../types/PrinterData';

async function executeSimpleCommand(command: string, expectRegex?: RegExp): Promise<string> {
  const client = new PrinterSocketClient(PRINTER_IP, PRINTER_PORT, { readTimeoutMs: 5000, writeTimeoutMs: 5000 });
  client.enqueueCmd(new SerialMessage(command, 'command'));
  await client._connect();
  const result = await client._sendCommandAndWait(command + '\r\n', { expectRegex: expectRegex || /.+/ });
  client.client.destroy();
  return result as string;
}

async function connectToPrinter(): Promise<string> {
  // M601 S1 -> Expect "Control Success"
  const res = await executeSimpleCommand('~M601 S1', /Control Success/i);
  return 'Connected';
}

async function getPrinterStatus(): Promise<string> {
  // M119 -> Expect "MachineStatus"
  const data = await executeSimpleCommand('~M119', /MachineStatus/i);
  debugLog(data);
  return data.includes('MachineStatus: READY')
    ? 'Idle/Ready'
    : data.includes('MachineStatus: BUILDING_FROM_SD')
      ? 'Printing'
      : 'Unknown Status';
}

async function getPrintProgress(): Promise<number> {
  // M27 -> Expect "byte"
  const data = await executeSimpleCommand('~M27', /byte/i);
  debugLog(data);
  try {
    return Number(data.split('byte ')[1].split('/')[0]);
  } catch (e) {
    return 0;
  }
}

async function getExtruderTemperature(): Promise<string> {
  // M105 -> Expect "Received" or "T0"
  const data = await executeSimpleCommand('~M105', /T0:/i);
  debugLog(data);
  try {
    const match = data.match(/T0:\s*(\d+)/i);
    return match ? match[1] + 'ºC' : 'Unknown';
  } catch (e) {
    return 'Unknown';
  }
}

async function getPrinterInfo(): Promise<PrinterInfo> {
  // M115 -> Expect "Machine Name" or "SN"
  const data = await executeSimpleCommand('~M115', /SN:/i);
  debugLog(data);

  const machineNameMatch = data.match(/Machine Name: (.+)/);
  const firmwareMatch = data.match(/Firmware: (.+)/);
  const serialNumberMatch = data.match(/SN: (.+)/);

  return {
    machineName: machineNameMatch ? machineNameMatch[1].trim() : 'Unknown',
    firmware: firmwareMatch ? firmwareMatch[1].trim() : 'Unknown',
    serialNumber: serialNumberMatch ? serialNumberMatch[1].trim() : 'Unknown',
  };
}

async function startPrint(filename: string): Promise<string> {
  // Command: ~M23 0:/user/filename.gx
  const cmd = `~M23 0:/user/${filename}`;
  const res = await executeSimpleCommand(cmd, /Result: ok|ok|Control Success|Start/i);
  return res;
}

function debugLog(data: string) {
  if (PRINTER_DEBUG === 'true') {
    console.log(`[LOG] Data returned:\n ${data}`);
  }
}

export {
  connectToPrinter,
  getPrinterStatus,
  getPrintProgress,
  getExtruderTemperature,
  getPrinterInfo,
  startPrint,
};
