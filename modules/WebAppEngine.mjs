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
    appStack : [],
    frameDom : null,
    backButton : null,
  };
  
  constructor(iFrameDom, iBaseApp) {
    this.data.frameDom = iFrameDom;
    this.data.frameDom.style.margin = "0px";
    this.data.frameDom.style.padding = "0px";
    this.data.backButton = createBackButton(this);
    this.data.frameDom.appendChild(this.data.backButton);

    if (null != iBaseApp) {
      this.data.appStack.push(appContainerObject(iBaseApp, createAppContainerDom()));
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
      this.data.appStack.push( appContainerObject(wAppObj, createAppContainerDom(this)));
      this.data.appStack.at(-1).appObj.initialize(this.data.appStack.at(-1).appDom);
      this.data.frameDom.appendChild(this.data.appStack.at(-1).appDom);

      this.data.backButton.style.display = "block";
    }
  }

  async unloadModule() {
    if (0 != this.data.appStack.length) {
      var wLastApp = this.data.appStack.pop();
      this.data.frameDom.removeChild(wLastApp.appDom);
      wLastApp.appObj.destroy(wLastApp.appDom);
      this.data.backButton.style.display = "none";

      if (0 != this.data.appStack.length) {
        var wNextApp = this.data.appStack.at(-1);
        this.data.frameDom.appendChild(wNextApp.appDom);
        
        if ( 1 < this.data.appStack.length) {
          this.data.backButton.style.display = "block";
        }
      }
    }
  }

  engineResize() {
    if (0 != this.data.appStack.length) {
      var wRunningApp = this.data.appStack.at(-1);

      if (null != this.data.frameDom) {
        var resizeApp = false;
        if(this.data.frameDom.clientHeight != wRunningApp.appDom.clientHeight) {
          wRunningApp.appDom.style.height = this.data.frameDom.clientHeight + "px";
          resizeApp = true;
        }
        if(this.data.frameDom.clientWidth != wRunningApp.appDom.clientWidth) {
          wRunningApp.appDom.style.width = this.data.frameDom.clientWidth + "px";
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
      if(true == wRunningApp.appObj.gameLoop(wDt, this.data.workingDom)) {
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

function createAppContainerDom() {
  var returnDom = document.createElement('div');
  returnDom.style.position = "fixed";
  returnDom.style.bottom = "0px";
  returnDom.style.left = "0px";
  returnDom.style.margin = "0px";
  returnDom.style.padding = "0px";

  return returnDom;
}

function createBackButton( iEngine ) {

  var backButton = document.createElement('div');
  backButton.innerText = "< Back";
  backButton.style.position = "fixed";
  backButton.style.top = "0px";
  backButton.style.left = "0px";
  backButton.classList.add("viewport_backButton")
  backButton.style.zIndex = "9999";
  backButton.style.display = "none";
  backButton.addEventListener("click", function() { 
    iEngine.unloadModule();
  });

  return backButton;
}

