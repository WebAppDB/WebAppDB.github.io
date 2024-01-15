export class WebAppBaseClass {

  constructor() {
  }

  initialize(iContainerDom) {
  }

  destroy() {
  }

  gameLoop(wDt) {
    return true;
  }
  
  resize(iContainerDom) {

  }

  render(iDt, iCanvasDom) {
  }

}

export function getApp() {
  return new WebAppBaseClass();
}