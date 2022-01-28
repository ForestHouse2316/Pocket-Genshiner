var currentPage = null;

window.addEventListener('load', function(){
    console.log("--Page Load--");
    setSideMenuExtension();
    setMenuSelectListener();
});









function sleep(ms){
    ts1 = new Date().getTime() + ms;
    do ts2 = new Date().getTime(); while (ts2<ts1);
  }

function setSideMenuExtension() {
    var menuIcon = document.getElementById('menu_icon');
    menuIcon.addEventListener('click', function(){
        var menuElem = document.getElementById('menu_bar');
        menuElem.classList.toggle('menu_close');
        menuElem.classList.toggle('menu_open');      
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
        document.querySelector("#content_frame").shadowRoot.querySelector("iframe").height = '100%';
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
    var frame = document.getElementById('content_frame');
    var openedMenuBar = null;
    try {
        openedMenuBar = document.getElementsByClassName("menu_open")[0];
    } catch (error) {} // if menu is closed
    if (openedMenuBar != null) {
        openedMenuBar.classList.toggle('menu_close');
        openedMenuBar.classList.toggle('menu_open');   
    }
    if(path != "check-in") { // if path==check-in, close the menu bar only
        // set as invisible
        frame.classList.toggle('visible');
        frame.classList.toggle('invisible');
        setTimeout(() => { // frame's transition duration is 200ms
            frame.src = path;
            setTimeout(() => {
                frame.classList.toggle('visible');
                frame.classList.toggle('invisible');
            }, 100);
        }, 300);
    }
}
