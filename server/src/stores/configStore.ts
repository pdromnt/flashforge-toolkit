import dotenv from 'dotenv';
import { getConfig } from '../services/configService';

dotenv.config();

// Export values - use config service if available, fall back to env vars
const config = getConfig();

export const PRINTER_DEBUG = config.debug?.toString() || process.env.PRINTER_DEBUG || 'false';
export const PRINTER_IP = config.printerIP || process.env.PRINTER_IP || '0.0.0.0';
export const PRINTER_PORT = config.printerPort || Number(process.env.PRINTER_PORT) || 8899;
export const SERVER_PORT = config.serverPort?.toString() || process.env.SERVER_PORT || '3000';
