import Command from '../command.js';

const HIGHLIGHT_COLOR = {
  r: 155,
  g: 11,
  b: 239,
  a: 0.7
};
const HIGHLIGHT_TIMEOUT = 2000;

class NodeInspectionCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /(select|inspect) (\w+)/i;
  }

  execute(text, tabDebugger, commandContext) {
    let matches = text.match(this._regex);

    if (matches) {
      return this.selectNode(matches[2] + ', #' + matches[2] + ', .' + matches[2], tabDebugger, commandContext);
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  selectNode(selector, tabDebugger, commandContext) {
    console.log('NodeInspectionCommand', selector);

    let rootNodeId = commandContext.getRootNodeId();

    return tabDebugger.sendCommand('DOM.querySelector', {
      nodeId: rootNodeId,
      selector
    }).then((data) => {
      //when no results API returns nodeId === 0
      if(!data.nodeId) {
        throw new Error('Node not found.');
      }

      commandContext.setContextNodeId(data.nodeId);
      commandContext.setContextCSSPropertyName(null);

      return tabDebugger.sendCommand('DOM.highlightNode', {
        highlightConfig: {
          contentColor: HIGHLIGHT_COLOR,
          showInfo: true
        },
        nodeId: data.nodeId
      }).then(() => {
        //stop highlighting after couple of seconds
        setTimeout(() => {
          tabDebugger.sendCommand('DOM.hideHighlight');
        }, HIGHLIGHT_TIMEOUT);
      });
    }).catch(() => {
      throw new Error('Node not found.');
    });
  }
}

NodeInspectionCommand.description = `Select DOM nodes with "select x" or "inspect x" (where "x" is the name of the tag, id or CSS class). If multiple nodes match, only the first one will be selected.`;

export default NodeInspectionCommand;