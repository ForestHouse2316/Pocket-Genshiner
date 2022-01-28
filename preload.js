const { contextBridge, shell } = require('electron');

contextBridge.exposeInMainWorld(
    "api", {
        openURL : (path) => {
            shell.openExternal(path);
        }
    }
);