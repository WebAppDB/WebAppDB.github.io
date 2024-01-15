import { WebAppBaseClass } from "./WebAppBaseClass.mjs"
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

function createAppPage(iAppObj) {
  const contentDom = document.createElement('div');
  contentDom.class = "content";
  contentDom.style.overflowY = "scroll";
  contentDom.style.overflowX = "hidden";
  fetchAndPopulateDom(contentDom, "./appList.json", iAppObj)

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
    engine : null
  }

  constructor(iContainerDom) {
    super();
    var wEngineDom = document.createElement("div");
    this.data.engine = new WebAppEngine(wEngineDom, this);
    this.data.engine.runEngine();
    iContainerDom.appendChild(wEngineDom);
  }
  
  initialize(iContainerDom) {
    iContainerDom.appendChild(createAppPage(this));
    disableSelect();
  }
/*
  destroy() {
    alert("Goodbye from Test App 1")
  }

  gameLoop(wDt) {
    return true;
  }
  
  render(iDt, iCanvasDom) {
  }
*/

  
}


var wBaseApp = null;
window.addEventListener("load", function() {
  wBaseApp = new WebAppDB(document.body);
});