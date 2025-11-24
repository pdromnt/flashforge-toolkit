import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import path from 'path';
import { PRINTER_IP, SERVER_PORT } from './stores/configStore';
import printerRoutes from './routes/printerRoutes';

const app = express();

// CORS configuration options
const corsOptions = {
  origin: true,
  optionsSuccessStatus: 200,
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware setup
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(helmet());

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// Serve the client's static files
app.use('/', express.static(path.join(__dirname,'../', 'client/dist')));

// Routes
app.use(printerRoutes);

// Start the server
app.listen(SERVER_PORT, () => {
  console.log(`Flashforge Dashboard`);
  console.log(`Internally running on http://localhost:${SERVER_PORT}`);
  console.log(`Printer located at ${PRINTER_IP}`);
});