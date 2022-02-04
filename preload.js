const { contextBridge, shell, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld(
    "api", {
        openURL : (path) => {
            shell.openExternal(path);
        },
        query : (path) => {
            ipcRenderer.sendSync('query', path);
        },
        save : () => {
            ipcRenderer.send('save');
        },
        log : (msg) => {
            ipcRenderer.send('log', msg);
        }
    }
);