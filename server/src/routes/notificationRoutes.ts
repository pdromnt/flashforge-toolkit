import express from 'express';
import { getNotification, clearNotification } from '../stores/notificationStore';
import { startPrint } from '../services/printerStatusService';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { log } from '../utils/logger';

const router = express.Router();

router.get('/notifications', asyncHandler(async (_req, res) => {
  const notification = getNotification();
  res.json(notification);
}));

router.post('/notifications/response', asyncHandler(async (req, res) => {
  const { response } = req.body;
  const notification = getNotification();

  if (!notification || notification.type !== 'uploadComplete') {
    throw new AppError('No active upload notification', 400);
  }

  if (response === 'yes') {
    const filename = notification.data.filename;
    log.info(`User accepted print for: ${filename}`);

    try {
      await startPrint(filename);
      clearNotification();
      res.json({ status: 'Print started' });
    } catch (err: any) {
      log.error('Failed to start print', err);
      throw new AppError('Failed to start print', 500);
    }
  } else {
    log.info('User declined print');
    clearNotification();
    res.json({ status: 'Notification dismissed' });
  }
}));

export default router;
