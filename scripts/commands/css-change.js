import Command from '../command.js';

function toCSSProperty(text) {
  return text.toLowerCase().replace(' ', '-');
}

let cssUnits = {
  pixel: 'px',
  pixels: 'px',
  em: 'em',
  ems: 'em',
  percent: '%'
};

function toCSSValue(value, unit) {
  if(unit) {
    return value + cssUnits[unit];
  }

  return value;
}

class CSSChangeCommand extends Command {
  constructor(commandRunner) {
    super(commandRunner);
    this._regex = /(change|set)( it's)? (\w+( \w+)?) to (\w+) ?(pixel|pixels|percent|em|ems)?/i;
  }

  execute(text) {
    let matches = text.match(this._regex);

    if(matches) {
      let css = ';' + toCSSProperty(matches[3]) + ': ' + toCSSValue(matches[5], matches[6]) + ';';
      return this.appendToStyles(this._commandRunner.getContextNodeId(), css);
    }

    return new Promise((resolve, reject) => {
      reject('Text doesn\'t match the command.');
    });
  }

  appendToStyles(nodeId, text) {
    console.log('change styles', nodeId, text);

    if(!nodeId) {
      throw new Error('Invalid node.');
    }

    let tabDebugger = this._commandRunner.getTabDebugger();

    return tabDebugger.sendCommand('DOM.getAttributes', {
      nodeId
    }).then((data) => {
      let oldStyleValue = '';

      if(data.attributes && data.attributes.indexOf('style') !== -1) {
        let idxOfStyle = data.attributes.indexOf('style');
        oldStyleValue = data.attributes[idxOfStyle + 1];
      }

      console.log('changing styles from', oldStyleValue);

      return tabDebugger.sendCommand('DOM.setAttributeValue', {
        nodeId,
        name: 'style',
        value: oldStyleValue + text
      });
    }).catch(() => {
      chrome.tts.speak('Node not found.');
      throw new Error('Node not found.');
    });
  }
}

export default CSSChangeCommand;