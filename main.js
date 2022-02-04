const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron");
const path = require("path");
const DataManager = require("./DataManager.js");

app.whenReady().then(() => {
    // Anonymous func executed after loading completly
    createWindow();
});

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });
    DataManager.initialize();
    win.loadFile("index.html");
    DataManager.log("App started");
};

ipcMain.on("query", (event, path) => {
    event.returnValue(DataManager.query(path));
});
ipcMain.on("save", (event) => {
    DataManager.save();
});
ipcMain.on("log", (event, msg) => {
    DataManager.log(msg);
});

function sleep(ms) {
    ts1 = new Date().getTime() + ms;
    do ts2 = new Date().getTime();
    while (ts2 < ts1);
}
