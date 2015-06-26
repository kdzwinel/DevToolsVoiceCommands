function _attach(tabId) {
  var protocolVersion = '1.1';

  return new Promise((resolve, reject) => {
    chrome.debugger.attach({
      tabId: tabId
    }, protocolVersion, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
        return;
      }

      resolve();
    });
  });
}

function _detach(tabId) {
  return new Promise((resolve, reject) => {
    chrome.debugger.detach({
      tabId: tabId
    }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
        return;
      }

      resolve();
    });
  });
}

function _sendCommand(tabId, command, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({
      tabId: tabId
    }, command, data, (response) => {
      if (response.error) {
        reject(response.error);
        return;
      }

      resolve(response);
    });
  });
}

class TabDebugger {
  constructor(tabId) {
    this._tabId = tabId;
    this._attached = true;

    chrome.debugger.onDetach.addListener((source, reason) => {
      if(source.tabId === this._tabId) {
        this._attached = false;
      }
    });
  }

  connect() {
    return _attach(this._tabId).then(() => {
      this._attached = true;
    });
  }

  disconnect(){
    return _detach(this._tabId);
  }

  isConnected() {
    return this._attached;
  }

  sendCommand(command, data) {
    if(!this._attached) {
      return this.connect().then(() => {
        return _sendCommand(this._tabId, command, data);
      });
    }

    return _sendCommand(this._tabId, command, data);
  }
}

export default TabDebugger;