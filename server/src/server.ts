import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { PRINTER_IP, PRINTER_PORT, SERVER_PORT } from './stores/configStore';
import printerRoutes from './routes/printerRoutes';

const app = express();

// Middleware setup
app.use(bodyParser.json());

// Serve the client's static files
app.use('/', express.static(path.join(__dirname, '../../client/dist')));

// Routes
app.use(printerRoutes);

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`Flashforge Dashboard`);
  console.log(`Internally running on http://localhost:${SERVER_PORT}`);
  console.log(`Printer located at ${PRINTER_IP}:${PRINTER_PORT}`);
});