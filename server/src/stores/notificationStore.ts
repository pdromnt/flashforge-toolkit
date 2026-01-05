
interface Notification {
    type: string;
    data: any;
    timestamp: number;
}

let currentNotification: Notification | null = null;
const NOTIFICATION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export const setNotification = (type: string, data: any) => {
    currentNotification = {
        type,
        data,
        timestamp: Date.now(),
    };
};

export const getNotification = () => {
    if (!currentNotification) return null;

    // Check timeout
    if (Date.now() - currentNotification.timestamp > NOTIFICATION_TIMEOUT_MS) {
        currentNotification = null;
        return null;
    }

    return currentNotification;
};

export const clearNotification = () => {
    currentNotification = null;
};
