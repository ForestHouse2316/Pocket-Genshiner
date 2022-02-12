const { app, BrowserWindow } = require("electron");
const { ipcMain } = require("electron");
const path = require("path");
const DataManager = require("./DataManager.js");
const { EzUpdate, release } = require("./EzUpdate.js");

const VERSION = "0.2.0";
const RELEASE = release.alpha;
const EZU_PATH = "https://raw.githubusercontent.com/ForestHouse2316/Pocket-Genshiner/main/.ezu";
const UPDATE_PATH = "https://objectstorage.ap-chuncheon-1.oraclecloud.com/p/ud030pt5u5P4FvzOX6eYhkXCa8lnVePmjnsarxBsWlcpIWXYnhSvFsQH0kdjFpZ5/n/axmbupeu8gjx/b/PocketGenshiner_installer/o/";

app.whenReady().then(() => {
    // Anonymous func executed after loading completly
    DataManager.initialize();
    createWindow();
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
    win.loadFile("index.html");
    let EzU = new EzUpdate(EZU_PATH, VERSION, RELEASE, () => {
        if (EzU.setChannel(release.alpha).isUpdateAvailable()) {
            // 업데이트 할거냐고 물어보기
            // 만약 업데이트 한다고 카면 EzU.install(EzU.getLatest());
            console.log(EzU.getList()[0]);
            EzU.install(EzU.getLatest(), (path) => {
                console.log(path);
            });
        }
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
