export class WebAppBaseClass {

  constructor() {
  }

  initialize(iContainerDom) {
  }

  destroy(iContainerDom) {
  }

  resize(iContainerDom) {
  }

  gameLoop(wDt, iContainerDom) {
    return true;
  }
  
  render(iDt, iContainerDom) {
  }

}

export function getApp() {
  return new WebAppBaseClass();
}