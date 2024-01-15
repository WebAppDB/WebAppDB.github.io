function appContainerObject(iAppObj, iAppDom){
  return {
    appObj : iAppObj,
    appDom : iAppDom
  };
}

export class WebAppEngine {

  data = {
    elapseTime : 0,
    lastIterationTime :Date.now(),
    navBarHeight : 50,
    appStack : [],
    frameDom : null,
  };
  
  constructor(iFrameDom, iBaseApp) {
    this.data.frameDom = iFrameDom;
    if (null != iBaseApp) {
      this.data.appStack.push(appContainerObject(iBaseApp, document.createElement("div")));
      this.data.appStack.at(-1).appObj.initialize(this.data.appStack.at(-1).appDom);
      this.data.frameDom.appendChild(this.data.appStack.at(-1).appDom);
    }
  }

  async loadModule(iModulePath) {
    const module = await import(iModulePath);
    var wAppObj = module.getApp();
    if (null != wAppObj) {      
      if (0 != this.data.appStack.length) {
        var wLastApp = this.data.appStack.at(-1);
        this.data.frameDom.removeChild(wLastApp.appDom);
      }
      this.data.appStack.push( appContainerObject(wAppObj, createViewport(this)));
      this.data.appStack.at(-1).appObj.initialize(this.data.appStack.at(-1).appDom);
      this.data.frameDom.appendChild(this.data.appStack.at(-1).appDom);
    }
  }

  async unloadModule() {
    if (0 != this.data.appStack.length) {
      var wLastApp = this.data.appStack.pop();
      this.data.frameDom.removeChild(wLastApp.appDom);
      wLastApp.appObj.destroy();

      if (0 != this.data.appStack.length) {
        var wNextApp = this.data.appStack.at(-1);
        this.data.frameDom.appendChild(wNextApp.appDom);
      }
    }
  }

  engineResize() {
    if (0 != this.data.appStack.length) {
      var wRunningApp = this.data.appStack.at(-1);

      if (null != this.data.baseDom) {
        var resizeApp = false;
        if(this.data.baseDom.clientHeight != wRunningApp.appDom.clientHeight) {
          wRunningApp.appDom.style.height = this.data.baseDom.clientHeight + "px";
          resizeApp = true;
        }
        if(this.data.baseDom.clientWidth != wRunningApp.appDom.clientWidth) {
          wRunningApp.appDom.style.width = this.data.baseDom.clientWidth + "px";
          resizeApp = true;
        }

        if (true == resizeApp) {
          wRunningApp.appObj.resize(wRunningApp.appDom);
        }
      }
    }
  }

  engineEntryPoint (iApp) {
    var wNow = Date.now();
    var wDt = (wNow - this.data.lastIterationTime) / 1000;
    this.data.lastIterationTime = wNow;
    if (0.025 < wDt) wDt = 0.025; // limit elapseTime
    this.data.elapseTime += wDt;

    this.engineResize(); // update window size

    if (0 != this.data.appStack.length) {
      var wRunningApp = this.data.appStack.at(-1);
      if(true == wRunningApp.appObj.gameLoop(wDt)) {
        wRunningApp.appObj.render(wDt, this.data.workingDom );
      }
      else {
        this.unloadModule();
      }
    }
    
    window.requestAnimationFrame(this.engineEntryPoint.bind(this));
  }

  runEngine () {
    window.requestAnimationFrame(this.engineEntryPoint.bind(this));
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


function createViewport( iEngine ) {
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
    iEngine.unloadModule();
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

