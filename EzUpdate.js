const Request = require("request");
const Path = require("path");
const { BrowserWindow } = require("electron");
const { download } = require("electron-dl");
const fs = require("fs");
const EZU_VERSION = "1.0.0";

/**
 * ~~~ TODOs ~~~
 * Make installation functions completely
 *
 * Add release's version such as beta3, rc2...
 */

/**
 * Release objects.
 * They're kind of tags about release version.
 */
const stable = { rel: "Stable", open: "<stable>", close: "</stable>" };
const alpha = { rel: "Alpha", open: "<alpha>", close: "</alpha>" };
const beta = { rel: "Beta", open: "<beta>", close: "</beta>" };
const rc = { rel: "RC", open: "<rc>", close: "</rc>" };
/**
 * Release objects' group.
 */
module.exports.release = { stable: stable, alpha: alpha, beta: beta, rc: rc };

/**
 * The element's information which is used in ".ezu" file.
 */
const ver = { open: "<ver>", close: "</ver>" };
const desc = { open: "<description>", close: "</description>" };
const path = { open: "<path>", close: "</path>" };

/**
 * Contains available marks which is used in the version.
 */
const availVerSplitters = [".", "_", "-"];
/**
 * The order of each channel means the hierarchy of the channels.
 * The precedest one is on the top of that.
 *
 * For example, let us suppose the code is
 * ```js
 * {const availRel = [alpha, beta, rc, stable];}
 * ```
 * If user select alpha channel, all channel's update information will be retrieved.
 * Equally, if user select stable channel, only stable channel's will be searched.
 * And also, the index of channels is a key value in array sorting. So backmost thing means the latest version.
 */
const availRel = [alpha, beta, rc, stable];

/**
 * Decide what release will precede against other releases.
 * The backmost thing is the latest version if the version numbering is same.
 */
const relOrder = [alpha.rel, beta.rel, rc.rel, stable.rel];

class EzUpdate {
    /**
     * ```.ezu``` file's url.
     */
    ezuUrl = "";
    /**
     * Program's current version.
     * ```js
     * { ver: version, rel: release.rel, }
     * ```
     */
    currentVersion;
    /**
     * Store raw version of requested HTML.
     * Will only be changed when ```getVerInfo()``` is called,
     * or keep it's original value.
     */
    rawHTML = "";
    /**
     * Show what update channel (e.g. Beta channel, Preview channel, etc.) is selected now.
     * Can be changed by call ```setChannel(channel)```
     */
    selectedChannel = stable;
    /**
     * Http request observer.
     * @type {setInterval()}
     *
     * Be set by```setUpdateChecker(callback, frequency)```,
     * cleared by ```clearUpdateChecker()```
     */
    updateChecker;
    /**
     * Structured version informations declared in ```.ezu``` file.
     * You can access to this by call ```getList()```.
     */
    versionList = []; // structured update information list

    /**
     *
     * @param {String} ezuUrl
     * Url of ```.ezu``` file.
     * @param {String} version
     * Your program's current version. (e.g. 1.0.0)
     * @param {Object} release
     *  Release version such as ```release.beta```, ```release.rc```.
     * @param {()=>{}} callback
     * A callback called after ```.ezu``` request.
     * @returns this
     * @throws ```TypeError``` when get an unsupported version format or an Object that is not in the array ```release```.
     */
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
            rel: release.rel,
        };
        this.ezuUrl = ezuUrl;

        console.log("EzU : Retrieving updates... Inputted version is " + version + " " + release.rel);
        this.getVerInfo(callback);

        return this;
    }

    /**
     * Change update channel to target channel.
     * @param {Object} channel
     * Target channel
     * @returns this
     */
    setChannel(channel) {
        this.selectedChannel = channel;
        return this;
    }

    /**
     * Set the update checker works at every interval.
     * @param {()=>{}} callback
     * When this checker find an update-available version, callback will be called.
     * @param {int} interval
     * Set checking interval. Based on the hour. Default : 1hour
     * @returns
     */
    setUpdateChecker(callback, interval = 1) {
        // initial checking will be started after interval time
        this.updateChecker = setInterval(() => {
            this.getVerInfo(() => {
                this.versionList = [];
                if (this.isUpdateAvailable()) {
                    callback();
                }
            });
        }, interval * 3600);
        return this;
    }

    /**
     * Clear update checker.
     */
    clearUpdateChecker() {
        clearInterval(this.updateChecker);
    }

    /**
     * Update ```rawHTML``` with the content of ```.ezu``` file.
     * @param {(html)=>{}} callback
     * Called after works done.
     * @param {int} timeout
     * Set request timeout. Base on second. Default : 5sec
     */
    getVerInfo(callback, timeout = 5) {
        // clear rawHTML
        this.rawHTML = "";

        Request(this.ezuUrl, (error, response, html) => {
            if (error) {
                console.log('EzU : Cannot get the update data. Check the "ezuUrl" and your internet connection.');
            }
            this.rawHTML = html;
        });
        // observe
        let checker = setInterval(() => {
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

    /**
     * Query selected channel's available versions and push into ```versionList``` after structuralization.
     * @returns this
     */
    query() {
        // Search release that is in the selected channel
        let searchList = availRel.slice();
        let tempHTML = this.rawHTML.repeat(1);
        // initialize
        this.versionList = [];

        for (let i = 0; i < availRel.indexOf(this.selectedChannel); i++) {
            searchList.shift();
        }
        searchList.forEach((release) => {
            while (tempHTML.indexOf(release.open) != -1) {
                let sPoint = tempHTML.indexOf(release.open);
                let ePoint = tempHTML.indexOf(release.close);
                let content = tempHTML.substring(sPoint + release.open.length, ePoint);
                tempHTML = tempHTML.substring(0, sPoint) + tempHTML.substring(ePoint + release.close.length, tempHTML.length);
                this.versionList.push(EzUpdate.structure(release, content));
            }
        });
        return this;
    }

    /**
     * Sort the ```versionList``` in descending order.
     * The latest version precedes in this list.
     * @returns this
     */
    sort() {
        this.versionList.sort((a, b) => EzUpdate.compareVer(a, b));
        return this;
    }

    /**
     * @returns First element after sorting ```versionList```.
     */
    getLatest() {
        return this.sort().versionList[0];
    }

    /**
     * Compare both the current program version and the current channel's latest version.
     * @returns true when update is available, false when version is same or only downgrade version found.
     */
    isUpdateAvailable() {
        if (this.versionList.length == 0) {
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

    /**
     * Return all versions in selected channel declared in ```.ezu```.
     * @returns ```versionList```
     */
    getList() {
        return this.versionList;
    }

    /**
     * Do installation with selected version.
     * If download path is null, your update file will be downloaded in the directory where this file is.
     *
     * This method doesn't contains any detailed install commands.
     * So for updating works executed after downloading the file, you should code your update commands in callback.
     * For your information, EzU is providing some methods about resource replacing.
     * How about checking them out?
     * ```js
     * install(versionObj, null, (path) => {
     *   // your own installation commands
     * });
     * ```
     * @param {Object} versionObj
     * An element in ```versionList```.
     * If it is an empty object, automatically get the latest update.
     * @param {String} downloadPath
     * Customize download path.
     * @param {(path: String)=>{}} callback
     * Called with download path after the download has been finished.
     * @throws ```Error``` when ```versionObj``` is not set and update is unavailable.
     */
    install(versionObj = {}, downloadPath = null, callback) {
        // check again
        if (versionObj == {}) {
            if (!this.isUpdateAvailable()) {
                throw new Error("EzU : Update is unavailable. Set version manually if you want to do downgrade installation.");
            }
        }
        if (downloadPath == null) {
            downloadPath = Path.resolve("./EzUpdate.js").replace("EzUpdate.js", "");
        }
        this.download(versionObj.path, downloadPath, (filePath) => callback(filePath));
    }

    /**
     * Download file.
     * @param {String} url
     * @param {String} dir
     * @param {(path)=>{}} callback
     * Called with download path after the download has been finished.
     */
    download(url, dir, callback) {
        download(BrowserWindow.getFocusedWindow(), url, { directory: dir }).then((dl) => {
            callback(dl.getSavePath());
        });
    }

    mergeJSON(newJSONPath, oldJSONPath) {
        let newJ = JSON.parse(fs.readFileSync(newJSONPath, "utf-8"));
        let oldJ = JSON.parse(fs.readFileSync(oldJSONPath, "utf-8"));
        fs.writeFileSync(oldJSONPath, JSON.stringify(Object.assign({}, newJ, oldJ)));
    }

    replaceResource(newRes, oldRes) {
        fs.rmSync(oldRes);
        fs.copyFileSync(newRes, oldRes);
        fs.rmSync(newRes);
    }

    /**
     * Structuralize the content. Release elements are not allowed.
     * @param {Object} release
     * @param {String} content
     * @returns Structured object
     */
    static structure(release, content) {
        let obj = {};
        obj.rel = release.rel;
        obj.ver = EzUpdate.extract(content, ver);
        obj.description = EzUpdate.extract(content, desc);
        obj.path = EzUpdate.extract(content, path);
        return obj;
    }

    /**
     * Extract innerText from element.
     * @param {String} content
     * @param {Object} elemObj
     * @returns
     */
    static extract(content, elemObj) {
        return content.substring(content.indexOf(elemObj.open) + elemObj.open.length, content.indexOf(elemObj.close)).trim();
    }

    /**
     * Compare two version information objects.
     * @param {Object} a
     * @param {Object} b
     * @returns 0 when version is same, -1 when ```a``` is latest, 1 when ```b``` is latest.
     */
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
}

module.exports.EzUpdate = EzUpdate;
