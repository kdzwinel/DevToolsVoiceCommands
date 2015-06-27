const IDLE = 1;
const RECORDING = 2;

class RecordingIcon {
  construct() {
    this._status = IDLE;
  }

  show() {
    this._status = RECORDING;

    chrome.browserAction.setBadgeText({
      text: '·'
    });
  }

  hide() {
    this._status = IDLE;

    chrome.browserAction.setBadgeText({
      text:''
    });
  }
}

export default RecordingIcon;