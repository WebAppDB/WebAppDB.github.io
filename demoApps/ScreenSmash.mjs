import { WebAppBaseClass } from "./../WebAppBaseClass.mjs"


class ScreenSmash extends WebAppBaseClass {
  
  data = {
    viewport : document.createElement("canvas"),
    gameState : this.newGameState(),
    fontList : [
      "Arial",
      "Comic Sans MS",
      "Verdana ",
      "Tahoma",
      "Trebuchet MS",
      "Times New Roman",
      "Georgia",
      "Garamond",
      "Courier New",
      "Brush Script MT",
    ]
  }

  constructor() {
    super();
  }
  
  initialize(iContainerDom) {
    iContainerDom.appendChild(this.data.viewport);
    iContainerDom.addEventListener('keydown', (event) => {
      this.data.gameState.inputQueue.push(createInput_RandPosition(String.fromCharCode(event.keyCode)));
    });
    
    iContainerDom.addEventListener("mousedown", ( event ) => {
      this.processTouchStart ({
        id : -1,
        x : event.clientX,
        y : event.clientY,
      })
    });
    iContainerDom.addEventListener("mousemove", ( event ) => {
      this.processTouchMove ({
        id : -1,
        x : event.clientX,
        y : event.clientY,
      })
    });
    iContainerDom.addEventListener("mouseup", ( event ) => {
      this.processTouchEnd ({
        id : -1,
        x : event.clientX,
        y : event.clientY,
      })
    });
    
    iContainerDom.addEventListener("touchstart", ( event ) => {
      for (var i = 0; i < event.changedTouches.length ; ++i) {
        var touchObj = event.changedTouches[i];

        this.processTouchStart ({
          id : touchObj.identifier,
          x : touchObj.clientX,
          y : touchObj.clientY,
        })
      }
      event.preventDefault();
    });
    
    iContainerDom.addEventListener("touchmove", ( event ) => {
      for (var i = 0; i < event.changedTouches.length ; ++i) {
        var touchObj = event.changedTouches[i];
        this.processTouchMove({
          id : touchObj.identifier,
          x : touchObj.clientX,
          y : touchObj.clientY,
        });
      }
      event.preventDefault();
    });

    iContainerDom.addEventListener("touchend", ( event ) => {
      for (var i = 0; i < event.changedTouches.length ; ++i) {
        var touchObj = event.changedTouches[i];
        this.processTouchEnd({
          id : touchObj.identifier,
          x : touchObj.clientX,
          y : touchObj.clientY,
        })
      }
      event.preventDefault();
    });

    iContainerDom.focus();
  }

  destroy(iContainerDom) {
  }

  resize(iContainerDom) {
    
    if ( this.data.viewport.height != iContainerDom.clientHeight) {
      this.data.viewport.height = iContainerDom.clientHeight;
    }

    if ( this.data.viewport.width != iContainerDom.clientWidth) {
      this.data.viewport.width = iContainerDom.clientWidth;
    }
  }

  gameLoop(iDt, iContainerDom) {
    var wRemoveList = [];
    for ( var i = 0; i < this.data.gameState.inputQueue.length; ++i) {
      this.data.gameState.inputQueue[i].dt += iDt;
      if (5 < this.data.gameState.inputQueue[i].dt) {
        wRemoveList.push(i);
      }
      else {
        this.data.gameState.inputQueue[i].alpha = Math.min(1, 1 - (this.data.gameState.inputQueue[i].dt - 0.5) *0.5);
      }
    }

    for ( var i = wRemoveList.length - 1; i >= 0; --i) {
      this.data.gameState.inputQueue.splice(wRemoveList[i], 1);
    }
    return true;
  }
  
  render(iDt, iContainerDom) {
    var wCtx = this.data.viewport.getContext("2d");
    
    if (null == wCtx) return;

    wCtx.clearRect(0, 0, this.data.viewport.clientWidth, this.data.viewport.clientHeight );
    
    for ( var i = 0; i < this.data.gameState.inputQueue.length; ++i) {
      var it = this.data.gameState.inputQueue[i];
      wCtx.textAlign = "center";
      wCtx.textBaseline = "middle";
      wCtx.fillStyle = "rgba(" + it.fileStyle_r +  "," + it.fileStyle_g +  "," + it.fileStyle_b + "," + it.alpha + ")";
      wCtx.strokeStyle = "rgba(" + it.strokeStyle_r +  "," + it.strokeStyle_g +  "," + it.strokeStyle_b + "," + it.alpha + ")";;
      wCtx.lineWidth = it.lineWidth;
      wCtx.font = it.font;
      wCtx.strokeText( it.text, it.x*window.innerWidth , it.y*window.innerHeight);
      wCtx.fillText(it.text, it.x*window.innerWidth , it.y*window.innerHeight);    
    }
  }

  
  newGameState() {
    var baseSize = Math.sqrt( window.innerWidth*window.innerWidth  + window.innerHeight*window.innerHeight);
  
    return {
      dropDist : 0.1*baseSize,
      inputQueue : [],        
      touchPoints : []
    }
  }

  createInput(iMessage, iX, iY) {

    var baseSize = window.innerWidth < window.innerHeight ? window.innerWidth : window.innerHeight;
    return {
      text : iMessage,
      x : iX,
      y : iY,
      dt : 0.0,
      alpha : 1.0,
      fileStyle_r : Math.random()*255,
      fileStyle_g : Math.random()*255,
      fileStyle_b : Math.random()*255,
      strokeStyle_r : Math.random()*255,
      strokeStyle_g : Math.random()*255,
      strokeStyle_b : Math.random()*255,
      lineWidth : Math.random()*50,
      font : Math.round((0.1 + 0.9*Math.random())*baseSize)  + "px " + this.data.fontList[Math.floor(Math.random()*this.data.fontList.length)],
    };
  }

  createInput_RandPosition(iMessage) {
    return this.createInput(iMessage, Math.random(), Math.random());
  }

  createInput_RandText(iX, iY) {
    var char = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var selected = char[Math.floor(Math.random()*char.length)];
    return this.createInput(selected, iX, iY);
  }

  processTouchStart(touchObj) {
    
    var existingObj = null;
    for (var k = 0; k < this.data.gameState.touchPoints.length ; ++k) {
      if (this.data.gameState.touchPoints[k].id == touchObj.identifier) {
        existingObj = this.data.gameState.touchPoints[k];
        break;
      }
    }
    if (null != existingObj) {
      existingObj.id = touchObj.id;
      existingObj.x = touchObj.x;
      existingObj.y = touchObj.y;
      existingObj.x0 = touchObj.x;
      existingObj.y0 = touchObj.y;
      existingObj.t0 = Date.now();
    }
    else {
      this.data.gameState.touchPoints.push({
        id : touchObj.id,
        x : touchObj.x,
        y : touchObj.y,
        x0 : touchObj.x,
        y0 : touchObj.y,
        t0 : Date.now()
      });
    }

    this.data.gameState.inputQueue.push(this.createInput_RandText(touchObj.x/window.innerWidth, touchObj.y/window.innerHeight));
  }

  processTouchMove(touchObj) {
    for (var k = 0; k < this.data.gameState.touchPoints.length ; ++k) {
      if (this.data.gameState.touchPoints[k].id == touchObj.id) {

        var dx = (touchObj.x - this.data.gameState.touchPoints[k].x)/this.data.gameState.dropDist;
        var dy = (touchObj.y - this.data.gameState.touchPoints[k].y)/this.data.gameState.dropDist;
        var update = false;
        if (1 < dx*dx + dy*dy) {
          this.data.gameState.inputQueue.push(this.createInput_RandText(touchObj.x/window.innerWidth, touchObj.y/window.innerHeight));
          this.data.gameState.touchPoints[k].x = touchObj.x;
          this.data.gameState.touchPoints[k].y = touchObj.y;
        }
        break;
      }
    }
  }
  
  processTouchEnd(touchObj) {
    for (var k = this.data.gameState.touchPoints.length - 1; k >= 0 ; --k) {
      if (this.data.gameState.touchPoints[k].id == touchObj.id) {

        this.data.gameState.touchPoints.splice(k, 1);
        break;
      }
    }
  }
}


export function getApp() {
  return new ScreenSmash();
}