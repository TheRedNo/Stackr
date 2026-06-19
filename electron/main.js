const { app, BrowserWindow, BrowserView, ipcMain, session, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { pathToFileURL } = require("url");
const { autoUpdater } = require("electron-updater");


const pngToIcoModule = require("png-to-ico");
const pngToIco = pngToIcoModule.default || pngToIcoModule;

let mainWindow;
let webView;

const HOME_URL = "http://localhost:5173";
const TITLEBAR_HEIGHT = 56;

function getDataDir() {
    return app.getPath("userData");
}

function filePath(name) {
    return path.join(getDataDir(), name);
}

function readJson(name) {
    return JSON.parse(fs.readFileSync(filePath(name), "utf8"));
}

function saveJson(name, data) {
    fs.writeFileSync(filePath(name), JSON.stringify(data, null, 4));
}

function ensureDataFiles() {
    const base = getDataDir();
    const iconsDir = path.join(base, "icons");

    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
    if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

    if (!fs.existsSync(filePath("apps.json"))) {
        saveJson("apps.json", { apps: [] });
    }

    if (!fs.existsSync(filePath("profiles.json"))) {
        saveJson("profiles.json", {
            profiles: [
                { id: "private", name: "Privat" },
                { id: "work", name: "Work" },
            ],
        });
    }

    if (!fs.existsSync(filePath("settings.json"))) {
        saveJson("settings.json", {
            theme: "dark",
            currentProfile: "private",
            defaultProfile: "private",
        });
    }
}

function imageToDataUrl(iconPath) {
    if (!iconPath || !fs.existsSync(iconPath)) return null;

    const buffer = fs.readFileSync(iconPath);
    const ext = path.extname(iconPath).toLowerCase();

    const mime =
        ext === ".svg"
            ? "image/svg+xml"
            : ext === ".webp"
                ? "image/webp"
                : ext === ".jpg" || ext === ".jpeg"
                    ? "image/jpeg"
                    : "image/png";

    return `data:${mime};base64,${buffer.toString("base64")}`;
}

function readApps() {
    const data = readJson("apps.json");

    data.apps = data.apps.map((appItem) => ({
        ...appItem,
        iconDataUrl: imageToDataUrl(appItem.icon),
    }));

    return data;
}

function saveApps(data) {
    saveJson("apps.json", data);
}

async function downloadIcon(appId, appUrl) {
    const iconApiUrl =
        `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(appUrl)}`;

    const response = await fetch(iconApiUrl, {
        redirect: "follow",
    });

    if (!response.ok) {
        throw new Error(`Icon download failed: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("image")) {
        throw new Error(`Invalid icon content-type: ${contentType}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const iconPath = path.join(getDataDir(), "icons", `${appId}.png`);

    fs.writeFileSync(iconPath, buffer);

    return {
        iconPath,
        iconUrl: pathToFileURL(iconPath).href,
    };
}

function getCurrentProfileId() {
    const settings = readJson("settings.json");
    return settings.currentProfile || settings.defaultProfile || "private";
}

function setCurrentProfileId(id) {
    const settings = readJson("settings.json");
    settings.currentProfile = id;
    saveJson("settings.json", settings);
    return id;
}

function resizeWebView() {
    if (!mainWindow || !webView) return;

    const bounds = mainWindow.getContentBounds();

    webView.setBounds({
        x: 0,
        y: TITLEBAR_HEIGHT,
        width: bounds.width,
        height: bounds.height - TITLEBAR_HEIGHT,
    });
}

function openWebApp(url) {
    if (!mainWindow) return;

    if (webView) {
        mainWindow.removeBrowserView(webView);
        webView.webContents.destroy();
        webView = null;
    }

    const profileId = getCurrentProfileId();
    const profileSession = session.fromPartition(`persist:${profileId}`);

    webView = new BrowserView({
        webPreferences: {
            session: profileSession,
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.setBrowserView(webView);
    resizeWebView();

    webView.webContents.loadURL(url);
}

function closeWebApp() {
    if (!mainWindow || !webView) return;

    mainWindow.removeBrowserView(webView);
    webView.webContents.destroy();
    webView = null;
}

function setupAutoUpdater() {
    autoUpdater.autoDownload = false;

    autoUpdater.on("checking-for-update", () => {
        mainWindow?.webContents.send("update:status", {
            status: "checking",
            message: "Suche nach Updates..."
        });
    });

    autoUpdater.on("update-available", (info) => {
        mainWindow?.webContents.send("update:status", {
            status: "available",
            message: "Update verfügbar",
            version: info.version
        });
    });

    autoUpdater.on("update-not-available", () => {
        mainWindow?.webContents.send("update:status", {
            status: "not-available",
            message: "Keine Updates verfügbar"
        });
    });

    autoUpdater.on("download-progress", (progress) => {
        mainWindow?.webContents.send("update:status", {
            status: "downloading",
            message: "Update wird heruntergeladen...",
            percent: Math.round(progress.percent)
        });
    });

    autoUpdater.on("update-downloaded", () => {
        mainWindow?.webContents.send("update:status", {
            status: "downloaded",
            message: "Update bereit zur Installation"
        });
    });

    autoUpdater.on("error", (error) => {
        mainWindow?.webContents.send("update:status", {
            status: "error",
            message: error.message
        });
    });
}

const isDev = !app.isPackaged;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        frame: false,
        titleBarStyle: "hidden",
        icon: path.join(__dirname, '../src/assets/logo.ico'),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (isDev) {
        // Im Entwicklungsmodus laden wir den Vite-Server (passen Sie den Port ggf. an)
        mainWindow.loadURL(HOME_URL);
        // Optional: Entwicklertools automatisch öffnen
        mainWindow.webContents.openDevTools();
    } else {
        // Im Build laden wir die lokale index.html aus dem dist-Ordner
        // Da main.js in /electron liegt, springen wir mit '..' hoch und dann in 'dist'
        mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    mainWindow.webContents.once("did-finish-load", () => {
        const startupAppId = getStartupAppId();

        if (startupAppId) {
            const appItem = findAppById(startupAppId);

            if (appItem) {
                openWebApp(appItem.url);
            }
        }
    });


    mainWindow.on("resize", resizeWebView);
}

function findAppById(id) {
    const appsData = readApps();
    return appsData.apps.find((a) => a.id === id);
}

function sanitizeShortcutName(name) {
    return name.replace(/[<>:"/\\|?*]/g, "").trim();
}

async function createDesktopShortcut(appItem) {
    const desktopPath = app.getPath("desktop");
    const shortcutName = sanitizeShortcutName(appItem.name) || "Stackr App";
    const shortcutPath = path.join(desktopPath, `${shortcutName}.lnk`);

    const exePath = process.execPath;
    const iconPath = await ensureIcoForApp(appItem);

    const success = shell.writeShortcutLink(shortcutPath, {
        target: exePath,
        args: `--open-app=${appItem.id}`,
        description: `Open ${appItem.name} in Stackr`,
        icon: iconPath,
        iconIndex: 0,
    });

    return success;
}

function getStartupAppId() {
    const arg = process.argv.find((a) => a.startsWith("--open-app="));
    if (!arg) return null;

    return arg.replace("--open-app=", "");
}

async function ensureIcoForApp(appItem) {
    if (!appItem.icon || !fs.existsSync(appItem.icon)) {
        return process.execPath;
    }

    const icoPath = appItem.icon.replace(/\.png$/i, ".ico");

    if (!fs.existsSync(icoPath)) {
        const icoBuffer = await pngToIco(appItem.icon);
        fs.writeFileSync(icoPath, icoBuffer);
    }

    return icoPath;
}
;

app.whenReady().then(() => {
    ensureDataFiles();

    ipcMain.handle("apps:get", () => {
        return readApps().apps;
    });

    ipcMain.handle("apps:add", async (_event, payload) => {
        const appsData = readApps();
        const id = crypto.randomUUID();

        const newApp = {
            id,
            name: payload.name,
            url: payload.url,
            description: payload.description || "",
            category: payload.category || "Produktivität",
            icon: null,
            iconUrl: null,
            iconDataUrl: null,
        };

        try {
            const icon = await downloadIcon(id, payload.url);
            newApp.icon = icon.iconPath;
            newApp.iconUrl = icon.iconUrl;
            newApp.iconDataUrl = imageToDataUrl(icon.iconPath);
        } catch (err) {
            console.error("Icon konnte nicht geladen werden:", err);
        }

        appsData.apps.push(newApp);
        saveApps(appsData);

        return newApp;
    });

    ipcMain.handle("apps:update", async (_event, id, payload) => {
        const appsData = readApps();
        const index = appsData.apps.findIndex((a) => a.id === id);

        if (index === -1) throw new Error("App nicht gefunden");

        const oldApp = appsData.apps[index];

        let finalUrl = payload.url;
        if (!finalUrl.startsWith("http")) {
            finalUrl = `https://${finalUrl}`;
        }

        const updatedApp = {
            ...oldApp,
            name: payload.name,
            url: finalUrl,
            description: payload.description || oldApp.description || "",
        };

        if (oldApp.url !== finalUrl) {
            try {
                const icon = await downloadIcon(id, finalUrl);
                updatedApp.icon = icon.iconPath;
                updatedApp.iconUrl = icon.iconUrl;
                updatedApp.iconDataUrl = imageToDataUrl(icon.iconPath);
            } catch (err) {
                console.error("Icon konnte beim Update nicht geladen werden:", err);
            }
        }

        appsData.apps[index] = updatedApp;
        saveApps(appsData);

        return updatedApp;
    });

    ipcMain.handle("apps:delete", async (_event, id) => {
        const appsData = readApps();
        const appToDelete = appsData.apps.find((a) => a.id === id);

        appsData.apps = appsData.apps.filter((a) => a.id !== id);
        saveApps(appsData);

        if (appToDelete?.icon && fs.existsSync(appToDelete.icon)) {
            try {
                fs.unlinkSync(appToDelete.icon);
            } catch (err) {
                console.error("Icon konnte nicht gelöscht werden:", err);
            }
        }

        return true;
    });

    ipcMain.handle("profiles:get", () => {
        return readJson("profiles.json").profiles;
    });

    ipcMain.handle("profiles:add", (_event, name) => {
        const profilesData = readJson("profiles.json");

        const id = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || crypto.randomUUID();

        if (profilesData.profiles.some((p) => p.id === id)) {
            throw new Error("Profil existiert bereits");
        }

        const profile = {
            id,
            name,
        };

        profilesData.profiles.push(profile);
        saveJson("profiles.json", profilesData);

        return profile;
    });

    ipcMain.handle("profiles:get-current", () => {
        return getCurrentProfileId();
    });

    ipcMain.handle("profiles:set-current", (_event, id) => {
        const profiles = readJson("profiles.json").profiles;

        if (!profiles.some((p) => p.id === id)) {
            throw new Error("Profil nicht gefunden");
        }

        closeWebApp();
        return setCurrentProfileId(id);
    });

    ipcMain.handle("nav:open", (_event, url) => {
        openWebApp(url);
    });

    ipcMain.handle("nav:home", () => {
        closeWebApp();
    });

    ipcMain.handle("nav:back", () => {
        if (webView && webView.webContents.canGoBack()) {
            webView.webContents.goBack();
        }
    });

    ipcMain.handle("nav:forward", () => {
        if (webView && webView.webContents.canGoForward()) {
            webView.webContents.goForward();
        }
    });

    ipcMain.handle("window:minimize", () => {
        mainWindow?.minimize();
    });

    ipcMain.handle("window:maximize", () => {
        if (!mainWindow) return;

        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    });

    ipcMain.handle("window:close", () => {
        mainWindow?.close();
    });

    ipcMain.handle("profiles:update", (_event, id, name) => {
        const profilesData = readJson("profiles.json");
        const index = profilesData.profiles.findIndex((p) => p.id === id);

        if (index === -1) {
            throw new Error("Profil nicht gefunden");
        }

        profilesData.profiles[index] = {
            ...profilesData.profiles[index],
            name,
        };

        saveJson("profiles.json", profilesData);

        return profilesData.profiles[index];
    });

    ipcMain.handle("profiles:delete", (_event, id) => {
        const profilesData = readJson("profiles.json");

        if (profilesData.profiles.length <= 1) {
            throw new Error("Das letzte Profil kann nicht gelöscht werden");
        }

        const profileToDelete = profilesData.profiles.find((p) => p.id === id);

        if (!profileToDelete) {
            throw new Error("Profil nicht gefunden");
        }

        profilesData.profiles = profilesData.profiles.filter((p) => p.id !== id);
        saveJson("profiles.json", profilesData);

        const settings = readJson("settings.json");

        if (settings.currentProfile === id) {
            const fallbackProfile = profilesData.profiles[0];
            settings.currentProfile = fallbackProfile.id;
            saveJson("settings.json", settings);
            closeWebApp();
        }

        return true;
    });

    ipcMain.handle("shortcut:create", async (_event, id) => {
        const appItem = findAppById(id);

        if (!appItem) {
            throw new Error("App nicht gefunden");
        }

        return await createDesktopShortcut(appItem);
    });

    ipcMain.handle("update:check", async () => {
        if (!app.isPackaged) {
            return {
                status: "dev",
                message: "Auto-Updater funktioniert nur in der gebauten App."
            };
        }

        autoUpdater.checkForUpdates();
        return {
            status: "checking",
            message: "Suche nach Updates..."
        };
    });

    ipcMain.handle("update:download", async () => {
        autoUpdater.downloadUpdate();
    });

    ipcMain.handle("update:install", async () => {
        autoUpdater.quitAndInstall();
    });

    createWindow();

    setupAutoUpdater();
});