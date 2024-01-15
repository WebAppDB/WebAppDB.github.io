export class WebAppBaseClass {

  constructor() {
  }

  initialize() {
  }

  destroy() {
  }

  gameLoop(wDt) {
    return true;
  }
  
  render(iDt, iCanvasDom) {
  }

}

export function getApp() {
  return new WebAppBaseClass();
}