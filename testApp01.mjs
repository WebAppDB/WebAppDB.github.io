import { WebAppBaseClass } from "./WebAppBaseClass.mjs"

class testApp extends WebAppBaseClass {

  constructor() {
    super();
  }
  
  initialize() {
    alert("Hi from Test App 1")
  }

  destroy() {
    alert("Goodbye from Test App 1")
  }

  gameLoop(wDt) {
    return true;
  }
  
  render(iDt, iCanvasDom) {
  }

}


export function getApp() {
  return new testApp();
}