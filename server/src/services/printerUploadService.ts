
import fs from 'fs';
import { gxMetaParser } from '../utils/gxMetaParser';
import { gxEncoder } from '../utils/gxEncoder';
import { PrinterSocketClient, SerialMessage } from '../utils/printerSocket';
import { setNotification } from '../stores/notificationStore';
import { startPrint as startPrintCommand } from '../services/printerStatusService';

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

  // 5) End upload mode (always send M26 to close session cleanly)
  client.enqueueCmd(new SerialMessage("~M26\r\n", "command"));

  // 6) Run the queue
  await client.runQueue();

  // 7) Handle Post-Upload Actions
  if (startPrint) {
    console.log(`[LOG] Auto-starting print for: ${gxRemoteFileName}`);
    try {
      await startPrintCommand(gxRemoteFileName);
    } catch (e) {
      console.error(`[ERROR] Failed to auto-start print: ${e}`);
    }
  } else {
    // Set notification for UI only if we didn't auto-start
    setNotification('uploadComplete', { filename: gxRemoteFileName });
  }

  return true;
}

export { uploadGcode };