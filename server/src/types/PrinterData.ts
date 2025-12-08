export type PrinterInfo = {
  machineName: string;
  firmware: string;
  serialNumber: string;
}

export type PrinterData = {
  printerConnection: string;
  printerStatus: string;
  printProgress: number;
  extruderTemperature: string;
  printerInfo: PrinterInfo | string;
  printerAddress: string;
}