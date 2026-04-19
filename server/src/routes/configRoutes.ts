import { Router } from 'express';
import { getConfig, saveConfig } from '../services/configService';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get current configuration
router.get('/api/config', asyncHandler(async (_req, res) => {
  const config = getConfig();
  res.json(config);
}));

// Update configuration
router.post('/api/config', asyncHandler(async (req, res) => {
  const { printerIP, printerPort, debug } = req.body;

  // Validate inputs
  if (printerIP !== undefined) {
    const looksLikeIP = /^[\d.]+$/.test(printerIP);
    if (looksLikeIP) {
      const octets = printerIP.split('.');
      if (octets.length !== 4) {
        throw new AppError('Invalid IP address format', 400);
      }
      for (const octet of octets) {
        const num = parseInt(octet, 10);
        if (num < 0 || num > 255 || isNaN(num)) {
          throw new AppError('Invalid IP address - octets must be 0-255', 400);
        }
      }
    } else {
      // Hostname validation
      const hostnameRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*$/;
      if (!hostnameRegex.test(printerIP)) {
        throw new AppError('Invalid hostname', 400);
      }
    }
  }

  if (printerPort !== undefined) {
    const port = parseInt(printerPort, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new AppError('Port must be between 1 and 65535', 400);
    }
  }

  const updatedConfig = saveConfig({
    ...(printerIP !== undefined && { printerIP }),
    ...(printerPort !== undefined && { printerPort }),
    ...(debug !== undefined && { debug: Boolean(debug) })
  });

  res.json({
    message: 'Configuration updated successfully',
    config: updatedConfig,
    note: 'Some changes may require a server restart to take full effect'
  });
}));

export default router;
