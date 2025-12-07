# Flashforge Dashboard (Previously Flashforge Toolkit)

An intuitive dashboard for older Flashforge printers, featuring a NodeJS server that retrieves printer data and delivers it to a static Vue3 client (served statically by the server) that displays “real-time” printer statuses, the printer’s webcam, and facilitates file uploads, all in a single package.    

## Server Instructions

**First** go inside the `server` folder (or open it with another VSCode window), then run the commands below.

### Installation

```bash
$ npm i
```

### Running the server

```bash
# development
$ npm start
```

### Extra Info

Inside the `.env` you can find where to put your printer's IP address (make sure it's a static IP set in your router!), that's all you need in order to start seeing data from your printer in the client. You don't usually need to change the printer's port.

## Client Instructions

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

Remember to check the `.env` file in the server for everything. You don't need to set IP adresses or anything **in the client**, unless you change the server's routes or decide to run it separate from the client, then you'll need to apply changes accordingly in the client and rebuild.

**Warning**: Running the client in real time with `npm run dev` will not have it be served by the server, so for any changes to be picked up you need to re-build it with `npm run build`. The server automatically picks it up from the client's `/dist` folder. No need to copy-paste.

### License

[ISC](https://opensource.org/license/isc-license-txt/)

Contains code based from the [Flashforge-Orca](https://github.com/FlashForge/Orca-Flashforge/blob/9079f31c86b6d34ae7e8dd9cf6de0adb1e7a443f/src/slic3r/Utils/Flashforge.cpp) + some printer reverse engineering to actually get it working since the printer I'm using (Finder) is discontinued.

### TODO
- Refactor the client's styling so it's less ugly, more componentized and maybe to look like something from the Klipper world (Mainsail my love <3).
- Create and upload profiles that can be used with the Finder on the current version of OrcaSlicer. (Underway)
