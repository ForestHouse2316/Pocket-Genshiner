const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron");
const path = require("path");
const DataManager = require("./DataManager.js");
const { EzUpdate, release } = require("./EzUpdate.js");
const { autoUpdater } = require("electron-updater");

let VERSION;
let RELEASE;
const EZU_PATH = "https://raw.githubusercontent.com/ForestHouse2316/Pocket-Genshiner/main/.ezu";
const UPDATE_PATH = "https://objectstorage.ap-chuncheon-1.oraclecloud.com/p/ud030pt5u5P4FvzOX6eYhkXCa8lnVePmjnsarxBsWlcpIWXYnhSvFsQH0kdjFpZ5/n/axmbupeu8gjx/b/PocketGenshiner_installer/o/";

app.whenReady().then(() => {
    // Anonymous func executed after loading completly
    let verInfo = app.getVersion().split("-");
    VERSION = verInfo[0];
    RELEASE = release[verInfo[1]];
    DataManager.initialize(app.getPath("userData"));
    createWindow();
    DataManager.log("App started");
});

// app.on('window-all-closed', ()=>{

// });

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
    win.loadFile("index.html");
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
ipcMain.on("checkUpdate", (event) => {
    let EzU = new EzUpdate(EZU_PATH, VERSION, RELEASE, () => {
        if (EzU.setChannel(DataManager.getJson().setting.updateChannel).isUpdateAvailable()) {
            let r = EzU.getLatest();
            r.currentVer = VERSION + " " + RELEASE.rel;
            event.sender.send("updateAvailable", r);
        }
    });
});
ipcMain.on("doUpdate", (event) => {
    autoUpdater.checkForUpdates();
    autoUpdater.on("update-available", () => {
        event.sender.send("updateProgress", "Start downloading");
    });
    autoUpdater.on("update-not-available", () => {
        event.sender.send("updateProgress", "Error : EzU and electron-updater are not returning the same results");
        autoUpdater.removeAllListeners();
    });
    autoUpdater.on("download-progress", (progressObj) => {
        let status = { speed: progressObj.bytesPerSecond, percent: progressObj.percent, fraction: progressObj.transferred + "/" + progressObj.total };
        event.sender.send("updateProgress", status);
    });
    autoUpdater.on("update-downloaded", () => {
        event.sender.send("updateProgress", "Download has been finished");
    });
});
ipcMain.on("installUpdate", (event) => {
    autoUpdater.quitAndInstall();
});
