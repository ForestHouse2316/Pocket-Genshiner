const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron");
const path = require("path");
const DataManager = require("./DataManager.js");
const u = require("./update.js");

app.whenReady().then(() => {
    // Anonymous func executed after loading completly
    createWindow();

    DataManager.initialize();
    win.loadFile("index.html");
    DataManager.log("App started");
});

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1150,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });
};

ipcMain.on("getJson", (event) => {
    event.returnValue = DataManager.getJson();
});
ipcMain.on("save", (event) => {
    DataManager.save();
});
ipcMain.on("log", (event, msg) => {
    DataManager.log(msg);
});
ipcMain.on("saveTimer", (event, time) => {
    DataManager.getJson().dashboard.resinTimer.lastSetTime = DataManager.getTime();
    DataManager.getJson().dashboard.resinTimer.lastRemainedTime = time;
    DataManager.save();
});
ipcMain.on("getTimer", (event) => {
    event.returnValue = DataManager.calcTimeGap(DataManager.getJson().dashboard.resinTimer.lastSetTime);
});

function sleep(ms) {
    ts1 = new Date().getTime() + ms;
    do ts2 = new Date().getTime();
    while (ts2 < ts1);
}
