"use strict";

import { app, protocol, BrowserWindow, ipcMain } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
const fs = require("fs");
const isDevelopment = process.env.NODE_ENV !== "production";
// import { autoUpdater } from "electron-updater";
import axios from "axios";
import httpAdapter from "axios/lib/adapters/http";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 660,
    minHeight: 660,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    win.loadURL("app://./index.html");
    // autoUpdater.checkForUpdatesAndNotify();
  }
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("ready", async () => {
  createWindow();
});

if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

ipcMain.handle("compress-image", async (event, filePath) => {
  const result = await axios.post(
    "https://tinypng.com/web/shrink",
    fs.readFileSync(filePath),
    {
      headers: {
        "Postman-Token": Date.now(),
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36",
        "X-Forwarded-For": Array.from(Array(4))
          .map(() => parseInt(Math.random() * 255))
          .join("."),
      },
      adapter: httpAdapter,
    }
  );
  if (result.status !== 201) {
    return {
      status: 1,
      filePath,
      msg: "压缩图片失败",
    };
    return;
  }
  const result2 = await axios.get(result.data.output.url, {
    responseType: "stream",
  });
  if (result2.status !== 200) {
    return {
      status: 1,
      filePath,
      msg: "下载图片失败",
    };
    return;
  }
  result2.data.pipe(fs.createWriteStream(filePath));
  return {
    status: 0,
    filePath,
    cutSize: result.data.output.size,
    ratio: Math.ceil((1 - result.data.output.ratio) * 100) + "%",
    msg: "压缩成功",
  };
});
