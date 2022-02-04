var currentPage = "init";

// set the padding according to this value
// basically 'no_scrollbar' class is disabled in 'index.html'
var isScrollEnabled = true;

window.addEventListener("load", function () {
    console.log("--Page Load--");
    setSideMenuExtension();
    setMenuSelectListener();
    changeThemeTo("dark"); // Initial theme setting
});

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
        changeFrame("https://webstatic-sea.mihoyo.com/app/ys-map-sea/index.html?utm_source=tools&bbs_theme_device=1#/map/2");
        document.querySelector("#content_webview").shadowRoot.querySelector("iframe").height = "100%";
    });
    guide.addEventListener("click", function () {
        changeFrame("guide");
    });
    setting.addEventListener("click", function () {
        changeFrame("setting");
    });
}

function changeFrame(page) {
    // declare frame objects
    var frames = {
        webview: document.getElementById("content_webview"),
        dashboard: document.getElementById("dashboard_div"),
        guide: document.getElementById("guide_div"),
        setting: document.getElementById("setting_div"),
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
        window.api.log("Change page from <" + currentPage + "> to <" + page + ">");

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
                var urls = ["webstatic-sea.mihoyo.com/app/ys-map-sea/index.html"];
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
