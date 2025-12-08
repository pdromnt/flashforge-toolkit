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
  console.log(`
    ________           __    ____                         ____             __    __                         __
   / ____/ /___ ______/ /_  / __/___  _________ ____     / __ \\____ ______/ /_  / /_  ____  ____ __________/ /
  / /_  / / __ \`/ ___/ __ \\/ /_/ __ \\/ ___/ __ \`/ _ \\   / / / / __ \`/ ___/ __ \\/ __ \\/ __ \\/ __ \`/ ___/ __  / 
 / __/ / / /_/ (__  ) / / / __/ /_/ / /  / /_/ /  __/  / /_/ / /_/ (__  ) / / / /_/ / /_/ / /_/ / /  / /_/ /  
/_/   /_/\\__,_/____/_/ /_/_/  \\____/_/   \\__, /\\___/  /_____/\\__,_/____/_/ /_/_.___/\\____/\\__,_/_/   \\__,_/   
                                        /____/                                                                `);

  console.log(`[INFO] Internally running on http://localhost:${SERVER_PORT}`);
  console.log(`[INFO] Printer located at ${PRINTER_IP}:${PRINTER_PORT}`);
});