
import fs from 'fs';
import { gxMetaParser } from '../utils/gxMetaParser.js';
import { gxEncoder } from '../utils/gxEncoder.js';
import { PrinterSocketClient, SerialMessage } from '../utils/printerSocket.js';
import { setNotification } from '../services/notificationStore.js';

// Core upload logic
async function uploadGcode({
  host,
  port,
  localFilePath,
  remoteFileName,
  startPrint,
  onProgress, // function(sentBytes, totalBytes)
}: {
  host: string;
  port: number;
  localFilePath: string;
  remoteFileName: string;
  startPrint: boolean;
  onProgress: (sent: number, total: number) => void;
}) {
  // Parse G-code to GX
  console.log(`[LOG] Parsing G-code into GX: ${localFilePath}`);
  const gcodeContent = fs.readFileSync(localFilePath, 'utf8');
  const parser = new gxMetaParser();
  const { meta, thumbnail } = await parser.parse(gcodeContent);

  const gxService = new gxEncoder();

  // Ensure we have a valid buffer for G-code part
  const gcodeBuffer = Buffer.from(gcodeContent, 'utf8');

  // Create GX file paths
  const gxFilePath = localFilePath.replace(/\.gcode$/i, '') + '.gx';
  const gxRemoteFileName = remoteFileName.replace(/\.gcode$/i, '') + '.gx';

  // Encode
  const gxBuffer = gxService.encode(gcodeBuffer, thumbnail || Buffer.alloc(0), meta);
  fs.writeFileSync(gxFilePath, gxBuffer);

  // 1) Queue setup commands
  const client = new PrinterSocketClient(host, port);

  client.enqueueCmd(new SerialMessage("~M601 S1\r\n", "command")); // control enable
  client.enqueueCmd(new SerialMessage("~M650\r\n", "command"));    // connect
  client.enqueueCmd(new SerialMessage("~M119\r\n", "command"));    // status

  console.log(`[LOG] Uploading GX file to printer: ${gxRemoteFileName}`);
  // 2) File upload command with exact size (original file size, not padded)
  const fileSize = fs.statSync(gxFilePath).size;
  client.enqueueCmd(new SerialMessage(`~M28 ${fileSize} 0:/user/${gxRemoteFileName}\r\n`, "command"));

  // 3) Packetized data stream
  client.enqueueCmd(new SerialMessage({
    filePath: gxFilePath,
    packetSize: 4096,
    progressCb: onProgress,
  }, "data"));

  // 4) Save file
  client.enqueueCmd(new SerialMessage("~M29\r\n", "command"));

  // 5) Optional start print
  if (startPrint) {
    client.enqueueCmd(new SerialMessage(`~M23 0:/user/${gxRemoteFileName}\r\n`, "command"));
  } else {
    client.enqueueCmd(new SerialMessage("~M26\r\n", "command"));
  }

  // 6) Run the queue
  await client.runQueue();

  // Set notification for UI
  setNotification('uploadComplete', { filename: gxRemoteFileName });

  return true;
}

export { uploadGcode };