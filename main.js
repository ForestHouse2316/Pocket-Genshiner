const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const path = require('path');
// const index_js = require('./index.js');

app.whenReady().then(() => {  // Anonymous func executed after loading completly
  createWindow();
})

const createWindow = () => {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        webviewTag: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });
    win.loadFile('index.html');
}

  // ipcMain.on('openURL', (arg) => {
  //   shell.openExternal(arg);
  // });







  function sleep(ms){
    ts1 = new Date().getTime() + ms;
    do ts2 = new Date().getTime(); while (ts2<ts1);
  }

