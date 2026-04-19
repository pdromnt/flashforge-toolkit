import io from 'socket.io-client';
import type { PrinterData } from '../types/printerData';

const SOCKET_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:3000'
  : window.location.origin;

type SocketType = ReturnType<typeof io>;

class PrinterSocketService {
  private socket: SocketType | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // Start with 5 seconds
  private maxReconnectDelay = 60000; // Max 1 minute
  private onStatusCallback: ((data: PrinterData) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: ((reason: string) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  connect(): void {
    if (this.socket?.connected) {
      console.log('[SOCKET] Already connected');
      return;
    }

    console.log('[SOCKET] Connecting to server...');

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: this.maxReconnectDelay,
      randomizationFactor: 0.5,
    });

    this.socket.on('connect', () => {
      console.log('[SOCKET] Connected to server');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 5000;
      this.onConnectCallback?.();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log(`[SOCKET] Disconnected: ${reason}`);
      this.onDisconnectCallback?.(reason);

      // If the disconnect was initiated by the server, we need to manually reconnect
      if (reason === 'io server disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[SOCKET] Connection error:', error.message);
      this.onErrorCallback?.(error);
      this.handleReconnect();
    });

    this.socket.on('printer:status', (data: PrinterData) => {
      this.onStatusCallback?.(data);
    });
  }

  private handleReconnect(): void {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SOCKET] Max reconnection attempts reached. Giving up.');
      this.socket?.disconnect();
      return;
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    const finalDelay = Math.max(1000, delay + jitter);

    console.log(`[SOCKET] Reconnecting in ${(finalDelay / 1000).toFixed(1)}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
  }

  private scheduleReconnect(): void {
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[SOCKET] Manually disconnected');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  onStatus(callback: (data: PrinterData) => void): void {
    this.onStatusCallback = callback;
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: (reason: string) => void): void {
    this.onDisconnectCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }
}

export const printerSocket = new PrinterSocketService();
export default PrinterSocketService;
