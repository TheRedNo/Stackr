const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const data = require("./src/data/dataManager");

function createWindow() {
    const win = new BrowserWindow({
        width: 1920,
        height: 1080
    });

    win.loadURL("http://localhost:5173");
}


function init() {

    // Ordnerstruktur
    const base = app.getPath("userData");
    const iconsDir = require("path").join(base, "icons");

    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
    }

    // Dateien anlegen
    data.ensureFile("apps.json", { apps: [] });

    data.ensureFile("profiles.json", {
        profiles: [
            { id: "private", name: "Privat" },
            { id: "work", name: "Work" }
        ]
    });

    data.ensureFile("settings.json", {
        theme: "dark",
        defaultProfile: "private"
    });
}

app.whenReady().then(() => {
    init();
    createWindow();
});