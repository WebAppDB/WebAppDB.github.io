import { WebAppBaseClass } from "./WebAppBaseClass.mjs"

class testApp extends WebAppBaseClass {

  constructor() {
    super();
  }
  
  initialize(iContainerDom) {
    alert("Hi from Test App 2")
  }

  destroy(iContainerDom) {
    alert("Goodbye from Test App 2")
  }

  gameLoop(iDt, iContainerDom) {
    return true;
  }
  
  render(iDt, iContainerDom) {
  }

}


export function getApp() {
  return new testApp();
}