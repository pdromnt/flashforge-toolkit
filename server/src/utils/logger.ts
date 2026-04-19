import pino from 'pino';
import { PRINTER_DEBUG } from '../stores/configStore';

const isDebug = PRINTER_DEBUG === 'true';

const logger = pino({
  level: isDebug ? 'debug' : 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  base: undefined, // Remove pid and hostname from logs
});

// Export wrapped logger with consistent naming
export const log = {
  info: (msg: string, obj?: Record<string, unknown>) => obj ? logger.info(obj, msg) : logger.info(msg),
  error: (msg: string, obj?: Record<string, unknown> | Error) => {
    if (obj instanceof Error) {
      logger.error({ err: obj }, msg);
    } else if (obj) {
      logger.error(obj, msg);
    } else {
      logger.error(msg);
    }
  },
  warn: (msg: string, obj?: Record<string, unknown>) => obj ? logger.warn(obj, msg) : logger.warn(msg),
  debug: (msg: string, obj?: Record<string, unknown>) => obj ? logger.debug(obj, msg) : logger.debug(msg),

  // Socket-specific logging
  socket: {
    connect: (id: string) => logger.info(`[SOCKET] Client connected: ${id}`),
    disconnect: (id: string, reason: string) => logger.info(`[SOCKET] Client disconnected: ${id}, reason: ${reason}`),
    error: (id: string, error: unknown) => logger.error({ err: error }, `[SOCKET] Error on client ${id}`),
  },

  // Printer-specific logging
  printer: {
    request: () => logger.info(`[PRINTER] Data request - ${new Date()}`),
    upload: (filename: string) => logger.info(`[PRINTER] Upload started: ${filename}`),
    uploadProgress: (sent: number, total: number, pct: string) => {
      logger.debug(`[PRINTER] Uploaded: ${sent}/${total} bytes (${pct}%)`);
    },
    uploadComplete: () => logger.info('[PRINTER] Upload complete'),
    error: (msg: string, error?: unknown) => {
      if (error) {
        logger.error({ err: error }, `[PRINTER] ${msg}`);
      } else {
        logger.error(`[PRINTER] ${msg}`);
      }
    },
  },

  // Config-specific logging
  config: {
    loaded: () => logger.info('[CONFIG] Configuration loaded'),
    saved: () => logger.info('[CONFIG] Configuration saved'),
    error: (msg: string, error?: unknown) => {
      if (error) {
        logger.error({ err: error }, `[CONFIG] ${msg}`);
      } else {
        logger.error(`[CONFIG] ${msg}`);
      }
    },
  }
};

export default logger;
