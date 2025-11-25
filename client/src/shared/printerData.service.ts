import type { PrinterData } from './printerData.type';

export const getPrinterData = async (): Promise<PrinterData> => {
  let apiUrl = '';
  if (import.meta.env.MODE === 'development') {
    apiUrl = 'http://localhost:3000/data';
  } else {
    apiUrl = '/data';
  }

  return fetch(apiUrl)
    .then((res: any) => res.json())
    .then((res: PrinterData) => {
      return res;
    });
};
