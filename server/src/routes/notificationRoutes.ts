
import express from 'express';
import { getNotification, setNotification, clearNotification } from '../services/notificationStore';
import { startPrint } from '../services/printerStatusService';

const router = express.Router();

router.get('/notifications', (req, res) => {
    const notification = getNotification();
    res.json(notification);
});

router.post('/notifications/response', async (req, res) => {
    const { response } = req.body;
    const notification = getNotification();

    if (!notification || notification.type !== 'uploadComplete') {
        res.status(400).json({ error: 'No active upload notification' });
        return;
    }

    if (response === 'yes') {
        const filename = notification.data.filename;
        console.log(`[LOG] User accepted print for: ${filename}`);

        try {
            await startPrint(filename);
            clearNotification();
            res.json({ status: 'Print started' });
        } catch (err: any) {
            // cast err to any or Error
            console.error(`[ERROR] Failed to start print: ${err}`);
            res.status(500).json({ error: 'Failed to start print' });
        }
    } else {
        console.log(`[LOG] User declined print.`);
        clearNotification();
        res.json({ status: 'Notification dismissed' });
    }
});

export default router;
