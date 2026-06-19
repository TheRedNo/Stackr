// managers/dataManager.js
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

function baseDir() {
    return app.getPath("userData");
}

function filePath(name) {
    return path.join(baseDir(), name);
}

function ensureFile(name, defaultData) {
    const file = filePath(name);

    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(defaultData, null, 4));
    }
}

function load(name) {
    return JSON.parse(fs.readFileSync(filePath(name), "utf8"));
}

function save(name, data) {
    fs.writeFileSync(filePath(name), JSON.stringify(data, null, 4));
}

module.exports = {
    baseDir,
    filePath,
    ensureFile,
    load,
    save
};
