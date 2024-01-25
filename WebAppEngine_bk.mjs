
var pageEnum = {
  App : "App",
  Viewport : "Viewport",
}

var gGlobal = {
  elapseTime : 0,
  lastIterationTime :Date.now(),
  navBarHeight : 50,
  appObject : null,
  pages : {}
};

async function loadModule(iModulePath) {
  const module = await import(iModulePath);
  var wAppObj = module.getApp();
  if (null != wAppObj) {
    if (null != gGlobal.appObject ) {
      unloadModule();
    }
    gGlobal.appObject = wAppObj;
    gGlobal.appObject.initialize();  
  }
}

async function unloadModule() {
  if (null != gGlobal.appObject) {
    gGlobal.appObject.destroy();
    gGlobal.appObject = null;
  }
}

function createPageObj() {
  return {
    buildFunc : null,
    initFunc : null,
    resizeFunc : null,
    domObj : null
  }
}

function changePage(iNewPageEnum, iCreateNew) {
  for (const wMode in gGlobal.pages) {
    if (null != gGlobal.pages[wMode].domObj) {
      if (document.body.contains(gGlobal.pages[wMode].domObj)) {
        document.body.removeChild(gGlobal.pages[wMode].domObj);
      }  
    }
  }
  if (true == iCreateNew || null == gGlobal.pages[iNewPageEnum].domObj) {
    gGlobal.pages[iNewPageEnum].domObj = gGlobal.pages[iNewPageEnum].buildFunc();
  }
  document.body.appendChild(gGlobal.pages[iNewPageEnum].domObj);
}

export function changePageToApp() {
  changePage(pageEnum.App, false);
}

export function changePageToViewport() {
  changePage(pageEnum.Viewport, true);
}

function entryPoint() {

  var wNow = Date.now();
  var wDt = (wNow - gGlobal.lastIterationTime) / 1000;
  gGlobal.lastIterationTime = wNow;
  if (0.025 < wDt) wDt = 0.025; // limit elapseTime
  gGlobal.elapseTime += wDt;

  resize(); // update window size

  if (null != gGlobal.appObject) {
    if(true == gGlobal.appObject.gameLoop(wDt)) {
      gGlobal.appObject.render(wDt, document.getElementById(gGlobal.viewportId));
    }
    else {
      unloadModule();
      changePageToApp();
    }
  }
  
  window.requestAnimationFrame(entryPoint); // call next frame
}

function resizeFillScreen(iDom){
  
  iDom.style.position = "fixed";
  iDom.style.bottom = "0px";

  var desireHeight = iDom.offsetTop + iDom.offsetHeight +1;
  var desireWidth = window.innerWidth + 1;
  if (iDom.clientHeight != desireHeight) {
    iDom.style.height = desireHeight + "px";
  
    if (null != iDom.WebAppEngineContentDom && null != iDom.WebAppEngineNavBarDom) {
      iDom.WebAppEngineContentDom.style.height = desireHeight - gGlobal.navBarHeight + "px";
      iDom.WebAppEngineNavBarDom.style.height = gGlobal.navBarHeight + "px";
    }
  }
  if (iDom.width != desireWidth) iDom.width = desireWidth;

}

function resize() {

  // document.body.style.height = navBarDom.height + 2 + "px";
   document.body.style.width = "100vw";

  for (const wMode in gGlobal.pages) {
    if (null != gGlobal.pages[wMode].domObj) {
      if (document.body.contains(gGlobal.pages[wMode].domObj)) {
        if(null != gGlobal.pages[wMode].resizeFunc) gGlobal.pages[wMode].resizeFunc
        
        (gGlobal.pages[wMode].domObj);
      }  
    }
  }
}

function disableSelect() {
  const styleElement = document.createElement('style');
  // Define CSS rules
  const cssRules = `
    body {
      /* disable selection to prevent selecting the view port*/
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  `;  
  styleElement.innerHTML = cssRules;
  document.head.appendChild(styleElement);
}

function fetchAndPopulateDom( iDom, iAppListPath ) {
  fetch(iAppListPath)
  .then(response => response.json())
  .then(data => {
    populateDomWithAppList( iDom, data);
  })
  .catch(error => {
    iDom.innerHTML = "<div>Error getting Application List</div>";
  })
}

function populateDomWithAppList( iDom, iAppList) {

  iAppList.forEach( function (iApp) {
    const appDom = document.createElement('div');
    appDom.classList.add("app_label");

    const modulePath = iApp.module;
    appDom.addEventListener("click", function () { loadModule(modulePath).then( changePageToViewport) })
    
    const titleDom = document.createElement('div');
    titleDom.innerHTML = iApp.title;
    titleDom.classList.add("app_title");
    appDom.appendChild(titleDom);
    
    const descriptionDom = document.createElement('div');
    descriptionDom.innerHTML = iApp.description;
    descriptionDom.classList.add("app_description");
    appDom.appendChild(descriptionDom);

    const iconImage = new Image();
    iconImage.src = iApp.icon;
    iconImage.alt = iApp.title;
    iconImage.classList.add("app_icon");
    appDom.appendChild(iconImage);
    
    iDom.appendChild(appDom);
  })
}

function createAppPage() {
  const contentDom = document.createElement('div');
  contentDom.class = "content";
  contentDom.style.overflowY = "scroll";
  contentDom.style.overflowX = "hidden";
  fetchAndPopulateDom(contentDom, "./appList.json")

  const navBarDom = document.createElement('div');
  navBarDom.class = "navbar";
  navBarDom.style.width = "100vw";
  navBarDom.style.height = "50px";

  var returnDom = document.createElement('div');
  returnDom.appendChild(contentDom);
  returnDom.appendChild(navBarDom);

  returnDom.WebAppEngineContentDom = contentDom;
  returnDom.WebAppEngineNavBarDom = navBarDom;

  return returnDom;
}

function createViewport() {
  var returnDom = document.createElement('div');
  returnDom.style.position = "fixed";
  returnDom.style.bottom = "-1px";
  returnDom.style.left = "-1px";

  var backButton = document.createElement('div');
  backButton.innerText = "< Back";
  backButton.style.position = "fixed";
  backButton.style.top = "0px";
  backButton.style.left = "0px";
  backButton.classList.add("viewport_backButton")
  backButton.style.zIndex = "9999";
  backButton.addEventListener("click", function() { 
    unloadModule();
    changePageToApp();
  });
  returnDom.appendChild(backButton);
  
  return returnDom;
}

function setupHtml() {
  document.body.style.padding = 0;
  document.body.style.margin = 0;
  document.body.style.overflow = "hidden";

  gGlobal.pages[pageEnum.App] = createPageObj();
  gGlobal.pages[pageEnum.App].buildFunc = createAppPage;
  gGlobal.pages[pageEnum.App].resizeFunc = resizeFillScreen;

  gGlobal.pages[pageEnum.Viewport] = createPageObj();
  gGlobal.pages[pageEnum.Viewport].buildFunc = createViewport;
  gGlobal.pages[pageEnum.Viewport].resizeFunc = resizeFillScreen;
  
  changePageToApp();
}

function init() {
  disableSelect();
  setupHtml();  
  window.requestAnimationFrame(entryPoint);
}

window.addEventListener("load", init);
window.addEventListener("resize", resize);