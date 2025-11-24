import dotenv from 'dotenv';
dotenv.config();

export const PRINTER_IP = process.env.PRINTER_IP || '0.0.0.0';
export const PRINTER_PORT = Number(process.env.PRINTER_PORT) || 8899;
export const SERVER_PORT = process.env.SERVER_PORT || '3000';