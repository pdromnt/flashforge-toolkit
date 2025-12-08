# Flashforge Dashboard 

![Flashforge Dashboard](./client/src/assets/flashforge-dark.png)

An intuitive dashboard for older Flashforge printers, featuring a NodeJS server that retrieves printer data and delivers it to a static Vue3 client (served statically by the server, so no client fiddling!) that displays “real-time” printer status, the printer’s webcam, and facilitates file uploads, all in a single package. 

<details>
<summary>Server Setup Instructions</summary>

**First** go inside the `server` folder (or open it with another VSCode window), then run the commands below.

### Installation

```bash
$ npm i
```

### Running the server

```bash
$ npm start
```

### Extra Info

Inside the `.env` you can find where to put your printer's IP address (make sure it's a static IP set in your router), and that's all you need in order to start seeing data from your printer in the client. You don't usually need to change the printer's port.
</details>

<br />  

<details>
<summary>Client Setup Instructions</summary>
**First** go inside the `client` folder (or open it with another VSCode window), then run the commands below.

### Installation

```bash
$ npm i
```

### Running the app in dev mode

```bash
$ npm run dev
```

### Building the app to be served

```bash
$ npm run build
```

### Extra Info

Remember to check the `.env` file in the server for everything. You don't need to set IP adresses or anything **in the client**, unless you change the server's routes or decide to run it separate from the server, if you do then you'll need to apply changes accordingly in the client and rebuild.

**Warning**: Running the client in real time with `npm run dev` will not have it be served by the server, so for any changes to be picked up you need to re-build it with `npm run build`. The server automatically picks it up from the client's `/dist` folder. No need to copy-paste.
</details>

### License

[The Unlicense](https://unlicense.org/)

#### Note: Some code is inspired by the [Flashforge-Orca](https://github.com/FlashForge/Orca-Flashforge/blob/9079f31c86b6d34ae7e8dd9cf6de0adb1e7a443f/src/slic3r/Utils/Flashforge.cpp) implementation + some reverse engineering of the Flashforge Finder itself to actually get it working since the printer is unsupported by the slicer.

### What can this thing do?
- Show the printer's status in realtime
- Display the webcam connected to the printer's USB port
- Upload files to the printer (while also parsing Orca's gcode to a compatible gx format!)
- Integrate with Orca by mimicking Octoprint (so things like upload and print are supported!)
- Show you everything in a nifty UI inspired by Mainsail
- You can upload files directly from the web UI, or use Orca (either way, there's interactions that help you start your print immediately!)
- Basically be an opensource implementation of the bullshit Flashforge made with the Finder and allow it to be used without slicer plugins or Octoprint plugins