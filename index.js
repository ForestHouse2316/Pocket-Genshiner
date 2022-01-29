var currentPage = null;

window.addEventListener('load', function(){
    console.log("--Page Load--");
    setSideMenuExtension();
    setMenuSelectListener();
    changeThemeTo('dark');  // Initial theme setting
});









function sleep(ms){
    ts1 = new Date().getTime() + ms;
    do ts2 = new Date().getTime(); while (ts2<ts1);
  }

function setSideMenuExtension() {
    var menuIcon = document.getElementById('menu_icon');
    menuIcon.addEventListener('click', function(){
        var menuElem = document.getElementById('menu_bar');
        var menuSpace = document.getElementById('menu_space');
        menuElem.classList.toggle('menu_close');
        menuElem.classList.toggle('menu_open');
        menuSpace.classList.toggle('menu_close');
        menuSpace.classList.toggle('menu_open');
    });
}

function setMenuSelectListener() {
    var dashboard = document.getElementById('dashboard');
    var check_in = document.getElementById('check-in');
    var map = document.getElementById('map');
    var guide = document.getElementById('guide');
    var setting = document.getElementById('setting');

    changeFrame("dashboard/dashboard.html");  // initial page setting
    currentPage = "dashboard";

    dashboard.addEventListener('click', function(){
        changeFrame("dashboard/dashboard.html");
        currentPage = "dashboard";
    });
    check_in.addEventListener('click', function() {
        changeFrame("check-in");
        window.api.openURL("https://webstatic-sea.mihoyo.com/ys/event/signin-sea-v3/index.html?act_id=e202102251931481&mhy_auth_required=true&mhy_presentation_style=fullscreen&utm_source=tools&bbs_theme=dark&bbs_theme_device=1");
    });
    map.addEventListener('click', function() {
        changeFrame("https://webstatic-sea.mihoyo.com/app/ys-map-sea/index.html?utm_source=tools&bbs_theme_device=1#/map/2");
        document.querySelector("#content_webview").shadowRoot.querySelector("iframe").height = '100%';
        currentPage = "map";
    });
    guide.addEventListener('click', function() {
        changeFrame("dashboard/dashboard.html");
        currentPage = "guide";
    });
    setting.addEventListener('click', function() {
        changeFrame("dashboard/dashboard.html");
        currentPage = "setting";
    });
    
}

function changeFrame(path) {
    var webview = document.getElementById('content_webview');
    var iframe = document.getElementById('content_iframe');

    // close menu bar automatically if it is opened

    var openedMenuBar = null;
    try {
        openedMenuBar = document.getElementsByClassName("menu_open")[0];
    } catch (error) {}  // if menu is closed
    if (openedMenuBar != null) {
        openedMenuBar.classList.toggle('menu_close');
        openedMenuBar.classList.toggle('menu_open');   
    }

    // fading effect, except the case of opening it in external browser

    function toggleVisibility() {
        iframe.classList.toggle('visible');
        iframe.classList.toggle('invisible');
        webview.classList.toggle('visible');
        webview.classList.toggle('invisible');
    }
    function makeVisible() {
        setTimeout(() => {
            toggleVisibility();
        }, 100);  // invisibility sustain time
    }
    if(path != "check-in") {
        // set as invisible
        toggleVisibility();

        if(path.indexOf("https://") != -1) {  // if path contains url, use webview
            setTimeout(() => {  // frame's transition duration is 200ms
                iframe.style.display = 'none';
                webview.style.display = 'block';
                /*
                Won't compare like this :
                var domain = path.split('://')[1].split();
                Just use some keywords, because we only use a few links...
                */
                var same = false;
                var urls = ['webstatic-sea.mihoyo.com/app/ys-map-sea/index.html'];
                urls.forEach((url) => {
                    if(webview.src.indexOf(url) != -1 && path.indexOf(url) != -1) {
                        same = true;
                        return;
                    }
                });
                same ? null : webview.src = path;
                makeVisible();
            }, 300);
        }
        else {
            setTimeout(() => {  // frame's transition duration is 200ms
                iframe.style.display = 'block';
                webview.style.display = 'none';
                iframe.src != path ? iframe.src = path : null;
                makeVisible();
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
    var themeId = {'white': 'theme_white', 'dark': 'theme_dark'};
    // var themeId = {'white': 'theme_white', 'dark': 'theme_dark', 'forest': 'theme_forest', 'rainbow': 'theme_rainbow'};
    enableCSS(document.getElementById(themeId[theme]));
    delete themeId[theme];
    Object.values(themeId).forEach(values => {
        disableCSS(document.getElementById(values))
    });
}
function enableCSS(elem) {
    elem.rel = 'stylesheet';
}
function disableCSS(elem) {
    elem.rel = 'stylesheet alternate';
}