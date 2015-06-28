var $__scripts_47_command_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/command.js";
  var Command = function() {
    function Command() {
      this._regex = /^$/i;
    }
    return ($traceurRuntime.createClass)(Command, {
      match: function(text) {
        return text.search(this._regex);
      },
      execute: function(text, tabDebugger, commandContext) {}
    }, {});
  }();
  var $__default = Command;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_helpers_47_css_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/helpers/css.js";
  function toCSSProperty(text) {
    return text.toLowerCase().replace(' ', '-');
  }
  var cssUnits = {
    pixel: 'px',
    pixels: 'px',
    em: 'em',
    ems: 'em',
    percent: '%'
  };
  function toCSSValue(value, unit) {
    if (unit) {
      return value + cssUnits[unit];
    }
    return value;
  }
  function fromCSSValueToText(cssValue) {
    var matches = cssValue.match(/([0-9.]+)px/i);
    if (matches) {
      var numValue = matches[1];
      return (numValue === 1) ? 'one pixel' : numValue + ' pixels';
    }
    return cssValue;
  }
  var $__default = {};
  return {
    get toCSSProperty() {
      return toCSSProperty;
    },
    get toCSSValue() {
      return toCSSValue;
    },
    get fromCSSValueToText() {
      return fromCSSValueToText;
    },
    get default() {
      return $__default;
    }
  };
})();
var $__scripts_47_commands_47_css_45_change_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/css-change.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var $__1 = $__scripts_47_helpers_47_css_46_js__,
      toCSSProperty = $__1.toCSSProperty,
      toCSSValue = $__1.toCSSValue;
  var CSSChangeCommand = function($__super) {
    function CSSChangeCommand(commandRunner) {
      $traceurRuntime.superConstructor(CSSChangeCommand).call(this, commandRunner);
      this._regex = /(change|set) (its )?(\w+( \w+)?) to (\w+) ?(pixel|pixels|percent|em|ems)?/i;
    }
    return ($traceurRuntime.createClass)(CSSChangeCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          var property = toCSSProperty(matches[3]);
          var value = toCSSValue(matches[5], matches[6]);
          if (matches[3] === 'it') {
            property = commandContext.getContextCSSPropertyName();
          }
          commandContext.setContextCSSPropertyName(property);
          var css = ';' + property + ': ' + value + ';';
          return this.appendToStyles(commandContext.getContextNodeId(), css, tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      appendToStyles: function(nodeId, text, tabDebugger) {
        console.log('CSSChangeCommand', nodeId, text);
        if (!nodeId) {
          throw new Error('Invalid context.');
        }
        return tabDebugger.sendCommand('DOM.getAttributes', {nodeId: nodeId}).then(function(data) {
          var oldStyleValue = '';
          if (data.attributes && data.attributes.indexOf('style') !== -1) {
            var idxOfStyle = data.attributes.indexOf('style');
            oldStyleValue = data.attributes[idxOfStyle + 1];
          }
          return tabDebugger.sendCommand('DOM.setAttributeValue', {
            nodeId: nodeId,
            name: 'style',
            value: oldStyleValue + text
          });
        }).catch(function() {
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  CSSChangeCommand.description = "Change CSS property value of currently inspected node by saying \"change its x to y\" or \"set its x to y\" (where \"x\" is the name of the CSS property and \"y\" is the new value).";
  var $__default = CSSChangeCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_css_45_get_45_value_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/css-get-value.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var $__1 = $__scripts_47_helpers_47_css_46_js__,
      toCSSProperty = $__1.toCSSProperty,
      fromCSSValueToText = $__1.fromCSSValueToText;
  var CSSGetValueCommand = function($__super) {
    function CSSGetValueCommand(commandRunner) {
      $traceurRuntime.superConstructor(CSSGetValueCommand).call(this, commandRunner);
      this._regex = /(what's|what is|get)( its)? (\w+( \w+)?)/i;
    }
    return ($traceurRuntime.createClass)(CSSGetValueCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          var property = toCSSProperty(matches[3]);
          commandContext.setContextCSSPropertyName(property);
          return this.getComputedValue(property, commandContext.getContextNodeId(), tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      getComputedValue: function(property, nodeId, tabDebugger) {
        console.log('CSSGetValueCommand', property, nodeId);
        if (!nodeId) {
          throw new Error('Invalid context.');
        }
        return tabDebugger.sendCommand('CSS.getComputedStyleForNode', {nodeId: nodeId}).then(function(data) {
          var item = data.computedStyle.find(function(item) {
            return item.name === property;
          });
          if (item) {
            return property + ' value is ' + fromCSSValueToText(item.value);
          } else {
            return 'Property ' + property + ' not found.';
          }
        }).catch(function() {
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  CSSGetValueCommand.description = "Get computed CSS property value of currently inspected node by saying \"get its x\" or \"what's its x\" (where \"x\" is the name of the CSS property).";
  var $__default = CSSGetValueCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_node_45_deletion_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/node-deletion.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var NodeDeletionCommand = function($__super) {
    function NodeDeletionCommand(commandRunner) {
      $traceurRuntime.superConstructor(NodeDeletionCommand).call(this, commandRunner);
      this._regex = /(delete|remove) it/i;
    }
    return ($traceurRuntime.createClass)(NodeDeletionCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.removeNode(commandContext.getContextNodeId(), tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      removeNode: function(nodeId, tabDebugger) {
        console.log('NodeDeletionCommand', nodeId);
        if (!nodeId) {
          throw new Error('Invalid context.');
        }
        return tabDebugger.sendCommand('DOM.removeNode', {nodeId: nodeId}).catch(function() {
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  NodeDeletionCommand.description = "Remove currently inspected node with \"remove it\" or \"delete it\".";
  var $__default = NodeDeletionCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_node_45_inspection_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/node-inspection.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var HIGHLIGHT_COLOR = {
    r: 155,
    g: 11,
    b: 239,
    a: 0.7
  };
  var HIGHLIGHT_TIMEOUT = 2000;
  var NodeInspectionCommand = function($__super) {
    function NodeInspectionCommand(commandRunner) {
      $traceurRuntime.superConstructor(NodeInspectionCommand).call(this, commandRunner);
      this._regex = /(select|inspect) (\w+)/i;
    }
    return ($traceurRuntime.createClass)(NodeInspectionCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.selectNode(matches[2] + ', #' + matches[2] + ', .' + matches[2], tabDebugger, commandContext);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      selectNode: function(selector, tabDebugger, commandContext) {
        console.log('NodeInspectionCommand', selector);
        var rootNodeId = commandContext.getRootNodeId();
        return tabDebugger.sendCommand('DOM.querySelector', {
          nodeId: rootNodeId,
          selector: selector
        }).then(function(data) {
          if (!data.nodeId) {
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
          }).then(function() {
            setTimeout(function() {
              tabDebugger.sendCommand('DOM.hideHighlight');
            }, HIGHLIGHT_TIMEOUT);
          });
        }).catch(function() {
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  NodeInspectionCommand.description = "Select DOM nodes with \"select x\" or \"inspect x\" (where \"x\" is the name of the tag, id or CSS class). If multiple nodes match, only the first one will be selected.";
  var $__default = NodeInspectionCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_redo_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/redo.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var RedoCommand = function($__super) {
    function RedoCommand(commandRunner) {
      $traceurRuntime.superConstructor(RedoCommand).call(this, commandRunner);
      this._regex = /redo/i;
    }
    return ($traceurRuntime.createClass)(RedoCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.redoLastAction(tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      redoLastAction: function(tabDebugger) {
        console.log('RedoCommand');
        return tabDebugger.sendCommand('DOM.redo');
      }
    }, {}, $__super);
  }(Command);
  RedoCommand.description = "Redo last command with \"redo\".";
  var $__default = RedoCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_commands_47_undo_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/commands/undo.js";
  var Command = ($__scripts_47_command_46_js__).default;
  var UndoCommand = function($__super) {
    function UndoCommand(commandRunner) {
      $traceurRuntime.superConstructor(UndoCommand).call(this, commandRunner);
      this._regex = /undo/i;
    }
    return ($traceurRuntime.createClass)(UndoCommand, {
      execute: function(text, tabDebugger, commandContext) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.undoLastAction(tabDebugger);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      undoLastAction: function(tabDebugger) {
        console.log('UndoCommand');
        return tabDebugger.sendCommand('DOM.undo');
      }
    }, {}, $__super);
  }(Command);
  UndoCommand.description = "Undo last command with \"undo\".";
  var $__default = UndoCommand;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_options_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/options.js";
  var NodeInspectionCommand = ($__scripts_47_commands_47_node_45_inspection_46_js__).default;
  var NodeDeletionCommand = ($__scripts_47_commands_47_node_45_deletion_46_js__).default;
  var CSSChangeCommand = ($__scripts_47_commands_47_css_45_change_46_js__).default;
  var CSSGetValueCommand = ($__scripts_47_commands_47_css_45_get_45_value_46_js__).default;
  var UndoCommand = ($__scripts_47_commands_47_undo_46_js__).default;
  var RedoCommand = ($__scripts_47_commands_47_redo_46_js__).default;
  function initSpeechRecognition() {
    var recognition = new webkitSpeechRecognition();
    var errorNode = document.querySelector('.error');
    var loadingScreen = document.querySelector('.loading');
    var askScreen = document.querySelector('.ask');
    var successScreen = document.querySelector('.success');
    recognition.onstart = function() {
      loadingScreen.hidden = true;
      askScreen.hidden = true;
      successScreen.hidden = false;
      recognition.stop();
    };
    recognition.onerror = function(event) {
      errorNode.innerText = "Ups! Something went wrong, we got this error back: " + event.error;
    };
    recognition.start();
    setTimeout(function() {
      if (!loadingScreen.hidden) {
        loadingScreen.hidden = true;
        askScreen.hidden = false;
      }
    }, 300);
  }
  function initListOfVoices() {
    var voiceSelect = document.querySelector('#voice');
    voiceSelect.addEventListener('change', function() {
      var voiceName = voiceSelect.value;
      if (voiceName !== '') {
        localStorage.setItem('voiceName', voiceName);
        chrome.tts.speak(voiceName + ' voice selected.', {voiceName: voiceName});
      } else {
        localStorage.removeItem('voiceName');
        chrome.tts.speak('Default voice selected.');
      }
    });
    chrome.tts.getVoices(function(list) {
      list.filter(function(voice) {
        return (voice.lang.substr(0, 3) === 'en-');
      }).forEach(function(voice) {
        var option = document.createElement('option');
        option.innerText = voice.voiceName;
        if (voice.voiceName === localStorage.voiceName) {
          option.selected = true;
        }
        voiceSelect.appendChild(option);
      });
    });
  }
  function initListOfCommands() {
    var commandsList = document.querySelector('#commands');
    [NodeInspectionCommand, NodeDeletionCommand, CSSChangeCommand, CSSGetValueCommand, UndoCommand, RedoCommand].forEach(function(command) {
      var li = document.createElement('li');
      li.innerText = command.description;
      commandsList.appendChild(li);
    });
  }
  initSpeechRecognition();
  initListOfVoices();
  initListOfCommands();
  return {};
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC5qcyIsInNjcmlwdHMvaGVscGVycy9jc3MuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyIsInNjcmlwdHMvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvY29tbWFuZHMvdW5kby5qcyIsInNjcmlwdHMvb3B0aW9ucy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLEFBQUksSUFBQSxDQUFBLFlBQVcsdUJBQW9CLENBQUM7SUNBOUIsUUFBTSxFQUFaLENBQUEsU0FBUyxBQUFEO0FBQVIsV0FBTSxRQUFNLENBQ0UsQUFBRCxDQUFHO0FBQ1osU0FBRyxPQUFPLEVBQUksTUFBSSxDQUFDO0lBQ3JCO0FBU0YsQUFWVSxTQUFPLENBQUEsQ0FBQyxlQUFjLFlBQVksQ0FBQyxBQUFDO0FBRzVDLFVBQUksQ0FBSixVQUFNLElBQUcsQ0FBRztBQUNWLGFBQU8sQ0FBQSxJQUFHLE9BQU8sQUFBQyxDQUFDLElBQUcsT0FBTyxDQUFDLENBQUM7TUFDakM7QUFFQSxZQUFNLENBQU4sVUFBUSxJQUFHLENBQUcsQ0FBQSxXQUFVLENBQUcsQ0FBQSxjQUFhLENBQUcsR0FFM0M7QUFBQSxTQVI4RCxDQUFDO0VBQ3pELEFBQUMsRUFBQztBQUpWLEFBQUksSUFBQSxDQUFBLFVBQVMsRUFjRSxRQUFNLEFBZFksQ0FBQTtBQUFqQyxTQUFBLGFBQXdCO0FBQUUsdUJBQXdCO0lBQUUsRUFBN0I7Ozs7QUFBdkIsQUFBSSxJQUFBLENBQUEsWUFBVywyQkFBb0IsQ0FBQztBQ0E3QixTQUFTLGNBQVksQ0FBRSxJQUFHLENBQUc7QUFDbEMsU0FBTyxDQUFBLElBQUcsWUFBWSxBQUFDLEVBQUMsUUFBUSxBQUFDLENBQUMsR0FBRSxDQUFHLElBQUUsQ0FBQyxDQUFDO0VBQzdDO0FBQUEsQUFFSSxJQUFBLENBQUEsUUFBTyxFQUFJO0FBQ2IsUUFBSSxDQUFHLEtBQUc7QUFDVixTQUFLLENBQUcsS0FBRztBQUNYLEtBQUMsQ0FBRyxLQUFHO0FBQ1AsTUFBRSxDQUFHLEtBQUc7QUFDUixVQUFNLENBQUcsSUFBRTtBQUFBLEVBQ2IsQ0FBQztBQUVNLFNBQVMsV0FBUyxDQUFFLEtBQUksQ0FBRyxDQUFBLElBQUcsQ0FBRztBQUN0QyxPQUFJLElBQUcsQ0FBRztBQUNSLFdBQU8sQ0FBQSxLQUFJLEVBQUksQ0FBQSxRQUFPLENBQUUsSUFBRyxDQUFDLENBQUM7SUFDL0I7QUFBQSxBQUVBLFNBQU8sTUFBSSxDQUFDO0VBQ2Q7QUFBQSxBQUVPLFNBQVMsbUJBQWlCLENBQUUsUUFBTyxDQUFHO0FBQzNDLEFBQUksTUFBQSxDQUFBLE9BQU0sRUFBSSxDQUFBLFFBQU8sTUFBTSxBQUFDLENBQUMsY0FBYSxDQUFDLENBQUM7QUFFNUMsT0FBSSxPQUFNLENBQUc7QUFDWCxBQUFJLFFBQUEsQ0FBQSxRQUFPLEVBQUksQ0FBQSxPQUFNLENBQUUsQ0FBQSxDQUFDLENBQUM7QUFFekIsV0FBTyxDQUFBLENBQUMsUUFBTyxJQUFNLEVBQUEsQ0FBQyxFQUFJLFlBQVUsRUFBSSxDQUFBLFFBQU8sRUFBSSxVQUFRLENBQUM7SUFDOUQ7QUFBQSxBQUVBLFNBQU8sU0FBTyxDQUFDO0VBQ2pCO0FBQUEsQUE5QkksSUFBQSxDQUFBLFVBQVMsRUFnQ0UsR0FBQyxBQWhDaUIsQ0FBQTtBQUFqQztBQUFBLHNCQUF3QjtBQUFFLDBCQUF3QjtJQUFFO0FBQXBELG1CQUF3QjtBQUFFLHVCQUF3QjtJQUFFO0FBQXBELDJCQUF3QjtBQUFFLCtCQUF3QjtJQUFFO0FBQXBELGdCQUF3QjtBQUFFLHVCQUF3QjtJQUFFO0FBQUEsR0FBN0I7Ozs7QUFBdkIsQUFBSSxJQUFBLENBQUEsWUFBVyxtQ0FBb0IsQ0FBQztJQ0E3QixRQUFNOztBQUNMLGtCQUFZO0FBQUcsZUFBUztJQUUxQixpQkFBZSxFQUhyQixDQUFBLFNBQVMsUUFBTztBQUdoQixXQUFNLGlCQUFlLENBQ1AsYUFBWSxDQUFHO0FBQ3pCLEFBTEosb0JBQWMsaUJBQWlCLEFBQUMsa0JBQWtCLEtBQUssTUFLN0MsY0FBWSxDQUxvRCxDQUtsRDtBQUNwQixTQUFHLE9BQU8sRUFBSSw2RUFBMkUsQ0FBQztJQUM1RjtBQWtERixBQXZEVSxTQUFPLENBQUEsQ0FBQyxlQUFjLFlBQVksQ0FBQyxBQUFDO0FBTzVDLFlBQU0sQ0FBTixVQUFRLElBQUcsQ0FBRyxDQUFBLFdBQVUsQ0FBRyxDQUFBLGNBQWE7QUFDdEMsQUFBSSxVQUFBLENBQUEsT0FBTSxFQUFJLENBQUEsSUFBRyxNQUFNLEFBQUMsQ0FBQyxJQUFHLE9BQU8sQ0FBQyxDQUFDO0FBRXJDLFdBQUcsT0FBTSxDQUFHO0FBQ1YsQUFBSSxZQUFBLENBQUEsUUFBTyxFQUFJLENBQUEsYUFBWSxBQUFDLENBQUMsT0FBTSxDQUFFLENBQUEsQ0FBQyxDQUFDLENBQUM7QUFDeEMsQUFBSSxZQUFBLENBQUEsS0FBSSxFQUFJLENBQUEsVUFBUyxBQUFDLENBQUMsT0FBTSxDQUFFLENBQUEsQ0FBQyxDQUFHLENBQUEsT0FBTSxDQUFFLENBQUEsQ0FBQyxDQUFDLENBQUM7QUFFOUMsYUFBRyxPQUFNLENBQUUsQ0FBQSxDQUFDLElBQU0sS0FBRyxDQUFHO0FBQ3RCLG1CQUFPLEVBQUksQ0FBQSxjQUFhLDBCQUEwQixBQUFDLEVBQUMsQ0FBQztVQUN2RDtBQUFBLEFBRUEsdUJBQWEsMEJBQTBCLEFBQUMsQ0FBQyxRQUFPLENBQUMsQ0FBQztBQUVsRCxBQUFJLFlBQUEsQ0FBQSxHQUFFLEVBQUksQ0FBQSxHQUFFLEVBQUksU0FBTyxDQUFBLENBQUksS0FBRyxDQUFBLENBQUksTUFBSSxDQUFBLENBQUksSUFBRSxDQUFDO0FBQzdDLGVBQU8sQ0FBQSxJQUFHLGVBQWUsQUFBQyxDQUFDLGNBQWEsaUJBQWlCLEFBQUMsRUFBQyxDQUFHLElBQUUsQ0FBRyxZQUFVLENBQUMsQ0FBQztRQUNqRjtBQUFBLEFBRUEsYUFBTyxJQUFJLFFBQU0sQUFBQyxDQUFDLFNBQUMsT0FBTSxDQUFHLENBQUEsTUFBSyxDQUFNO0FBQ3RDLGVBQUssQUFBQyxDQUFDLGtDQUFpQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDO01BQ0o7QUFFQSxtQkFBYSxDQUFiLFVBQWUsTUFBSyxDQUFHLENBQUEsSUFBRyxDQUFHLENBQUEsV0FBVTtBQUNyQyxjQUFNLElBQUksQUFBQyxDQUFDLGtCQUFpQixDQUFHLE9BQUssQ0FBRyxLQUFHLENBQUMsQ0FBQztBQUU3QyxXQUFHLENBQUMsTUFBSyxDQUFHO0FBQ1YsY0FBTSxJQUFJLE1BQUksQUFBQyxDQUFDLGtCQUFpQixDQUFDLENBQUM7UUFDckM7QUFBQSxBQUVBLGFBQU8sQ0FBQSxXQUFVLFlBQVksQUFBQyxDQUFDLG1CQUFrQixDQUFHLEVBQ2xELE1BQUssQ0FBTCxPQUFLLENBQ1AsQ0FBQyxLQUFLLEFBQUMsQ0FBQyxTQUFDLElBQUcsQ0FBTTtBQUNoQixBQUFJLFlBQUEsQ0FBQSxhQUFZLEVBQUksR0FBQyxDQUFDO0FBRXRCLGFBQUcsSUFBRyxXQUFXLEdBQUssQ0FBQSxJQUFHLFdBQVcsUUFBUSxBQUFDLENBQUMsT0FBTSxDQUFDLENBQUEsR0FBTSxFQUFDLENBQUEsQ0FBRztBQUM3RCxBQUFJLGNBQUEsQ0FBQSxVQUFTLEVBQUksQ0FBQSxJQUFHLFdBQVcsUUFBUSxBQUFDLENBQUMsT0FBTSxDQUFDLENBQUM7QUFDakQsd0JBQVksRUFBSSxDQUFBLElBQUcsV0FBVyxDQUFFLFVBQVMsRUFBSSxFQUFBLENBQUMsQ0FBQztVQUNqRDtBQUFBLEFBRUEsZUFBTyxDQUFBLFdBQVUsWUFBWSxBQUFDLENBQUMsdUJBQXNCLENBQUc7QUFDdEQsaUJBQUssQ0FBTCxPQUFLO0FBQ0wsZUFBRyxDQUFHLFFBQU07QUFDWixnQkFBSSxDQUFHLENBQUEsYUFBWSxFQUFJLEtBQUc7QUFBQSxVQUM1QixDQUFDLENBQUM7UUFDSixDQUFDLE1BQU0sQUFBQyxDQUFDLFNBQUMsQUFBRCxDQUFNO0FBQ2IsY0FBTSxJQUFJLE1BQUksQUFBQyxDQUFDLGlCQUFnQixDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFDO01BQ0o7U0FyRGdFLFNBQU8sQ0FBQyxDQUFDO0VBQ25FLEFBQUMsQ0FEc0IsT0FBTSxDQUNWO0FBdUQzQixpQkFBZSxZQUFZLEVBQUksd0xBQThLLENBQUM7QUEzRDlNLEFBQUksSUFBQSxDQUFBLFVBQVMsRUE2REUsaUJBQWUsQUE3REcsQ0FBQTtBQUFqQyxTQUFBLGFBQXdCO0FBQUUsdUJBQXdCO0lBQUUsRUFBN0I7Ozs7QUFBdkIsQUFBSSxJQUFBLENBQUEsWUFBVyxzQ0FBb0IsQ0FBQztJQ0E3QixRQUFNOztBQUNMLGtCQUFZO0FBQUcsdUJBQWlCO0lBRWxDLG1CQUFpQixFQUh2QixDQUFBLFNBQVMsUUFBTztBQUdoQixXQUFNLG1CQUFpQixDQUNULGFBQVksQ0FBRztBQUN6QixBQUxKLG9CQUFjLGlCQUFpQixBQUFDLG9CQUFrQixLQUFLLE1BSzdDLGNBQVksQ0FMb0QsQ0FLbEQ7QUFDcEIsU0FBRyxPQUFPLEVBQUksNENBQTBDLENBQUM7SUFDM0Q7QUF3Q0YsQUE3Q1UsU0FBTyxDQUFBLENBQUMsZUFBYyxZQUFZLENBQUMsQUFBQztBQU81QyxZQUFNLENBQU4sVUFBUSxJQUFHLENBQUcsQ0FBQSxXQUFVLENBQUcsQ0FBQSxjQUFhO0FBQ3RDLEFBQUksVUFBQSxDQUFBLE9BQU0sRUFBSSxDQUFBLElBQUcsTUFBTSxBQUFDLENBQUMsSUFBRyxPQUFPLENBQUMsQ0FBQztBQUVyQyxXQUFHLE9BQU0sQ0FBRztBQUNWLEFBQUksWUFBQSxDQUFBLFFBQU8sRUFBSSxDQUFBLGFBQVksQUFBQyxDQUFDLE9BQU0sQ0FBRSxDQUFBLENBQUMsQ0FBQyxDQUFDO0FBRXhDLHVCQUFhLDBCQUEwQixBQUFDLENBQUMsUUFBTyxDQUFDLENBQUM7QUFDbEQsZUFBTyxDQUFBLElBQUcsaUJBQWlCLEFBQUMsQ0FBQyxRQUFPLENBQUcsQ0FBQSxjQUFhLGlCQUFpQixBQUFDLEVBQUMsQ0FBRyxZQUFVLENBQUMsQ0FBQztRQUN4RjtBQUFBLEFBRUEsYUFBTyxJQUFJLFFBQU0sQUFBQyxDQUFDLFNBQUMsT0FBTSxDQUFHLENBQUEsTUFBSyxDQUFNO0FBQ3RDLGVBQUssQUFBQyxDQUFDLGtDQUFpQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDO01BQ0o7QUFFQSxxQkFBZSxDQUFmLFVBQWlCLFFBQU8sQ0FBRyxDQUFBLE1BQUssQ0FBRyxDQUFBLFdBQVU7QUFDM0MsY0FBTSxJQUFJLEFBQUMsQ0FBQyxvQkFBbUIsQ0FBRyxTQUFPLENBQUcsT0FBSyxDQUFDLENBQUM7QUFFbkQsV0FBRyxDQUFDLE1BQUssQ0FBRztBQUNWLGNBQU0sSUFBSSxNQUFJLEFBQUMsQ0FBQyxrQkFBaUIsQ0FBQyxDQUFDO1FBQ3JDO0FBQUEsQUFFQSxhQUFPLENBQUEsV0FBVSxZQUFZLEFBQUMsQ0FBQyw2QkFBNEIsQ0FBRyxFQUM1RCxNQUFLLENBQUwsT0FBSyxDQUNQLENBQUMsS0FBSyxBQUFDLENBQUMsU0FBQyxJQUFHO0FBQ1YsQUFBSSxZQUFBLENBQUEsSUFBRyxFQUFJLENBQUEsSUFBRyxjQUFjLEtBQUssQUFBQyxDQUFDLFNBQUMsSUFBRyxDQUFNO0FBQzNDLGlCQUFPLENBQUEsSUFBRyxLQUFLLElBQU0sU0FBTyxDQUFDO1VBQy9CLENBQUMsQ0FBQztBQUVGLGFBQUcsSUFBRyxDQUFHO0FBQ1AsaUJBQU8sQ0FBQSxRQUFPLEVBQUksYUFBVyxDQUFBLENBQUksQ0FBQSxrQkFBaUIsQUFBQyxDQUFDLElBQUcsTUFBTSxDQUFDLENBQUM7VUFDakUsS0FBTztBQUNMLGlCQUFPLENBQUEsV0FBVSxFQUFJLFNBQU8sQ0FBQSxDQUFJLGNBQVksQ0FBQztVQUMvQztBQUFBLFFBQ0YsQ0FBQyxNQUFNLEFBQUMsQ0FBQyxTQUFDLEFBQUQsQ0FBTTtBQUNiLGNBQU0sSUFBSSxNQUFJLEFBQUMsQ0FBQyxpQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQztNQUNKO1NBM0NnRSxTQUFPLENBQUMsQ0FBQztFQUNuRSxBQUFDLENBRHdCLE9BQU0sQ0FDWjtBQTZDM0IsbUJBQWlCLFlBQVksRUFBSSx5SkFBaUosQ0FBQztBQWpEbkwsQUFBSSxJQUFBLENBQUEsVUFBUyxFQW1ERSxtQkFBaUIsQUFuREMsQ0FBQTtBQUFqQyxTQUFBLGFBQXdCO0FBQUUsdUJBQXdCO0lBQUUsRUFBN0I7Ozs7QUFBdkIsQUFBSSxJQUFBLENBQUEsWUFBVyxzQ0FBb0IsQ0FBQztJQ0E3QixRQUFNO0lBRVAsb0JBQWtCLEVBRnhCLENBQUEsU0FBUyxRQUFPO0FBRWhCLFdBQU0sb0JBQWtCLENBQ1YsYUFBWSxDQUFHO0FBQ3pCLEFBSkosb0JBQWMsaUJBQWlCLEFBQUMscUJBQWtCLEtBQUssTUFJN0MsY0FBWSxDQUpvRCxDQUlsRDtBQUNwQixTQUFHLE9BQU8sRUFBSSxzQkFBb0IsQ0FBQztJQUNyQztBQTJCRixBQS9CVSxTQUFPLENBQUEsQ0FBQyxlQUFjLFlBQVksQ0FBQyxBQUFDO0FBTTVDLFlBQU0sQ0FBTixVQUFRLElBQUcsQ0FBRyxDQUFBLFdBQVUsQ0FBRyxDQUFBLGNBQWE7QUFDdEMsQUFBSSxVQUFBLENBQUEsT0FBTSxFQUFJLENBQUEsSUFBRyxNQUFNLEFBQUMsQ0FBQyxJQUFHLE9BQU8sQ0FBQyxDQUFDO0FBRXJDLFdBQUcsT0FBTSxDQUFHO0FBQ1YsZUFBTyxDQUFBLElBQUcsV0FBVyxBQUFDLENBQUMsY0FBYSxpQkFBaUIsQUFBQyxFQUFDLENBQUcsWUFBVSxDQUFDLENBQUM7UUFDeEU7QUFBQSxBQUVBLGFBQU8sSUFBSSxRQUFNLEFBQUMsQ0FBQyxTQUFDLE9BQU0sQ0FBRyxDQUFBLE1BQUssQ0FBTTtBQUN0QyxlQUFLLEFBQUMsQ0FBQyxrQ0FBaUMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQztNQUNKO0FBRUEsZUFBUyxDQUFULFVBQVcsTUFBSyxDQUFHLENBQUEsV0FBVTtBQUMzQixjQUFNLElBQUksQUFBQyxDQUFDLHFCQUFvQixDQUFHLE9BQUssQ0FBQyxDQUFDO0FBRTFDLFdBQUcsQ0FBQyxNQUFLLENBQUc7QUFDVixjQUFNLElBQUksTUFBSSxBQUFDLENBQUMsa0JBQWlCLENBQUMsQ0FBQztRQUNyQztBQUFBLEFBRUEsYUFBTyxDQUFBLFdBQVUsWUFBWSxBQUFDLENBQUMsZ0JBQWUsQ0FBRyxFQUMvQyxNQUFLLENBQUwsT0FBSyxDQUNQLENBQUMsTUFBTSxBQUFDLENBQUMsU0FBQyxBQUFELENBQU07QUFDYixjQUFNLElBQUksTUFBSSxBQUFDLENBQUMsaUJBQWdCLENBQUMsQ0FBQztRQUNwQyxDQUFDLENBQUM7TUFDSjtTQTdCZ0UsU0FBTyxDQUFDLENBQUM7RUFDbkUsQUFBQyxDQUZ5QixPQUFNLENBRWI7QUErQjNCLG9CQUFrQixZQUFZLEVBQUksdUVBQWlFLENBQUM7QUFuQ3BHLEFBQUksSUFBQSxDQUFBLFVBQVMsRUFxQ0Usb0JBQWtCLEFBckNBLENBQUE7QUFBakMsU0FBQSxhQUF3QjtBQUFFLHVCQUF3QjtJQUFFLEVBQTdCOzs7O0FBQXZCLEFBQUksSUFBQSxDQUFBLFlBQVcsd0NBQW9CLENBQUM7SUNBN0IsUUFBTTtBQUViLEFBQU0sSUFBQSxDQUFBLGVBQWMsRUFBSTtBQUN0QixJQUFBLENBQUcsSUFBRTtBQUNMLElBQUEsQ0FBRyxHQUFDO0FBQ0osSUFBQSxDQUFHLElBQUU7QUFDTCxJQUFBLENBQUcsSUFBRTtBQUFBLEVBQ1AsQ0FBQztBQUNELEFBQU0sSUFBQSxDQUFBLGlCQUFnQixFQUFJLEtBQUcsQ0FBQztJQUV4QixzQkFBb0IsRUFWMUIsQ0FBQSxTQUFTLFFBQU87QUFVaEIsV0FBTSxzQkFBb0IsQ0FDWixhQUFZLENBQUc7QUFDekIsQUFaSixvQkFBYyxpQkFBaUIsQUFBQyx1QkFBa0IsS0FBSyxNQVk3QyxjQUFZLENBWm9ELENBWWxEO0FBQ3BCLFNBQUcsT0FBTyxFQUFJLDBCQUF3QixDQUFDO0lBQ3pDO0FBOENGLEFBMURVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFjNUMsWUFBTSxDQUFOLFVBQVEsSUFBRyxDQUFHLENBQUEsV0FBVSxDQUFHLENBQUEsY0FBYTtBQUN0QyxBQUFJLFVBQUEsQ0FBQSxPQUFNLEVBQUksQ0FBQSxJQUFHLE1BQU0sQUFBQyxDQUFDLElBQUcsT0FBTyxDQUFDLENBQUM7QUFFckMsV0FBSSxPQUFNLENBQUc7QUFDWCxlQUFPLENBQUEsSUFBRyxXQUFXLEFBQUMsQ0FBQyxPQUFNLENBQUUsQ0FBQSxDQUFDLEVBQUksTUFBSSxDQUFBLENBQUksQ0FBQSxPQUFNLENBQUUsQ0FBQSxDQUFDLENBQUEsQ0FBSSxNQUFJLENBQUEsQ0FBSSxDQUFBLE9BQU0sQ0FBRSxDQUFBLENBQUMsQ0FBRyxZQUFVLENBQUcsZUFBYSxDQUFDLENBQUM7UUFDM0c7QUFBQSxBQUVBLGFBQU8sSUFBSSxRQUFNLEFBQUMsQ0FBQyxTQUFDLE9BQU0sQ0FBRyxDQUFBLE1BQUssQ0FBTTtBQUN0QyxlQUFLLEFBQUMsQ0FBQyxrQ0FBaUMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsQ0FBQztNQUNKO0FBRUEsZUFBUyxDQUFULFVBQVcsUUFBTyxDQUFHLENBQUEsV0FBVSxDQUFHLENBQUEsY0FBYTtBQUM3QyxjQUFNLElBQUksQUFBQyxDQUFDLHVCQUFzQixDQUFHLFNBQU8sQ0FBQyxDQUFDO0FBRTlDLEFBQUksVUFBQSxDQUFBLFVBQVMsRUFBSSxDQUFBLGNBQWEsY0FBYyxBQUFDLEVBQUMsQ0FBQztBQUUvQyxhQUFPLENBQUEsV0FBVSxZQUFZLEFBQUMsQ0FBQyxtQkFBa0IsQ0FBRztBQUNsRCxlQUFLLENBQUcsV0FBUztBQUNqQixpQkFBTyxDQUFQLFNBQU87QUFBQSxRQUNULENBQUMsS0FBSyxBQUFDLENBQUMsU0FBQyxJQUFHO0FBQ1YsYUFBRyxDQUFDLElBQUcsT0FBTyxDQUFHO0FBQ2YsZ0JBQU0sSUFBSSxNQUFJLEFBQUMsQ0FBQyxpQkFBZ0IsQ0FBQyxDQUFDO1VBQ3BDO0FBQUEsQUFFQSx1QkFBYSxpQkFBaUIsQUFBQyxDQUFDLElBQUcsT0FBTyxDQUFDLENBQUM7QUFDNUMsdUJBQWEsMEJBQTBCLEFBQUMsQ0FBQyxJQUFHLENBQUMsQ0FBQztBQUU5QyxlQUFPLENBQUEsV0FBVSxZQUFZLEFBQUMsQ0FBQyxtQkFBa0IsQ0FBRztBQUNsRCwwQkFBYyxDQUFHO0FBQ2YseUJBQVcsQ0FBRyxnQkFBYztBQUM1QixxQkFBTyxDQUFHLEtBQUc7QUFBQSxZQUNmO0FBQ0EsaUJBQUssQ0FBRyxDQUFBLElBQUcsT0FBTztBQUFBLFVBQ3BCLENBQUMsS0FBSyxBQUFDLENBQUMsU0FBQyxBQUFEO0FBRU4scUJBQVMsQUFBQyxDQUFDLFNBQUMsQUFBRCxDQUFNO0FBQ2Ysd0JBQVUsWUFBWSxBQUFDLENBQUMsbUJBQWtCLENBQUMsQ0FBQztZQUM5QyxDQUFHLGtCQUFnQixDQUFDLENBQUM7VUFDdkIsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxNQUFNLEFBQUMsQ0FBQyxTQUFDLEFBQUQsQ0FBTTtBQUNiLGNBQU0sSUFBSSxNQUFJLEFBQUMsQ0FBQyxpQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BDLENBQUMsQ0FBQztNQUNKO1NBeERnRSxTQUFPLENBQUMsQ0FBQztFQUNuRSxBQUFDLENBTTJCLE9BQU0sQ0FOZjtBQTBEM0Isc0JBQW9CLFlBQVksRUFBSSwyS0FBbUssQ0FBQztBQTlEeE0sQUFBSSxJQUFBLENBQUEsVUFBUyxFQWdFRSxzQkFBb0IsQUFoRUYsQ0FBQTtBQUFqQyxTQUFBLGFBQXdCO0FBQUUsdUJBQXdCO0lBQUUsRUFBN0I7Ozs7QUFBdkIsQUFBSSxJQUFBLENBQUEsWUFBVyw2QkFBb0IsQ0FBQztJQ0E3QixRQUFNO0lBRVAsWUFBVSxFQUZoQixDQUFBLFNBQVMsUUFBTztBQUVoQixXQUFNLFlBQVUsQ0FDRixhQUFZLENBQUc7QUFDekIsQUFKSixvQkFBYyxpQkFBaUIsQUFBQyxhQUFrQixLQUFLLE1BSTdDLGNBQVksQ0FKb0QsQ0FJbEQ7QUFDcEIsU0FBRyxPQUFPLEVBQUksUUFBTSxDQUFDO0lBQ3ZCO0FBbUJGLEFBdkJVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFNNUMsWUFBTSxDQUFOLFVBQVEsSUFBRyxDQUFHLENBQUEsV0FBVSxDQUFHLENBQUEsY0FBYTtBQUN0QyxBQUFJLFVBQUEsQ0FBQSxPQUFNLEVBQUksQ0FBQSxJQUFHLE1BQU0sQUFBQyxDQUFDLElBQUcsT0FBTyxDQUFDLENBQUM7QUFFckMsV0FBRyxPQUFNLENBQUc7QUFDVixlQUFPLENBQUEsSUFBRyxlQUFlLEFBQUMsQ0FBQyxXQUFVLENBQUMsQ0FBQztRQUN6QztBQUFBLEFBRUEsYUFBTyxJQUFJLFFBQU0sQUFBQyxDQUFDLFNBQUMsT0FBTSxDQUFHLENBQUEsTUFBSyxDQUFNO0FBQ3RDLGVBQUssQUFBQyxDQUFDLGtDQUFpQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDO01BQ0o7QUFFQSxtQkFBYSxDQUFiLFVBQWUsV0FBVSxDQUFHO0FBQzFCLGNBQU0sSUFBSSxBQUFDLENBQUMsYUFBWSxDQUFDLENBQUM7QUFFMUIsYUFBTyxDQUFBLFdBQVUsWUFBWSxBQUFDLENBQUMsVUFBUyxDQUFDLENBQUM7TUFDNUM7QUFBQSxTQXJCZ0UsU0FBTyxDQUFDLENBQUM7RUFDbkUsQUFBQyxDQUZpQixPQUFNLENBRUw7QUF1QjNCLFlBQVUsWUFBWSxFQUFJLG1DQUErQixDQUFDO0FBM0IxRCxBQUFJLElBQUEsQ0FBQSxVQUFTLEVBNkJFLFlBQVUsQUE3QlEsQ0FBQTtBQUFqQyxTQUFBLGFBQXdCO0FBQUUsdUJBQXdCO0lBQUUsRUFBN0I7Ozs7QUFBdkIsQUFBSSxJQUFBLENBQUEsWUFBVyw2QkFBb0IsQ0FBQztJQ0E3QixRQUFNO0lBRVAsWUFBVSxFQUZoQixDQUFBLFNBQVMsUUFBTztBQUVoQixXQUFNLFlBQVUsQ0FDRixhQUFZLENBQUc7QUFDekIsQUFKSixvQkFBYyxpQkFBaUIsQUFBQyxhQUFrQixLQUFLLE1BSTdDLGNBQVksQ0FKb0QsQ0FJbEQ7QUFDcEIsU0FBRyxPQUFPLEVBQUksUUFBTSxDQUFDO0lBQ3ZCO0FBbUJGLEFBdkJVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFNNUMsWUFBTSxDQUFOLFVBQVEsSUFBRyxDQUFHLENBQUEsV0FBVSxDQUFHLENBQUEsY0FBYTtBQUN0QyxBQUFJLFVBQUEsQ0FBQSxPQUFNLEVBQUksQ0FBQSxJQUFHLE1BQU0sQUFBQyxDQUFDLElBQUcsT0FBTyxDQUFDLENBQUM7QUFFckMsV0FBRyxPQUFNLENBQUc7QUFDVixlQUFPLENBQUEsSUFBRyxlQUFlLEFBQUMsQ0FBQyxXQUFVLENBQUMsQ0FBQztRQUN6QztBQUFBLEFBRUEsYUFBTyxJQUFJLFFBQU0sQUFBQyxDQUFDLFNBQUMsT0FBTSxDQUFHLENBQUEsTUFBSyxDQUFNO0FBQ3RDLGVBQUssQUFBQyxDQUFDLGtDQUFpQyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxDQUFDO01BQ0o7QUFFQSxtQkFBYSxDQUFiLFVBQWUsV0FBVSxDQUFHO0FBQzFCLGNBQU0sSUFBSSxBQUFDLENBQUMsYUFBWSxDQUFDLENBQUM7QUFFMUIsYUFBTyxDQUFBLFdBQVUsWUFBWSxBQUFDLENBQUMsVUFBUyxDQUFDLENBQUM7TUFDNUM7QUFBQSxTQXJCZ0UsU0FBTyxDQUFDLENBQUM7RUFDbkUsQUFBQyxDQUZpQixPQUFNLENBRUw7QUF1QjNCLFlBQVUsWUFBWSxFQUFJLG1DQUErQixDQUFDO0FBM0IxRCxBQUFJLElBQUEsQ0FBQSxVQUFTLEVBNkJFLFlBQVUsQUE3QlEsQ0FBQTtBQUFqQyxTQUFBLGFBQXdCO0FBQUUsdUJBQXdCO0lBQUUsRUFBN0I7Ozs7QUFBdkIsQUFBSSxJQUFBLENBQUEsWUFBVyx1QkFBb0IsQ0FBQztJQ0E3QixzQkFBb0I7SUFDcEIsb0JBQWtCO0lBQ2xCLGlCQUFlO0lBQ2YsbUJBQWlCO0lBQ2pCLFlBQVU7SUFDVixZQUFVO0FBRWpCLFNBQVMsc0JBQW9CLENBQUUsQUFBRDtBQUM1QixBQUFJLE1BQUEsQ0FBQSxXQUFVLEVBQUksSUFBSSx3QkFBc0IsQUFBQyxFQUFDLENBQUM7QUFDL0MsQUFBSSxNQUFBLENBQUEsU0FBUSxFQUFJLENBQUEsUUFBTyxjQUFjLEFBQUMsQ0FBQyxRQUFPLENBQUMsQ0FBQztBQUNoRCxBQUFJLE1BQUEsQ0FBQSxhQUFZLEVBQUksQ0FBQSxRQUFPLGNBQWMsQUFBQyxDQUFDLFVBQVMsQ0FBQyxDQUFDO0FBQ3RELEFBQUksTUFBQSxDQUFBLFNBQVEsRUFBSSxDQUFBLFFBQU8sY0FBYyxBQUFDLENBQUMsTUFBSyxDQUFDLENBQUM7QUFDOUMsQUFBSSxNQUFBLENBQUEsYUFBWSxFQUFJLENBQUEsUUFBTyxjQUFjLEFBQUMsQ0FBQyxVQUFTLENBQUMsQ0FBQztBQUV0RCxjQUFVLFFBQVEsRUFBSSxVQUFDLEFBQUQsQ0FBTTtBQUMxQixrQkFBWSxPQUFPLEVBQUksS0FBRyxDQUFDO0FBQzNCLGNBQVEsT0FBTyxFQUFJLEtBQUcsQ0FBQztBQUN2QixrQkFBWSxPQUFPLEVBQUksTUFBSSxDQUFDO0FBRTVCLGdCQUFVLEtBQUssQUFBQyxFQUFDLENBQUM7SUFDcEIsQ0FBQztBQUNELGNBQVUsUUFBUSxFQUFJLFVBQUMsS0FBSSxDQUFNO0FBQy9CLGNBQVEsVUFBVSxFQUFJLENBQUEscURBQW9ELEVBQUksQ0FBQSxLQUFJLE1BQU0sQ0FBQztJQUMzRixDQUFDO0FBRUQsY0FBVSxNQUFNLEFBQUMsRUFBQyxDQUFDO0FBRW5CLGFBQVMsQUFBQyxDQUFDLFNBQUMsQUFBRCxDQUFNO0FBQ2YsU0FBRyxDQUFDLGFBQVksT0FBTyxDQUFHO0FBQ3hCLG9CQUFZLE9BQU8sRUFBSSxLQUFHLENBQUM7QUFDM0IsZ0JBQVEsT0FBTyxFQUFJLE1BQUksQ0FBQztNQUMxQjtBQUFBLElBQ0YsQ0FBRyxJQUFFLENBQUMsQ0FBQztFQUNUO0FBRUEsU0FBUyxpQkFBZSxDQUFFLEFBQUQ7QUFDdkIsQUFBSSxNQUFBLENBQUEsV0FBVSxFQUFJLENBQUEsUUFBTyxjQUFjLEFBQUMsQ0FBQyxRQUFPLENBQUMsQ0FBQztBQUVsRCxjQUFVLGlCQUFpQixBQUFDLENBQUMsUUFBTyxDQUFHLFVBQUMsQUFBRCxDQUFNO0FBQzNDLEFBQUksUUFBQSxDQUFBLFNBQVEsRUFBSSxDQUFBLFdBQVUsTUFBTSxDQUFDO0FBRWpDLFNBQUcsU0FBUSxJQUFNLEdBQUMsQ0FBRztBQUNuQixtQkFBVyxRQUFRLEFBQUMsQ0FBQyxXQUFVLENBQUcsVUFBUSxDQUFDLENBQUM7QUFDNUMsYUFBSyxJQUFJLE1BQU0sQUFBQyxDQUFDLFNBQVEsRUFBSSxtQkFBaUIsQ0FBRyxFQUFDLFNBQVEsQ0FBUixVQUFRLENBQUMsQ0FBQyxDQUFBO01BQzlELEtBQU87QUFDTCxtQkFBVyxXQUFXLEFBQUMsQ0FBQyxXQUFVLENBQUMsQ0FBQztBQUNwQyxhQUFLLElBQUksTUFBTSxBQUFDLENBQUMseUJBQXdCLENBQUMsQ0FBQztNQUM3QztBQUFBLElBQ0YsQ0FBQyxDQUFDO0FBRUYsU0FBSyxJQUFJLFVBQVUsQUFBQyxDQUFDLFNBQUMsSUFBRztBQUN2QixTQUFHLE9BQU8sQUFBQyxDQUFDLFNBQUMsS0FBSSxDQUFNO0FBQ3JCLGFBQU8sRUFBQyxLQUFJLEtBQUssT0FBTyxBQUFDLENBQUMsQ0FBQSxDQUFFLEVBQUEsQ0FBQyxDQUFBLEdBQU0sTUFBSSxDQUFDLENBQUM7TUFDM0MsQ0FBQyxRQUFRLEFBQUMsQ0FBQyxTQUFDLEtBQUksQ0FBTTtBQUNwQixBQUFJLFVBQUEsQ0FBQSxNQUFLLEVBQUksQ0FBQSxRQUFPLGNBQWMsQUFBQyxDQUFDLFFBQU8sQ0FBQyxDQUFDO0FBQzdDLGFBQUssVUFBVSxFQUFJLENBQUEsS0FBSSxVQUFVLENBQUM7QUFFbEMsV0FBRyxLQUFJLFVBQVUsSUFBTSxDQUFBLFlBQVcsVUFBVSxDQUFHO0FBQzdDLGVBQUssU0FBUyxFQUFJLEtBQUcsQ0FBQztRQUN4QjtBQUFBLEFBRUEsa0JBQVUsWUFBWSxBQUFDLENBQUMsTUFBSyxDQUFDLENBQUM7TUFDakMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7QUFFQSxTQUFTLG1CQUFpQixDQUFFLEFBQUQ7QUFDekIsQUFBSSxNQUFBLENBQUEsWUFBVyxFQUFJLENBQUEsUUFBTyxjQUFjLEFBQUMsQ0FBQyxXQUFVLENBQUMsQ0FBQztBQUV0RCxJQUNFLHFCQUFvQixDQUNwQixvQkFBa0IsQ0FDbEIsaUJBQWUsQ0FDZixtQkFBaUIsQ0FDakIsWUFBVSxDQUNWLFlBQVUsQ0FDWixRQUFRLEFBQUMsQ0FBQyxTQUFDLE9BQU0sQ0FBTTtBQUNuQixBQUFJLFFBQUEsQ0FBQSxFQUFDLEVBQUksQ0FBQSxRQUFPLGNBQWMsQUFBQyxDQUFDLElBQUcsQ0FBQyxDQUFDO0FBQ3JDLE9BQUMsVUFBVSxFQUFJLENBQUEsT0FBTSxZQUFZLENBQUM7QUFFbEMsaUJBQVcsWUFBWSxBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7SUFDOUIsQ0FBQyxDQUFDO0VBQ047QUFFQSxzQkFBb0IsQUFBQyxFQUFDLENBQUM7QUFDdkIsaUJBQWUsQUFBQyxFQUFDLENBQUM7QUFDbEIsbUJBQWlCLEFBQUMsRUFBQyxDQUFDO0FBdEZwQixXQUF1QiIsImZpbGUiOiIvVXNlcnMva2R6d2luZWwvUHJvamVjdHMvT1MvRGV2VG9vbHNWb2ljZUNvbW1hbmRzL3RlbXBvdXRNQzQ0TVRZd05EVTRNVGd6T0RRM016WTQuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsImNsYXNzIENvbW1hbmQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yZWdleCA9IC9eJC9pO1xuICB9XG5cbiAgbWF0Y2godGV4dCkge1xuICAgIHJldHVybiB0ZXh0LnNlYXJjaCh0aGlzLl9yZWdleCk7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gdG9DU1NQcm9wZXJ0eSh0ZXh0KSB7XG4gIHJldHVybiB0ZXh0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnICcsICctJyk7XG59XG5cbmxldCBjc3NVbml0cyA9IHtcbiAgcGl4ZWw6ICdweCcsXG4gIHBpeGVsczogJ3B4JyxcbiAgZW06ICdlbScsXG4gIGVtczogJ2VtJyxcbiAgcGVyY2VudDogJyUnXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdG9DU1NWYWx1ZSh2YWx1ZSwgdW5pdCkge1xuICBpZiAodW5pdCkge1xuICAgIHJldHVybiB2YWx1ZSArIGNzc1VuaXRzW3VuaXRdO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZnJvbUNTU1ZhbHVlVG9UZXh0KGNzc1ZhbHVlKSB7XG4gIGxldCBtYXRjaGVzID0gY3NzVmFsdWUubWF0Y2goLyhbMC05Ll0rKXB4L2kpO1xuXG4gIGlmIChtYXRjaGVzKSB7XG4gICAgbGV0IG51bVZhbHVlID0gbWF0Y2hlc1sxXTtcblxuICAgIHJldHVybiAobnVtVmFsdWUgPT09IDEpID8gJ29uZSBwaXhlbCcgOiBudW1WYWx1ZSArICcgcGl4ZWxzJztcbiAgfVxuXG4gIHJldHVybiBjc3NWYWx1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge307IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIHRvQ1NTVmFsdWV9IGZyb20gJy4uL2hlbHBlcnMvY3NzLmpzJztcblxuY2xhc3MgQ1NTQ2hhbmdlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKGNoYW5nZXxzZXQpIChpdHMgKT8oXFx3KyggXFx3Kyk/KSB0byAoXFx3KykgPyhwaXhlbHxwaXhlbHN8cGVyY2VudHxlbXxlbXMpPy9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgbGV0IHByb3BlcnR5ID0gdG9DU1NQcm9wZXJ0eShtYXRjaGVzWzNdKTtcbiAgICAgIGxldCB2YWx1ZSA9IHRvQ1NTVmFsdWUobWF0Y2hlc1s1XSwgbWF0Y2hlc1s2XSk7XG5cbiAgICAgIGlmKG1hdGNoZXNbM10gPT09ICdpdCcpIHtcbiAgICAgICAgcHJvcGVydHkgPSBjb21tYW5kQ29udGV4dC5nZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUocHJvcGVydHkpO1xuXG4gICAgICBsZXQgY3NzID0gJzsnICsgcHJvcGVydHkgKyAnOiAnICsgdmFsdWUgKyAnOyc7XG4gICAgICByZXR1cm4gdGhpcy5hcHBlbmRUb1N0eWxlcyhjb21tYW5kQ29udGV4dC5nZXRDb250ZXh0Tm9kZUlkKCksIGNzcywgdGFiRGVidWdnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kVG9TdHlsZXMobm9kZUlkLCB0ZXh0LCB0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdDU1NDaGFuZ2VDb21tYW5kJywgbm9kZUlkLCB0ZXh0KTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb250ZXh0LicpO1xuICAgIH1cblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmdldEF0dHJpYnV0ZXMnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgb2xkU3R5bGVWYWx1ZSA9ICcnO1xuXG4gICAgICBpZihkYXRhLmF0dHJpYnV0ZXMgJiYgZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJykgIT09IC0xKSB7XG4gICAgICAgIGxldCBpZHhPZlN0eWxlID0gZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJyk7XG4gICAgICAgIG9sZFN0eWxlVmFsdWUgPSBkYXRhLmF0dHJpYnV0ZXNbaWR4T2ZTdHlsZSArIDFdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5zZXRBdHRyaWJ1dGVWYWx1ZScsIHtcbiAgICAgICAgbm9kZUlkLFxuICAgICAgICBuYW1lOiAnc3R5bGUnLFxuICAgICAgICB2YWx1ZTogb2xkU3R5bGVWYWx1ZSArIHRleHRcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuQ1NTQ2hhbmdlQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBDaGFuZ2UgQ1NTIHByb3BlcnR5IHZhbHVlIG9mIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSBieSBzYXlpbmcgXCJjaGFuZ2UgaXRzIHggdG8geVwiIG9yIFwic2V0IGl0cyB4IHRvIHlcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIENTUyBwcm9wZXJ0eSBhbmQgXCJ5XCIgaXMgdGhlIG5ldyB2YWx1ZSkuYDtcblxuZXhwb3J0IGRlZmF1bHQgQ1NTQ2hhbmdlQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcbmltcG9ydCB7dG9DU1NQcm9wZXJ0eSwgZnJvbUNTU1ZhbHVlVG9UZXh0fSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0dldFZhbHVlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKHdoYXQnc3x3aGF0IGlzfGdldCkoIGl0cyk/IChcXHcrKCBcXHcrKT8pL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICBsZXQgcHJvcGVydHkgPSB0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pO1xuXG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKHByb3BlcnR5KTtcbiAgICAgIHJldHVybiB0aGlzLmdldENvbXB1dGVkVmFsdWUocHJvcGVydHksIGNvbW1hbmRDb250ZXh0LmdldENvbnRleHROb2RlSWQoKSwgdGFiRGVidWdnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29tcHV0ZWRWYWx1ZShwcm9wZXJ0eSwgbm9kZUlkLCB0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdDU1NHZXRWYWx1ZUNvbW1hbmQnLCBwcm9wZXJ0eSwgbm9kZUlkKTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb250ZXh0LicpO1xuICAgIH1cblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnQ1NTLmdldENvbXB1dGVkU3R5bGVGb3JOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IGl0ZW0gPSBkYXRhLmNvbXB1dGVkU3R5bGUuZmluZCgoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5uYW1lID09PSBwcm9wZXJ0eTtcbiAgICAgIH0pO1xuXG4gICAgICBpZihpdGVtKSB7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eSArICcgdmFsdWUgaXMgJyArIGZyb21DU1NWYWx1ZVRvVGV4dChpdGVtLnZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnUHJvcGVydHkgJyArIHByb3BlcnR5ICsgJyBub3QgZm91bmQuJztcbiAgICAgIH1cbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbkNTU0dldFZhbHVlQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBHZXQgY29tcHV0ZWQgQ1NTIHByb3BlcnR5IHZhbHVlIG9mIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSBieSBzYXlpbmcgXCJnZXQgaXRzIHhcIiBvciBcIndoYXQncyBpdHMgeFwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5KS5gO1xuXG5leHBvcnQgZGVmYXVsdCBDU1NHZXRWYWx1ZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIE5vZGVEZWxldGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhkZWxldGV8cmVtb3ZlKSBpdC9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTm9kZShjb21tYW5kQ29udGV4dC5nZXRDb250ZXh0Tm9kZUlkKCksIHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbW92ZU5vZGUobm9kZUlkLCB0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdOb2RlRGVsZXRpb25Db21tYW5kJywgbm9kZUlkKTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb250ZXh0LicpO1xuICAgIH1cblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnJlbW92ZU5vZGUnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbk5vZGVEZWxldGlvbkNvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVtb3ZlIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSB3aXRoIFwicmVtb3ZlIGl0XCIgb3IgXCJkZWxldGUgaXRcIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlRGVsZXRpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jb25zdCBISUdITElHSFRfQ09MT1IgPSB7XG4gIHI6IDE1NSxcbiAgZzogMTEsXG4gIGI6IDIzOSxcbiAgYTogMC43XG59O1xuY29uc3QgSElHSExJR0hUX1RJTUVPVVQgPSAyMDAwO1xuXG5jbGFzcyBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhzZWxlY3R8aW5zcGVjdCkgKFxcdyspL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZiAobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0Tm9kZShtYXRjaGVzWzJdICsgJywgIycgKyBtYXRjaGVzWzJdICsgJywgLicgKyBtYXRjaGVzWzJdLCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgc2VsZWN0Tm9kZShzZWxlY3RvciwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgY29uc29sZS5sb2coJ05vZGVJbnNwZWN0aW9uQ29tbWFuZCcsIHNlbGVjdG9yKTtcblxuICAgIGxldCByb290Tm9kZUlkID0gY29tbWFuZENvbnRleHQuZ2V0Um9vdE5vZGVJZCgpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucXVlcnlTZWxlY3RvcicsIHtcbiAgICAgIG5vZGVJZDogcm9vdE5vZGVJZCxcbiAgICAgIHNlbGVjdG9yXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgaWYoIWRhdGEubm9kZUlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHROb2RlSWQoZGF0YS5ub2RlSWQpO1xuICAgICAgY29tbWFuZENvbnRleHQuc2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZShudWxsKTtcblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlnaGxpZ2h0Tm9kZScsIHtcbiAgICAgICAgaGlnaGxpZ2h0Q29uZmlnOiB7XG4gICAgICAgICAgY29udGVudENvbG9yOiBISUdITElHSFRfQ09MT1IsXG4gICAgICAgICAgc2hvd0luZm86IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgbm9kZUlkOiBkYXRhLm5vZGVJZFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vc3RvcCBoaWdobGlnaHRpbmcgYWZ0ZXIgY291cGxlIG9mIHNlY29uZHNcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWRlSGlnaGxpZ2h0Jyk7XG4gICAgICAgIH0sIEhJR0hMSUdIVF9USU1FT1VUKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuTm9kZUluc3BlY3Rpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFNlbGVjdCBET00gbm9kZXMgd2l0aCBcInNlbGVjdCB4XCIgb3IgXCJpbnNwZWN0IHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIHRhZywgaWQgb3IgQ1NTIGNsYXNzKS4gSWYgbXVsdGlwbGUgbm9kZXMgbWF0Y2gsIG9ubHkgdGhlIGZpcnN0IG9uZSB3aWxsIGJlIHNlbGVjdGVkLmA7XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgUmVkb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3JlZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ1JlZG9Db21tYW5kJyk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZWRvJyk7XG4gIH1cbn1cblxuUmVkb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVkbyBsYXN0IGNvbW1hbmQgd2l0aCBcInJlZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBSZWRvQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgVW5kb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3VuZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnVuZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVuZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ1VuZG9Db21tYW5kJyk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS51bmRvJyk7XG4gIH1cbn1cblxuVW5kb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgVW5kbyBsYXN0IGNvbW1hbmQgd2l0aCBcInVuZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBVbmRvQ29tbWFuZDsiLCJpbXBvcnQgTm9kZUluc3BlY3Rpb25Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvbm9kZS1pbnNwZWN0aW9uLmpzJztcbmltcG9ydCBOb2RlRGVsZXRpb25Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvbm9kZS1kZWxldGlvbi5qcyc7XG5pbXBvcnQgQ1NTQ2hhbmdlQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMnO1xuaW1wb3J0IENTU0dldFZhbHVlQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMnO1xuaW1wb3J0IFVuZG9Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvdW5kby5qcyc7XG5pbXBvcnQgUmVkb0NvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9yZWRvLmpzJztcblxuZnVuY3Rpb24gaW5pdFNwZWVjaFJlY29nbml0aW9uKCkge1xuICBsZXQgcmVjb2duaXRpb24gPSBuZXcgd2Via2l0U3BlZWNoUmVjb2duaXRpb24oKTtcbiAgbGV0IGVycm9yTm9kZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5lcnJvcicpO1xuICBsZXQgbG9hZGluZ1NjcmVlbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sb2FkaW5nJyk7XG4gIGxldCBhc2tTY3JlZW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYXNrJyk7XG4gIGxldCBzdWNjZXNzU2NyZWVuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnN1Y2Nlc3MnKTtcblxuICByZWNvZ25pdGlvbi5vbnN0YXJ0ID0gKCkgPT4ge1xuICAgIGxvYWRpbmdTY3JlZW4uaGlkZGVuID0gdHJ1ZTtcbiAgICBhc2tTY3JlZW4uaGlkZGVuID0gdHJ1ZTtcbiAgICBzdWNjZXNzU2NyZWVuLmhpZGRlbiA9IGZhbHNlO1xuXG4gICAgcmVjb2duaXRpb24uc3RvcCgpO1xuICB9O1xuICByZWNvZ25pdGlvbi5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgZXJyb3JOb2RlLmlubmVyVGV4dCA9IFwiVXBzISBTb21ldGhpbmcgd2VudCB3cm9uZywgd2UgZ290IHRoaXMgZXJyb3IgYmFjazogXCIgKyBldmVudC5lcnJvcjtcbiAgfTtcblxuICByZWNvZ25pdGlvbi5zdGFydCgpO1xuXG4gIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIGlmKCFsb2FkaW5nU2NyZWVuLmhpZGRlbikge1xuICAgICAgbG9hZGluZ1NjcmVlbi5oaWRkZW4gPSB0cnVlO1xuICAgICAgYXNrU2NyZWVuLmhpZGRlbiA9IGZhbHNlO1xuICAgIH1cbiAgfSwgMzAwKTtcbn1cblxuZnVuY3Rpb24gaW5pdExpc3RPZlZvaWNlcygpIHtcbiAgbGV0IHZvaWNlU2VsZWN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3ZvaWNlJyk7XG5cbiAgdm9pY2VTZWxlY3QuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgKCkgPT4ge1xuICAgIGxldCB2b2ljZU5hbWUgPSB2b2ljZVNlbGVjdC52YWx1ZTtcblxuICAgIGlmKHZvaWNlTmFtZSAhPT0gJycpIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd2b2ljZU5hbWUnLCB2b2ljZU5hbWUpO1xuICAgICAgY2hyb21lLnR0cy5zcGVhayh2b2ljZU5hbWUgKyAnIHZvaWNlIHNlbGVjdGVkLicsIHt2b2ljZU5hbWV9KVxuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndm9pY2VOYW1lJyk7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdEZWZhdWx0IHZvaWNlIHNlbGVjdGVkLicpO1xuICAgIH1cbiAgfSk7XG5cbiAgY2hyb21lLnR0cy5nZXRWb2ljZXMoKGxpc3QpID0+IHtcbiAgICBsaXN0LmZpbHRlcigodm9pY2UpID0+IHtcbiAgICAgIHJldHVybiAodm9pY2UubGFuZy5zdWJzdHIoMCwzKSA9PT0gJ2VuLScpO1xuICAgIH0pLmZvckVhY2goKHZvaWNlKSA9PiB7XG4gICAgICBsZXQgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgICBvcHRpb24uaW5uZXJUZXh0ID0gdm9pY2Uudm9pY2VOYW1lO1xuXG4gICAgICBpZih2b2ljZS52b2ljZU5hbWUgPT09IGxvY2FsU3RvcmFnZS52b2ljZU5hbWUpIHtcbiAgICAgICAgb3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdm9pY2VTZWxlY3QuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXRMaXN0T2ZDb21tYW5kcygpIHtcbiAgbGV0IGNvbW1hbmRzTGlzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjb21tYW5kcycpO1xuXG4gIFtcbiAgICBOb2RlSW5zcGVjdGlvbkNvbW1hbmQsXG4gICAgTm9kZURlbGV0aW9uQ29tbWFuZCxcbiAgICBDU1NDaGFuZ2VDb21tYW5kLFxuICAgIENTU0dldFZhbHVlQ29tbWFuZCxcbiAgICBVbmRvQ29tbWFuZCxcbiAgICBSZWRvQ29tbWFuZFxuICBdLmZvckVhY2goKGNvbW1hbmQpID0+IHtcbiAgICAgIGxldCBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICBsaS5pbm5lclRleHQgPSBjb21tYW5kLmRlc2NyaXB0aW9uO1xuXG4gICAgICBjb21tYW5kc0xpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICAgIH0pO1xufVxuXG5pbml0U3BlZWNoUmVjb2duaXRpb24oKTtcbmluaXRMaXN0T2ZWb2ljZXMoKTtcbmluaXRMaXN0T2ZDb21tYW5kcygpOyJdfQ==
