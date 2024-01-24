import { WebAppBaseClass } from "./api/v01/WebAppBaseClass.mjs"

class testApp extends WebAppBaseClass {

  constructor() {
    super();
  }
  
  initialize(iContainerDom) {
    alert("Hi from Test App 1")
  }

  destroy(iContainerDom) {
    alert("Goodbye from Test App 1")
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