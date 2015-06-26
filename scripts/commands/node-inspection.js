import Command from '../command.js';

class NodeInspectionCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /(select|inspect) (\w+)/i;
  }

  execute(text) {
    let matches = text.match(this._regex);

    if(matches) {
      return this.selectNode(matches[2] + ', #' + matches[2]);
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  selectNode(selector) {
    console.log('selectNode', selector);

    let tabDebugger = this._commandRunner.getTabDebugger();
    let rootNodeId = this._commandRunner.getRootNodeId();

    return tabDebugger.sendCommand('DOM.querySelector', {
      nodeId: rootNodeId,
      selector
    }).then((data) => {
      if(!data.nodeId) {
        chrome.tts.speak('Node not found.');
        throw new Error('Node not found.');
      }
      console.log('Node found.');

      this._commandRunner.setContextNodeId(data.nodeId);

      return tabDebugger.sendCommand('DOM.highlightNode', {
        highlightConfig: {
          contentColor: {
            r: 255,
            g: 0,
            b: 0,
            a: 0.7
          }
        },
        nodeId: data.nodeId
      });
    }).catch(() => {
      chrome.tts.speak('Node not found.');
      throw new Error('Node not found.');
    });
  }
}

export default NodeInspectionCommand;