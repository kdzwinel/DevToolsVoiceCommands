const IDLE = 1;
const RECORDING = 2;

class RecordingIcon {
  construct() {
    this._status = IDLE;
    this._animationInterval = null;
  }

  show() {
    this._status = RECORDING;

    let i = 0;
    let animation = ' ·';

    function updateFrame() {
      var frame = animation[i % animation.length];
      i++;

      chrome.browserAction.setBadgeText({
        text: frame
      });
    }

    updateFrame();

    this._animationInterval = setInterval(updateFrame, 150);
  }

  hide() {
    this._status = IDLE;

    if (this._animationInterval) {
      clearInterval(this._animationInterval);
    }

    chrome.browserAction.setBadgeText({
      text: ''
    });
  }
}

export default RecordingIcon;