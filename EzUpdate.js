const request = require("request");
const { BrowserWindow } = require("electron");
const { download } = require("electron-dl");
const EZU_VERSION = "1.0.0";

// Releases
const stable = { rel: "Stable", open: "<stable>", close: "</stable>" };
const alpha = { rel: "Alpha", open: "<alpha>", close: "</alpha>" };
const beta = { rel: "Beta", open: "<beta>", close: "</beta>" };
const rc = { rel: "RC", open: "<rc>", close: "</rc>" };
module.exports.release = { stable: stable, alpha: alpha, beta: beta, rc: rc };
// .ezu Elements
const ver = { open: "<ver>", close: "</ver>" };
const desc = { open: "<description>", close: "</description>" };
const path = { open: "<path>", close: "</path>" };

/**
 * Parameter Validation
 *
 * @const {Array} availVerSplitters
 * Contains available marks which is used in the version.
 *
 * @const {Array} availRel
 * The order of each channel means the hierarchy of the channels. The precedest one is on the top of that.
 * For example, if user select alpha channel, all channel's update information will be retrieved.
 * Equally, if user select stable channel, only stable channel's will be searched.
 * And also, the index of channels is a key value in array sorting. So backmost thing means the latest version.
 */
const availVerSplitters = [".", "_", "-"];
const availRel = [alpha, beta, rc, stable];

// Release Order
const relOrder = [alpha.rel, beta.rel, rc.rel, stable.rel];

// Http request observer
let checker;

class EzUpdate {
    ezuUrl = ""; // .ezu url
    currentVersion = ""; // program's current version
    rawHTML = ""; // requested html (don't be changed until call "getVerInfo()" again.)
    selectedChannel = stable; // update channel selecting
    updateChecker; // "setInterval()" instance
    updateList = []; // structured update information list

    constructor(ezuUrl, version, release, callback) {
        // parameter ispection
        switch (true) {
            case parseInt(version.replaceAll(".", "").replaceAll("_", "").replaceAll("-", "")) == NaN:
                throw new TypeError("Only '.', '_', '-' are available to use for version.");
                break;
            case availRel.indexOf(release) == -1:
                throw new TypeError('Release name "' + release + "\" isn't able to use. If you want to use this release, check out the comment about 'How to make the custom version release'.");
                break;
            default:
                console.log("EzU : v." + EZU_VERSION);
                break;
        }

        this.currentVersion = {
            ver: version,
            rel: release,
        };
        this.ezuUrl = ezuUrl;

        console.log("EzU : Retrieving updates... Inputted version is " + version + " " + release.rel);
        this.getVerInfo(callback);

        return this;
    }

    setChannel(channel) {
        this.selectedChannel = channel;
        return this;
    }

    setUpdateChecker(callback, frequency = 1) {
        // initial checking will be started after interval time
        this.updateChecker = setInterval(() => {
            this.getVerInfo(() => {
                this.updateList = null;
                if (this.isUpdateAvailable()) {
                    callback();
                }
            });
        }, frequency * 3600);
        return this;
    }

    clearUpdateChecker() {
        clearInterval(this.updateChecker);
    }

    getVerInfo(callback, timeout = 5) {
        // clear rawHTML
        this.rawHTML = "";

        request(this.ezuUrl, (error, response, html) => {
            if (error) {
                console.log('EzU : Cannot get the update data. Check the "ezuUrl" and your internet connection.');
            }
            this.rawHTML = html;
        });
        // observe
        checker = setInterval(() => {
            if (this.rawHTML != "") {
                callback();
                clearInterval(checker);
                checker = null;
                return;
            }
        }, 100);
        //timeout
        setTimeout(() => {
            if (checker != null) {
                console.log("EzU : Update checking timeout");
                clearInterval(checker);
            }
        }, timeout * 1000);
    }

    query() {
        // Search release that is in the selected channel
        let searchList = availRel.slice();
        let tempHTML = this.rawHTML.repeat(1);
        // initialize
        this.updateList = [];

        for (let i = 0; i < availRel.indexOf(this.selectedChannel); i++) {
            searchList.shift();
        }
        searchList.forEach((release) => {
            while (tempHTML.indexOf(release.open) != -1) {
                let sPoint = tempHTML.indexOf(release.open);
                let ePoint = tempHTML.indexOf(release.close);
                let content = tempHTML.substring(sPoint + release.open.length, ePoint);
                tempHTML = tempHTML.substring(0, sPoint) + tempHTML.substring(ePoint + release.close.length, tempHTML.length);
                this.updateList.push(EzUpdate.structure(release, content));
            }
        });
        return this;
    }

    sort() {
        // The latest update precedes this array
        this.updateList.sort((a, b) => EzUpdate.compareVer(a, b));
        return this;
    }

    getLatest() {
        return this.sort().updateList[0];
    }

    isUpdateAvailable() {
        if (this.updateList.length == 0) {
            this.query();
        }
        switch (EzUpdate.compareVer(this.currentVersion, this.getLatest())) {
            case 0:
                console.log("EzU : Already latest version");
                return false;
            case -1:
                console.log("EzU : Downgrade version detected");
                return false;
            case 1:
                return true;
            default:
                break;
        }
    }

    getList() {
        return this.updateList;
    }

    install(versionItem = {}, callback) {
        // check again
        if (versionItem == {}) {
            if (!this.isUpdateAvailable()) {
                throw new Error("EzU : Update is unavailable. Set version manually if you want to do downgrade installation.");
            }
        }
        this.download(versionItem.path, "./", callback);
    }

    static structure(release, content) {
        let obj = {};
        obj.rel = release.rel;
        obj.ver = EzUpdate.extract(content, ver);
        obj.description = EzUpdate.extract(content, desc);
        obj.path = EzUpdate.extract(content, path);
        return obj;
    }

    static extract(content, elemObj) {
        return content.substring(content.indexOf(elemObj.open) + elemObj.open.length, content.indexOf(elemObj.close)).trim();
    }

    static compareVer(a, b) {
        let verA = a.ver + relOrder.indexOf(a.rel);
        let verB = b.ver + relOrder.indexOf(b.rel);
        if (verA > verB) {
            // latest = a
            return -1;
        } else if (verA == verB) {
            // same version
            return 0;
        } else if (verA < verB) {
            // latest = b
            return 1;
        }
    }

    download(url, dir, callback) {
        download(BrowserWindow.getFocusedWindow(), url, { directory: dir }).then((dl) => {
            callback(dl.getSavePath());
        });
    }
}

module.exports.EzUpdate = EzUpdate;

/*



















module.exports.checkUpdate = (ezuPath, currentVersion, release, channel = stable, onlyLatest = true) => {
    // parameter ispection
    switch (true) {
        case parseInt(currentVersion.replaceAll(".", "").replaceAll("_", "").replaceAll("-", "")) == NaN:
            throw new TypeError("Only '.', '_', '-' are available to use for version.");
            break;
        case availRel.indexOf(release) == -1:
            throw new TypeError('Release name "' + release + "\" isn't able to use. If you want to use this release, check out the comment about 'How to make the custom version release'.");
            break;
        case availRel.indexOf(channel) == -1:
            throw new TypeError('Channel"' + channel + "\" isn't able to use. If you want to use this channel, check out the comment about 'How to make the custom version tag'.");
            break;
        default:
            console.log("EzU : v." + EZU_VERSION);
            console.log("EzU : Retrieving updates... Inputted version is " + currentVersion + " " + release.rel);
            break;
    }

    getVerInfo(ezuPath, (html) => {
        console.log("EzU : Update information request finished");
        let updateList = devide(html, channel);
        if (onlyLatest) {
            console.log(sort(updateList)[0]);
        } else {
            console.log(sort(updateList));
        }
    });
};

function getVerInfo(url, callback, timeout = 3) {
    let returnedHtml = "";
    request(url, (error, response, html) => {
        if (error) {
            throw error;
        }
        returnedHtml = html;
    });
    checker = setInterval(() => {
        if (returnedHtml != "") {
            callback(returnedHtml);
            clearInterval(checker);
            return;
        }
    }, 100);
    setTimeout(() => {
        clearInterval(checker);
    }, timeout * 1000);
}

function devide(html, channel) {
    // Search release that is in the selected channel
    let searchList = availRel.slice();
    for (let i = 0; i < availRel.indexOf(channel); i++) {
        searchList.shift();
    }
    let updateList = [];
    searchList.forEach((release) => {
        while (html.indexOf(release.open) != -1) {
            let sPoint = html.indexOf(release.open);
            let ePoint = html.indexOf(release.close);
            let content = html.substring(sPoint + release.open.length, ePoint);
            html = html.substring(0, sPoint) + html.substring(ePoint + release.close.length, html.length);
            updateList.push(structure(release, content));
        }
    });
    // console.log(updateList);
    return updateList;
}

function structure(release, content) {
    let obj = {};
    obj.rel = release.rel;
    obj.ver = extract(content, ver);
    obj.description = extract(content, desc);
    obj.path = extract(content, path);
    return obj;
}

function extract(content, elemObj) {
    return content.substring(content.indexOf(elemObj.open) + elemObj.open.length, content.indexOf(elemObj.close)).trim();
}

function sort(updateList) {
    // The latest update precedes this array
    updateList.sort((a, b) => compareVer(a, b));
    return updateList;
}

function compareVer(a, b) {
    let verA = a.ver + relOrder.indexOf(a.rel);
    let verB = b.ver + relOrder.indexOf(b.rel);
    if (verA > verB) {
        // latest = a
        return -1;
    } else if (verA == verB) {
        // same version
        return 0;
    } else if (verA < verB) {
        // latest = b
        return 1;
    }
}
*/
