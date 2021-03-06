const { contextBridge, shell, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    openURL: (path) => {
        shell.openExternal(path);
    },
    getJson: (path) => {
        return ipcRenderer.sendSync("getJson");
    },
    save: () => {
        ipcRenderer.send("save");
    },
    log: (msg) => {
        ipcRenderer.send("log", msg);
    },
    saveTimer: (time) => {
        ipcRenderer.send("saveTimer", time);
    },
    getTimer: () => {
        return ipcRenderer.sendSync("getTimer");
    },
    checkUpdate: (callback) => {
        // (EzU.getLatest())=>{}
        ipcRenderer.send("checkUpdate");
        ipcRenderer.on("updateAvailable", (event, r) => {
            callback(r);
        });
    },
    doUpdate: (callback) => {
        ipcRenderer.on("updateProgress", (event, value) => {
            callback(value);
        });
        ipcRenderer.send("doUpdate");
    },
    installUpdate: () => {
        ipcRenderer.send("installUpdate");
    },
});
