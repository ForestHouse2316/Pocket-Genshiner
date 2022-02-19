const fs = require("fs");
let rootPath = "";
let dirPath = "/data";
let jsonPath = "/data/data.json";
let logPath = "/data/log.txt";
let jsonData = {};

module.exports.initialize = (root) => {
    rootPath = root;
    dirPath = root + dirPath;
    jsonPath = root + jsonPath;
    logPath = root + logPath;
    jsonData = {
        // initial form of the json structure
        dashboard: {
            resinTimer: {
                lastSetTime: this.getTime(),
                lastRemainedTime: "00:00:00", // remained time at lastSetTime
            },
        },
        checkIn: {},
        map: {},
        guide: {},
        setting: {
            serverRegion: "Asia", // default server region is Asia
            theme: "dark",
            updateChannel: { rel: "Stable", open: "<stable>", close: "</stable>" },
        },
    }; // use getJSON() to get this value
    fs.access(jsonPath, (err) => {
        if (!err) {
            // read json
            jsonData = Object.assign(jsonData, JSON.parse(fs.readFileSync(jsonPath, "utf-8")));
        } else {
            // if there's no json, make it
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath);
            }
            this.save();
            return this;
        }
    });
};

// Query form : q('key1/key2/···/keyn')
module.exports.query = (path, newValue = null) => {
    this.log("Querying :" + path);
    let keys = path.split("/");
    if (newValue == null) {
        let value = jsonData;
        keys.forEach((key) => {
            value = value[key];
        });
        return value;
    }
};

module.exports.getJson = () => {
    return jsonData;
};

module.exports.save = () => {
    // non-sync
    this.log("Saving data to json...");
    fs.writeFile(jsonPath, JSON.stringify(jsonData), "utf-8", (err) => {
        if (err) {
            this.log("Save error : " + err);
        } else {
            this.log("Saving successful");
        }
    });

    return this;
};

module.exports.log = (msg) => {
    // non-sync

    fs.access(logPath, (err) => {
        if (err) {
            fs.writeFileSync(logPath, "### Pocket Genshiner Log File ###\nPlease send this log file to [foresthouse2316@gmail.com] if there is any bug or problem.\n", (err) => {
                console.log("Cannot create log.txt");
            });
        }
    });
    fs.appendFile(logPath, "\n[" + this.getTimeStamp() + "]  " + msg, (err) => {
        if (err) {
            console.log("Cannot add a log to log.txt : " + msg);
        }
    });
    return this;
};

module.exports.getTimeStamp = () => {
    // YY/MM/DD hh:mm:ss GMT±0000
    const date = new Date();
    return date.getFullYear().toString() + "/" + (date.getMonth() + 1).toString() + "/" + date.getDate().toString() + " " + date.toTimeString().toString().split(" (")[0];
};
module.exports.getTime = () => {
    // from 1970.1.1
    const date = new Date();
    return date.getTime();
};

module.exports.calcTimeGap = (t1, t2 = this.getTime(), abs = true) => {
    // [t1] to [t2] calculation
    pn = t2 > t1 ? 1 : -1;
    diff = Math.abs(Math.round((t2 - t1) / 1000)); // millisec to sec with rounding off
    // 3600s = 1h, 60s = 1m
    s = diff % 60;
    diff = parseInt(diff / 60); // now diff mean "minute"
    m = diff % 60;
    h = parseInt(diff / 60);
    return abs ? [h, m, s] : [h, m, s, pn];
};
