# Flashforge Dashboard (Previously Flashforge Toolkit)

An small dashboard for Flashforge printers that contains a NodeJS backend serving data and a static Vue3 front-end (showing realtime data and the printer's webcam) in a single package.  

## Back-End Instructions

### Installation

```bash
$ npm i
```

### Running the app

```bash
# development
$ npm start

# build
$ npm run build
```

### Extra Info

Inside the `.env` you can find where to put your printer's IP address (make sure it's a static IP set in your router!), that's all you need in order to start seeing data from your printer in the front-end. You don't usually need to change the printer's port.

## Front-End Instructions

### Installation

**First** go inside the the client folder (or open it with another VSCode window), then run the commands below.

```bash
$ npm i
```

### Running the app

```bash
$ npm run dev
```

### Building the app

```bash
$ npm run build
```

### Extra Info

Remember to check the .env file in the server for everything. You don't need to set IP adresses or anything in the client, unless you change the server's port or run it on another IP other than local, then you need to change in the client and rebuild.

**Warning**: Running the frontend in real time with `npm run dev` will not deploy it to the backend, so for any changes you need to re-build it, run `npm run build`. The backend automatically picks it up from the front-end's `/dist` folder. No need to copy-paste.

### License

[ISC](https://opensource.org/license/isc-license-txt/)
