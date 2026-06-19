const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("stackr", {
    getApps: () => ipcRenderer.invoke("apps:get"),
    addApp: (app) => ipcRenderer.invoke("apps:add", app),
    updateApp: (id, app) => ipcRenderer.invoke("apps:update", id, app),
    deleteApp: (id) => ipcRenderer.invoke("apps:delete", id),

    getProfiles: () => ipcRenderer.invoke("profiles:get"),
    addProfile: (name) => ipcRenderer.invoke("profiles:add", name),
    updateProfile: (id, name) => ipcRenderer.invoke("profiles:update", id, name),
    deleteProfile: (id) => ipcRenderer.invoke("profiles:delete", id),
    setCurrentProfile: (id) => ipcRenderer.invoke("profiles:set-current", id),
    getCurrentProfile: () => ipcRenderer.invoke("profiles:get-current"),

    openUrl: (url) => ipcRenderer.invoke("nav:open", url),
    goHome: () => ipcRenderer.invoke("nav:home"),
    goBack: () => ipcRenderer.invoke("nav:back"),
    goForward: () => ipcRenderer.invoke("nav:forward"),

    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),

    createDesktopShortcut: (id) => ipcRenderer.invoke("shortcut:create", id),

    checkForUpdates: () => ipcRenderer.invoke("update:check"),
    downloadUpdate: () => ipcRenderer.invoke("update:download"),
    installUpdate: () => ipcRenderer.invoke("update:install"),

    onUpdateStatus: (callback) => {
        ipcRenderer.on("update:status", (_event, data) => callback(data));
    }
});