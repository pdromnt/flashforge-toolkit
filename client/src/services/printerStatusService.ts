import type { PrinterData } from '../types/printerData';

export const getPrinterData = async (): Promise<PrinterData> => {
  let apiUrl = '';

  if (import.meta.env.MODE === 'development') {
    apiUrl = 'http://localhost:3000/status';
  } else {
    apiUrl = '/status';
  }

  return fetch(apiUrl)
    .then((res: any) => res.json())
    .then((res: PrinterData) => {
      return res;
    });
};
