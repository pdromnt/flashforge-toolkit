import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PRINTER_IP, PRINTER_PORT, SERVER_PORT } from './stores/configStore';
import printerRoutes from './routes/printerRoutes';
import notificationRoutes from './routes/notificationRoutes';
import configRoutes from './routes/configRoutes';
import { setupPrinterSocket } from './services/printerSocketService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { log } from './utils/logger';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware setup
app.use(bodyParser.json());

// Serve the client's static files
app.use('/', express.static(path.join(__dirname, '../../client/dist')));

// Routes
app.use(printerRoutes);
app.use(notificationRoutes);
app.use(configRoutes);

// Setup Socket.IO for real-time printer updates
setupPrinterSocket(io);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

// Start the server
server.listen(SERVER_PORT, () => {
  log.info(`
    ________           __    ____                         ____             __    __                         __
   / ____/ /___ ______/ /_  / __/___  _________ ____     / __ \____ ______/ /_  / /_  ____  ____ __________/ /
  / /_  / / __ \`/ ___/ __ \/ /_/ __ \/ ___/ __ \`/ _ \   / / / / __ \`/ ___/ __ \/ __ \/ __ \/ __ \`/ ___/ __  /
 / __/ / / /_/ (__  ) / / / __/ /_/ / /  / /_/ /  __/  / /_/ / /_/ (__  ) / / / /_/ / /_/ / /_/ / /  / /_/ /
/_/   /_/\__,_/____/_/ /_/_/  \____/_/   \__, /\___/  /_____/\__,_/____/_/ /_/_.___/\____/\__,_/_/   \__,_/
                                         /____/                                                                `);

  log.info(`Server running on http://localhost:${SERVER_PORT}`);
  log.info(`Printer configured at ${PRINTER_IP}:${PRINTER_PORT}`);
});

export { io };
