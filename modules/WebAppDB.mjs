import { WebAppBaseClass } from "../api/v01/WebAppBaseClass.mjs"
import { WebAppEngine } from "./WebAppEngine.mjs"

function fetchAndPopulateDom( iDom, iAppListPath , iAppObj) {
  fetch(iAppListPath)
  .then(response => response.json())
  .then(data => {
    populateDomWithAppList( iDom, data, iAppObj);
  })
  .catch(error => {
    iDom.innerHTML = "<div>Error getting Application List</div>";
  })
}

function populateDomWithAppList( iDom, iAppList, iAppObj) {

  iAppList.forEach( function (iApp) {
    const appDom = document.createElement('div');
    appDom.classList.add("app_label");

    const modulePath = iApp.module;
    appDom.addEventListener("click", function () { iAppObj.data.engine.loadModule(modulePath);})
    
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

function createAppPage(iContainerDom, iAppObj) {
  const contentDom = document.createElement('div');
  contentDom.class = "content";
  contentDom.style.overflowY = "scroll";
  contentDom.style.overflowX = "hidden";
  contentDom.style.padding = "0px";
  contentDom.style.margin = "0px";

  fetchAndPopulateDom(contentDom, "./appList.json", iAppObj)

  const navBarDom = document.createElement('div');
  navBarDom.class = "navbar";
  navBarDom.style.height = "50px";
  navBarDom.style.padding = "0px";
  navBarDom.style.margin = "0px";
  navBarDom.classList.add("nav_bar");

  iContainerDom.appendChild(contentDom);
  iContainerDom.appendChild(navBarDom);

  iContainerDom.WebAppEngineContentDom = contentDom;
  iContainerDom.WebAppEngineNavBarDom = navBarDom;
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


class WebAppDB extends WebAppBaseClass {

  data = {
    engine : null,
    navBarHeight : 100
  }

  constructor(iContainerDom) {
    super();
    this.data.engine = new WebAppEngine(iContainerDom, this);
    this.data.engine.runEngine();
  }
  
  initialize(iContainerDom) {
    createAppPage( iContainerDom, this);
    disableSelect();
  }

  destroy(iContainerDom) {
  }
  
  resize(iContainerDom) {
    
    if (null != iContainerDom.WebAppEngineContentDom && null != iContainerDom.WebAppEngineNavBarDom) {
      iContainerDom.WebAppEngineContentDom.style.width = "auto";
      iContainerDom.WebAppEngineContentDom.style.height = iContainerDom.clientHeight - this.data.navBarHeight + "px";

      iContainerDom.WebAppEngineNavBarDom.style.width = "auto";
      iContainerDom.WebAppEngineNavBarDom.style.height = this.data.navBarHeight + "px";
    }
  }

/*
  gameLoop(wDt) {
    return true;
  }
  
  render(iDt, iCanvasDom) {
  }
*/

  
}


function resizeFillScreen(iDom){
  
  iDom.style.position = "fixed";
  iDom.style.bottom = "0px";

  var desireHeight = iDom.offsetTop + iDom.offsetHeight;
  var desireWidth = window.innerWidth;
  if (iDom.clientHeight != desireHeight) {
    iDom.style.height = desireHeight + "px";
  }
  if (iDom.clientWidth != desireWidth) iDom.style.width = desireWidth + "px";

  window.requestAnimationFrame(function() { resizeFillScreen(iDom); })
}

var wBaseApp = null;
window.addEventListener("load", function() {
  var wContainerDom = document.createElement("div");
  document.body.append(wContainerDom)
  document.body.style.margin = "0px";
  document.body.style.padding = "0px";

  wBaseApp = new WebAppDB(wContainerDom);
  window.requestAnimationFrame(function() { resizeFillScreen(wContainerDom); })
});

