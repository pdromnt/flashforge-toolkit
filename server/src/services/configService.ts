import fs from 'fs';
import path from 'path';
import { log } from '../utils/logger';

export interface ServerConfig {
  printerIP: string;
  printerPort: number;
  serverPort: number;
  debug: boolean;
}

const CONFIG_FILE = path.join(__dirname, '../../config.json');

// Default configuration
const defaultConfig: ServerConfig = {
  printerIP: process.env.PRINTER_IP || '192.168.1.100',
  printerPort: parseInt(process.env.PRINTER_PORT || '8899', 10),
  serverPort: parseInt(process.env.SERVER_PORT || '3000', 10),
  debug: process.env.PRINTER_DEBUG === 'true'
};

let currentConfig: ServerConfig = { ...defaultConfig };

export function loadConfig(): ServerConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const savedConfig = JSON.parse(data);
      currentConfig = { ...defaultConfig, ...savedConfig };
    }
  } catch (error) {
    log.config.error('Error loading config file, using defaults', error);
    currentConfig = { ...defaultConfig };
  }
  return currentConfig;
}

export function saveConfig(config: Partial<ServerConfig>): ServerConfig {
  currentConfig = { ...currentConfig, ...config };
  
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
    log.config.saved();
  } catch (error) {
    log.config.error('Error saving config', error);
    throw new Error('Failed to save configuration');
  }
  
  return currentConfig;
}

export function getConfig(): ServerConfig {
  return currentConfig;
}

// Initialize config on module load
loadConfig();
