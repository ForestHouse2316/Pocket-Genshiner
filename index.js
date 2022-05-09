let currentPage = "init";

// set the padding according to this value
// basically 'no_scrollbar' class is disabled in 'index.html'
let isScrollEnabled = true;

window.addEventListener("load", function () {
    console.log("--Page Load--");
    setSideMenuExtension();
    setMenuSelectListener();
    changeThemeTo(window.api.getJson().setting.theme); // Initial theme setting
    setResinTimer();
    initMaterialList();
    setTodoList();
    setListeners();
});

// --------------------------------------------------------------------------------

function sleep(ms) {
    ts1 = new Date().getTime() + ms;
    do ts2 = new Date().getTime();
    while (ts2 < ts1);
}

function setSideMenuExtension() {
    var menuIcon = document.getElementById("menu_icon");
    menuIcon.addEventListener("click", function () {
        var menuElem = document.getElementById("menu_bar");
        menuElem.classList.toggle("menu_close");
        menuElem.classList.toggle("menu_open");
    });
}

function setMenuSelectListener() {
    var dashboard = document.getElementById("dashboard");
    var check_in = document.getElementById("check-in");
    var map = document.getElementById("map");
    var guide = document.getElementById("guide");
    var setting = document.getElementById("setting");

    changeFrame("dashboard"); // initial page setting

    dashboard.addEventListener("click", function () {
        changeFrame("dashboard");
    });
    check_in.addEventListener("click", function () {
        changeFrame("check-in");
        window.api.openURL("https://webstatic-sea.mihoyo.com/ys/event/signin-sea-v3/index.html?act_id=e202102251931481&mhy_auth_required=true&mhy_presentation_style=fullscreen&utm_source=tools&bbs_theme=dark&bbs_theme_device=1");
    });
    map.addEventListener("click", function () {
        changeFrame("https://webstatic-sea.hoyolab.com/ys/app/interactive-map");
        document.querySelector("#content_webview").shadowRoot.querySelector("iframe").height = "100%";
    });
    guide.addEventListener("click", function () {
        changeFrame("guide");
    });
    setting.addEventListener("click", function () {
        changeFrame("setting");
    });
}

function setListeners() {
    // resin timer
    document.getElementById("resin_timer_button_1").addEventListener("click", () => {
        adjustResinTimer(1, 20, 0, true);
    });
    document.getElementById("resin_timer_button_2").addEventListener("click", () => {
        adjustResinTimer(2, 40, 0, true);
    });
    document.getElementById("resin_timer_button_3").addEventListener("click", () => {
        adjustResinTimer(5, 20, 0, true);
    });
    document.getElementById("resin_timer_button_4").addEventListener("click", () => {
        adjustResinTimer(-1, -20, 0, true);
    });

    // daily material list
    for (let i = 1; i <= 4; i++) {
        document.getElementById("daily_material_list_button_" + String(i)).addEventListener("click", () => {
            setMaterialList(i);
        });
    }

    // ToDo List Add
    // Set Listener -> Event -> Listener -> Delete Self -> Set Listener
    function setTodoItemListeners() {
        // ToDo Add button
        document.getElementById("todo_add_item").addEventListener("click", function onTodoAddBtnClick() {
            let id = "t" + String(new Date().getTime());
            let msg = String(document.querySelector("#todo_input").value);
            // input box
            window.api.addTodo(id, msg);
            // add innerHTML
            addTodoItem(id, msg);
            document.getElementById("todo_add_item").removeEventListener("click", onTodoAddBtnClick);
            setTodoItemListeners();
        });

        // ToDo Item Listeners
        // if we make todo moving function in later update, this should be modifieded at first
        let todoIDs = Object.keys(window.api.getJson().dashboard.todo);
        todoIDs.forEach((id) => {
            id = String(id);
            let todoItem = document.querySelector("#" + id);
            let removeButton = document.querySelector("#" + id + " > img");
            removeButton.addEventListener("click", () => {
                console.log("Remove btn : " + id);
                window.api.removeTodo(id);
                todoItem.innerHTML = "";
                let todoContainer = document.getElementById("todo");
                todoContainer.innerHTML = todoContainer.innerHTML.replace('<div class="todo_item" id="' + id + '"></div>', "");
                setTodoItemListeners();
            });
        });
    }
    setTodoItemListeners();

    // auto-update
    window.api.checkUpdate((latestObj) => {
        let frame = document.getElementById("update_container");
        frame.innerHTML = '<div class="menu_item interaction_shade update_invisible" id="update"><img id="update_img" /><p>🪄Update available✨</p></div>' + frame.innerHTML;
        document.getElementById("update_current_ver").innerText = "Current version : " + latestObj.currentVer;
        document.getElementById("update_ver").innerText = "Version : " + latestObj.ver + (latestObj.rel == "Stable" ? "" : " " + latestObj.rel);
        document.getElementById("update_desc").innerText = latestObj.description;
        document.getElementById("update_path").innerText = "Update path : " + latestObj.path;
        document.getElementById("update").addEventListener("click", function () {
            let updateButton = document.getElementById("start_update_button");
            updateButton.addEventListener("click", () => {
                updateButton.classList.add("clicked");
                let progressContainer = document.getElementById("update_status_container");
                let bar = document.getElementById("update_progress_bar");
                let percentText = document.getElementById("update_progress_percent");
                let msgDiv = document.getElementById("update_msg");
                let installButton = document.getElementById("install_update_button");

                window.api.doUpdate((progress) => {
                    switch (typeof progress) {
                        case "string":
                            msgDiv.innerText = progress;
                            msgDiv.classList.add("visible");
                            progressContainer.classList.remove("visible");
                            installButton.classList.remove("visible");
                            if (progress.indexOf("Error") != -1) {
                                frame.innerHTML = ""; // remove update menu from menu bar
                            } else if (progress == "Download has been finished") {
                                installButton.classList.add("visible");
                                installButton.addEventListener("click", () => {
                                    window.api.installUpdate();
                                });
                            }
                            break;
                        case "object":
                            msgDiv.classList.remove("visible");
                            progressContainer.classList.add("visible");
                            installButton.classList.remove("visible");
                            let percent = parseFloat(progress.percent).toFixed(2);
                            percentText.innerText = String(percent) + "%";
                            bar.value = percent;
                            break;
                        default:
                            break;
                    }
                });
            });
            changeFrame("update");
        });
    });
}

function changeFrame(page) {
    // declare frame objects
    var frames = {
        webview: document.getElementById("content_webview"),
        dashboard: document.getElementById("dashboard_div"),
        guide: document.getElementById("guide_div"),
        setting: document.getElementById("setting_div"),
        update: document.getElementById("update_div"),
    };

    // close menu bar automatically if it is opened
    var openedMenuBar = null;
    try {
        openedMenuBar = document.getElementsByClassName("menu_open")[0];
    } catch (error) {} // if menu is closed
    if (openedMenuBar != null) {
        openedMenuBar.classList.toggle("menu_close");
        openedMenuBar.classList.toggle("menu_open");
    }

    // fading effect, except the case of opening it in external browser
    function toggleVisibility() {
        Object.values(frames).forEach((frame) => {
            frame.classList.toggle("visible");
            frame.classList.toggle("invisible");
        });
    }
    function makeVisible() {
        // do after all operations have been done
        setTimeout(() => {
            toggleVisibility();
        }, 100); // invisibility sustain time
    }
    function displayNoneAll() {
        Object.values(frames).forEach((frame) => {
            frame.style.display = "none";
        });
    }
    function setScrollbarEnablement(enable) {
        // [already enabled = true , set as enabled = true] = won't be changed
        if (isScrollEnabled != enable) {
            document.getElementById("container").classList.toggle("no_scrollbar");
            isScrollEnabled = enable;
        }
    }

    if (page != "check-in") {
        try {
            window.api.log("Change page from <" + currentPage + "> to <" + page + ">");
        } catch (error) {
            // in html mode
            console.log("Window successfully opend");
        }
        // set as invisible
        toggleVisibility();
        if (page.indexOf("https://") != -1) {
            // if path contains url, use webview
            setTimeout(() => {
                // frame's transition duration is 200ms
                displayNoneAll();
                setScrollbarEnablement(false);
                frames["webview"].style.display = "block"; // overwrite
                /*
                Won't compare like this :
                var domain = path.split('://')[1].split();
                Just use some keywords, because we only use a few links...
                */
                var same = false;
                var urls = ["webstatic-sea.hoyolab.com/ys/app/interactive-map"];
                urls.forEach((url) => {
                    if (frames["webview"].src.indexOf(url) != -1 && page.indexOf(url) != -1) {
                        same = true;
                        return;
                    }
                });
                same ? null : (frames["webview"].src = page);
                makeVisible();
                currentPage = page; // set currentPage after this work ended
            }, 300);
        } else {
            setTimeout(() => {
                // frame's transition duration is 200ms
                if (currentPage != page) {
                    displayNoneAll();
                    setScrollbarEnablement(true);
                    frames[page].style.display = "block"; // overwrite
                }
                makeVisible();
                currentPage = page; // set currentPage after this work ended
            }, 300);
        }
    }
}

function changeThemeTo(theme) {
    /*
    ~~ Theme List ~~
    White - Lavender color with light mint background
    Dark - Deep blue background
    (dummy) Forest - The combination of green & brown colors
    (dummy) RAAAINBOWWW - Just like that name (With party parrot X Nyan cat)
    */
    var themeId = { white: "theme_white", dark: "theme_dark" };
    // var themeId = {'white': 'theme_white', 'dark': 'theme_dark', 'forest': 'theme_forest', 'rainbow': 'theme_rainbow'};
    enableCSS(document.getElementById(themeId[theme]));
    delete themeId[theme];
    Object.values(themeId).forEach((values) => {
        disableCSS(document.getElementById(values));
    });
}
function enableCSS(elem) {
    elem.rel = "stylesheet";
}
function disableCSS(elem) {
    elem.rel = "stylesheet alternate";
}

function setResinTimer() {
    remainedTime = window.api.getJson().dashboard.resinTimer.lastRemainedTime;
    document.getElementById("resin_timer_display").innerHTML = remainedTime + '<unit id="resin_timer_left">Left</unit>';
    times = window.api.getTimer().map((time) => time * -1);
    adjustResinTimer(times[0], times[1], times[2]);
    setResinTimerCounter();
}
function adjustResinTimer(h, m, s, save = false) {
    // input the number of consumed resin
    // 1 Resin = 8min
    let timer = document.getElementById("resin_timer_display");
    let times = timer.innerText.replace("Left", "").split(":"); // times = [h, m, s]
    times = times.map((time) => parseInt(time));
    times[0] += h;
    times[1] += m;
    times[2] += s;
    times = timeAligner(times);
    if (times[0] > 21 || (times[0] == 21 && times[1] > 20)) {
        // 21h limitation (resin * 160 = 21h)
        times = [21, 20, 0];
    } else if (times[0] < 0) {
        times = [0, 0, 0];
    }
    updateResinTNO(times[0], times[1]);
    times = makeDoubleDigitTime(times);
    combinedTime = times[0] + ":" + times[1] + ":" + times[2];
    timer.innerHTML = combinedTime + '<unit id="resin_timer_left">Left</unit>';
    if (save) {
        window.api.saveTimer(combinedTime);
    }
}
function updateResinTNO(h, m) {
    let resinNumDisplay = document.getElementById("resin_timer_tno_display");
    let num = 160 - Math.ceil((h * 60 + m) / 8);
    resinNumDisplay.innerText = num >= 0 ? num : 0;
}

function setResinTimerCounter() {
    setInterval(() => {
        adjustResinTimer(0, 0, -1);
    }, 1000);
}

function timeAligner(timeArr) {
    let positive = true;
    timeArr.forEach((time) => {
        if (time < 0) {
            positive = false;
            return;
        }
    });
    if (positive) {
        // timeArr = [h, m, s]
        if (timeArr[2] >= 60) {
            // sec -> min
            while (parseInt(timeArr[2] / 60) != 0) {
                timeArr[1] += 1;
                timeArr[2] -= 60;
            }
        }
        if (timeArr[1] >= 60) {
            // min -> hour
            while (parseInt(timeArr[1] / 60) != 0) {
                timeArr[0] += 1;
                timeArr[1] -= 60;
            }
        }
    } else {
        while (timeArr[2] < 0) {
            // min -> sec
            timeArr[1] -= 1;
            timeArr[2] += 60;
        }
        while (timeArr[1] < 0) {
            // hour -> min
            timeArr[0] -= 1;
            timeArr[1] += 60;
        }
    }
    return timeArr;
}
function makeDoubleDigitTime(timeArr) {
    timeArr = timeArr.map((time) => (time < 10 ? (time = "0" + String(time)) : time));
    return timeArr;
}

function initMaterialList() {
    let day = new Date().getDay();
    switch (day) {
        case 1:
        case 4:
            setMaterialList(1);
            day = 1;
            break;
        case 2:
        case 5:
            setMaterialList(2);
            day = 2;
            break;
        case 3:
        case 6:
            setMaterialList(3);
            day = 3;
            break;
        default:
            setMaterialList(4);
            day = 4;
            break;
    }
    document.getElementById("daily_material_list_button_" + String(day)).classList.toggle("today");
}
function setMaterialList(optNum) {
    // 1 - Mon/Thu
    // 2 - Tue/Fri
    // 3 - Wed/Sat
    // 4 - Sun

    if (optNum == 4) {
        optNum = [1, 2, 3];
    } else {
        optNum = [optNum];
    }
    let resPath = "res/ascension_domain_material/";
    let kinds = ["character", "weapon"];
    let regions = ["mond", "liyue", "inazuma"];
    let list = document.getElementById("daily_material_list");
    let imgElems = "";
    kinds.forEach((kind) => {
        regions.forEach((region) => {
            optNum.forEach((num) => {
                imgElems += '<img src="res/ascension_domain_material/' + kind + "_" + region + "_" + num + '.png" />\n';
            });
        });
    });
    list.innerHTML = imgElems;
}

function setTodoList() {
    todoJson = window.api.getJson().dashboard.todo;
    try {
        let todoIDs = Object.keys(todoJson);
        if (todoIDs) {
            // if not empty
            todoIDs.forEach((id) => {
                addTodoItem(id, todoJson[id].msg);
            });
        }
    } catch (TypeError) {
        console.log("Todo section does not exist.");
    }
}

function addTodoItem(id, msg) {
    // Add todo shell in the HTML code
    document.getElementById("todo").innerHTML += '\n<div class="todo_item" id="' + id + '">\n<p>' + msg + '</p>\n<img src="res/x.png" class="rm_todo_item_button"/>\n</div>';
}
