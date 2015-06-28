class InjectedConsole {
  constructor(tabId) {
    this._tabId = tabId;

    chrome.tabs.executeScript(tabId, {
      file: 'bower_components/traceur-runtime/traceur-runtime.min.js'
    }, () => {
      chrome.tabs.executeScript(tabId, {
        file: 'dist/content-script.js'
      });
    });
  }

  logMessage(text) {
    chrome.tabs.sendMessage(this._tabId, {
      type: 'log',
      content: text
    });
  }

  destroy() {
    chrome.tabs.sendMessage(this._tabId, {
      type: 'destroy'
    });
  }
}

export default InjectedConsole;