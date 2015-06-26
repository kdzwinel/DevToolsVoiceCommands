export function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({active: true}, (tabs) => {
      if (tabs.length === 0) {
        reject();
        return;
      }

      resolve(tabs[0]);
    })
  });
}

export default {};