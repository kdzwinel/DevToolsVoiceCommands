var $__scripts_47_command_45_runner_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/command-runner.js";
  var CommandRunner = function() {
    function CommandRunner() {
      this._tabDebugger = null;
      this._rootNodeId = null;
      this._contextNodeId = null;
      this._commands = new Set();
    }
    return ($traceurRuntime.createClass)(CommandRunner, {
      setTabDebugger: function(tabDebugger) {
        var $__0 = this;
        this._tabDebugger = tabDebugger;
        tabDebugger.sendCommand('DOM.enable').then(tabDebugger.sendCommand.bind(tabDebugger, 'CSS.enable')).then(tabDebugger.sendCommand.bind(tabDebugger, 'DOM.getDocument')).then(function(data) {
          if (!data.root) {
            throw new Error('Document root not available.');
          }
          $__0._rootNodeId = data.root.nodeId;
        });
      },
      getTabDebugger: function() {
        return this._tabDebugger;
      },
      getContextNodeId: function() {
        return this._contextNodeId;
      },
      setContextNodeId: function(id) {
        this._contextNodeId = id;
      },
      getRootNodeId: function() {
        return this._rootNodeId;
      },
      registerCommand: function(commandType) {
        this._commands.add(new commandType(this));
      },
      recognize: function(text) {
        var matches = [];
        this._commands.forEach(function(command) {
          var position = command.match(text);
          if (position !== -1) {
            matches.push({
              position: position,
              command: command
            });
          }
        });
        return matches.sort(function(a, b) {
          return a.position - b.position;
        }).reduce(function(promise, $__2) {
          var command = $__2.command;
          if (!promise) {
            return command.execute(text);
          }
          return promise.then(command.execute.bind(command, text));
        }, null);
      }
    }, {});
  }();
  var $__default = CommandRunner;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_command_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/command.js";
  var Command = function() {
    function Command(commandRunner) {
      this._regex = /^$/i;
      this._commandRunner = commandRunner;
    }
    return ($traceurRuntime.createClass)(Command, {
      match: function(text) {
        return text.search(this._regex);
      },
      execute: function(text, $__1) {
        var $__2 = $__1,
            tabDebugger = $__2.tabDebugger,
            rootNodeId = $__2.rootNodeId,
            contextNodeId = $__2.contextNodeId;
      }
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
      this._regex = /(change|set)( its)? (\w+( \w+)?) to (\w+) ?(pixel|pixels|percent|em|ems)?/i;
    }
    return ($traceurRuntime.createClass)(CSSChangeCommand, {
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          var css = ';' + toCSSProperty(matches[3]) + ': ' + toCSSValue(matches[5], matches[6]) + ';';
          return this.appendToStyles(this._commandRunner.getContextNodeId(), css);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      appendToStyles: function(nodeId, text) {
        console.log('change styles', nodeId, text);
        if (!nodeId) {
          throw new Error('Invalid node.');
        }
        var tabDebugger = this._commandRunner.getTabDebugger();
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
          chrome.tts.speak('Node not found.');
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
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.getComputedValue(toCSSProperty(matches[3]), this._commandRunner.getContextNodeId());
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      getComputedValue: function(property, nodeId) {
        console.log('getComputedValue', property, nodeId);
        if (!nodeId) {
          throw new Error('Invalid node.');
        }
        var tabDebugger = this._commandRunner.getTabDebugger();
        return tabDebugger.sendCommand('CSS.getComputedStyleForNode', {nodeId: nodeId}).then(function(data) {
          var item = data.computedStyle.find(function(item) {
            return item.name === property;
          });
          if (item) {
            console.log('Property found! Value: ' + fromCSSValueToText(item.value));
            chrome.tts.speak(fromCSSValueToText(item.value));
          } else {
            console.log('Property ' + property + ' not found.');
          }
        }).catch(function() {
          chrome.tts.speak('Node not found.');
          throw new Error('Node not found.');
        });
      }
    }, {}, $__super);
  }(Command);
  CSSGetValueCommand.description = "Get CSS property value of currently inspected node by saying \"get its x\" or \"what's its x\" (where \"x\" is the name of the CSS property).";
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
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.removeNode(this._commandRunner.getContextNodeId());
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      removeNode: function(nodeId) {
        console.log('removeNode', nodeId);
        if (!nodeId) {
          throw new Error('Invalid node.');
        }
        var tabDebugger = this._commandRunner.getTabDebugger();
        return tabDebugger.sendCommand('DOM.removeNode', {nodeId: nodeId}).catch(function() {
          chrome.tts.speak('Node not found.');
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
  var NodeInspectionCommand = function($__super) {
    function NodeInspectionCommand(commandRunner) {
      $traceurRuntime.superConstructor(NodeInspectionCommand).call(this, commandRunner);
      this._regex = /(select|inspect) (\w+)/i;
    }
    return ($traceurRuntime.createClass)(NodeInspectionCommand, {
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.selectNode(matches[2] + ', #' + matches[2] + ', .' + matches[2]);
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      selectNode: function(selector) {
        var $__1 = this;
        console.log('selectNode', selector);
        var tabDebugger = this._commandRunner.getTabDebugger();
        var rootNodeId = this._commandRunner.getRootNodeId();
        return tabDebugger.sendCommand('DOM.querySelector', {
          nodeId: rootNodeId,
          selector: selector
        }).then(function(data) {
          if (!data.nodeId) {
            chrome.tts.speak('Node not found.');
            throw new Error('Node not found.');
          }
          $__1._commandRunner.setContextNodeId(data.nodeId);
          return tabDebugger.sendCommand('DOM.highlightNode', {
            highlightConfig: {
              contentColor: {
                r: 155,
                g: 11,
                b: 239,
                a: 0.7
              },
              showInfo: true
            },
            nodeId: data.nodeId
          }).then(function() {
            setTimeout(function() {
              tabDebugger.sendCommand('DOM.hideHighlight');
            }, 2000);
          });
        }).catch(function() {
          chrome.tts.speak('Node not found.');
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
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.redoLastAction();
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      redoLastAction: function() {
        console.log('redo');
        var tabDebugger = this._commandRunner.getTabDebugger();
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
      execute: function(text) {
        var matches = text.match(this._regex);
        if (matches) {
          return this.undoLastAction();
        }
        return new Promise(function(resolve, reject) {
          reject('Text doesn\'t match the command.');
        });
      },
      undoLastAction: function() {
        console.log('undo');
        var tabDebugger = this._commandRunner.getTabDebugger();
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
var $__scripts_47_helpers_47_tabs_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/helpers/tabs.js";
  function getActiveTab() {
    return new Promise(function(resolve, reject) {
      chrome.tabs.query({active: true}, function(tabs) {
        if (tabs.length === 0) {
          reject();
          return;
        }
        resolve(tabs[0]);
      });
    });
  }
  var $__default = {};
  return {
    get getActiveTab() {
      return getActiveTab;
    },
    get default() {
      return $__default;
    }
  };
})();
var $__scripts_47_recording_45_icon_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/recording-icon.js";
  var IDLE = 1;
  var RECORDING = 2;
  var RecordingIcon = function() {
    function RecordingIcon() {}
    return ($traceurRuntime.createClass)(RecordingIcon, {
      construct: function() {
        this._status = IDLE;
      },
      show: function() {
        this._status = RECORDING;
        chrome.browserAction.setBadgeText({text: '·'});
      },
      hide: function() {
        this._status = IDLE;
        chrome.browserAction.setBadgeText({text: ''});
      }
    }, {});
  }();
  var $__default = RecordingIcon;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_listener_45_manager_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/listener-manager.js";
  var ListenerManager = function() {
    function ListenerManager() {
      this.listeners = new Set();
    }
    return ($traceurRuntime.createClass)(ListenerManager, {
      addListener: function(listener) {
        if (typeof listener !== 'function') {
          throw new Error('Listener must be a function.');
        }
        this.listeners.add(listener);
      },
      removeListener: function(listener) {
        if (typeof listener !== 'function') {
          throw new Error('Listener must be a function.');
        }
        this.listeners.delete(listener);
      },
      notifyListeners: function(data) {
        this.listeners.forEach(function(listener) {
          listener(data);
        });
      }
    }, {});
  }();
  var $__default = ListenerManager;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_speech_45_recognition_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/speech-recognition.js";
  var ListenerManager = ($__scripts_47_listener_45_manager_46_js__).default;
  var ACTIVE = 1;
  var INACTIVE = 2;
  var SpeechRecognition = function() {
    function SpeechRecognition() {
      this._recognition = null;
      this._status = INACTIVE;
      this.onResult = new ListenerManager();
      this.onEnd = new ListenerManager();
    }
    return ($traceurRuntime.createClass)(SpeechRecognition, {
      start: function() {
        var $__1 = this;
        var recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.onend = function() {
          $__1._status = INACTIVE;
          $__1.onEnd.notifyListeners();
        };
        recognition.onresult = function(event) {
          var interim_transcript = '',
              final_transcript = '';
          for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final_transcript += event.results[i][0].transcript;
            } else {
              interim_transcript += event.results[i][0].transcript;
            }
          }
          console.log('SpeechRecognition', final_transcript);
          $__1.onResult.notifyListeners(final_transcript);
        };
        recognition.start();
        this._recognition = recognition;
        return new Promise(function(resolve, reject) {
          recognition.onstart = function() {
            $__1._status = ACTIVE;
            resolve();
          };
          recognition.onerror = function(event) {
            $__1._status = INACTIVE;
            $__1.onEnd.notifyListeners(event.error);
            reject(event.error);
          };
        });
      },
      isActive: function() {
        return this._status === ACTIVE;
      },
      stop: function() {
        if (this._recognition) {
          this._recognition.stop();
        }
      }
    }, {});
  }();
  var $__default = SpeechRecognition;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_tab_45_debugger_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/tab-debugger.js";
  function _attach(tabId) {
    var protocolVersion = '1.1';
    return new Promise(function(resolve, reject) {
      chrome.debugger.attach({tabId: tabId}, protocolVersion, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
        resolve();
      });
    });
  }
  function _detach(tabId) {
    return new Promise(function(resolve, reject) {
      chrome.debugger.detach({tabId: tabId}, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
        resolve();
      });
    });
  }
  function _sendCommand(tabId, command) {
    var data = arguments[2] !== (void 0) ? arguments[2] : {};
    return new Promise(function(resolve, reject) {
      chrome.debugger.sendCommand({tabId: tabId}, command, data, function(response) {
        if (response.error) {
          reject(response.error);
          return;
        }
        resolve(response);
      });
    });
  }
  var TabDebugger = function() {
    function TabDebugger(tabId) {
      var $__0 = this;
      this._tabId = tabId;
      this._attached = true;
      chrome.debugger.onDetach.addListener(function(source, reason) {
        if (source.tabId === $__0._tabId) {
          $__0._attached = false;
        }
      });
    }
    return ($traceurRuntime.createClass)(TabDebugger, {
      connect: function() {
        var $__0 = this;
        return _attach(this._tabId).then(function() {
          $__0._attached = true;
        });
      },
      disconnect: function() {
        return _detach(this._tabId);
      },
      isConnected: function() {
        return this._attached;
      },
      sendCommand: function(command, data) {
        var $__0 = this;
        if (!this._attached) {
          return this.connect().then(function() {
            return _sendCommand($__0._tabId, command, data);
          });
        }
        return _sendCommand(this._tabId, command, data);
      }
    }, {});
  }();
  var $__default = TabDebugger;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_background_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/background.js";
  var SpeechRecognition = ($__scripts_47_speech_45_recognition_46_js__).default;
  var CommandRunner = ($__scripts_47_command_45_runner_46_js__).default;
  var TabDebugger = ($__scripts_47_tab_45_debugger_46_js__).default;
  var getActiveTab = ($__scripts_47_helpers_47_tabs_46_js__).getActiveTab;
  var RecordingIcon = ($__scripts_47_recording_45_icon_46_js__).default;
  var NodeInspectionCommand = ($__scripts_47_commands_47_node_45_inspection_46_js__).default;
  var NodeDeletionCommand = ($__scripts_47_commands_47_node_45_deletion_46_js__).default;
  var CSSChangeCommand = ($__scripts_47_commands_47_css_45_change_46_js__).default;
  var CSSGetValueCommand = ($__scripts_47_commands_47_css_45_get_45_value_46_js__).default;
  var UndoCommand = ($__scripts_47_commands_47_undo_46_js__).default;
  var RedoCommand = ($__scripts_47_commands_47_redo_46_js__).default;
  var recordingIcon = new RecordingIcon();
  var commandRunner = new CommandRunner();
  commandRunner.registerCommand(NodeInspectionCommand);
  commandRunner.registerCommand(NodeDeletionCommand);
  commandRunner.registerCommand(CSSChangeCommand);
  commandRunner.registerCommand(CSSGetValueCommand);
  commandRunner.registerCommand(UndoCommand);
  commandRunner.registerCommand(RedoCommand);
  var speechRecognition = new SpeechRecognition();
  var tabDebugger = null;
  speechRecognition.onResult.addListener(function(transcript) {
    commandRunner.recognize(transcript);
  });
  speechRecognition.onEnd.addListener(function() {
    if (tabDebugger && tabDebugger.isConnected()) {
      tabDebugger.disconnect();
    }
    recordingIcon.hide();
  });
  chrome.browserAction.onClicked.addListener(function() {
    if (speechRecognition.isActive()) {
      speechRecognition.stop();
      return;
    }
    speechRecognition.start().then(getActiveTab).then(function(tab) {
      tabDebugger = new TabDebugger(tab.id);
      return tabDebugger.connect();
    }).then(function() {
      recordingIcon.show();
      commandRunner.setTabDebugger(tabDebugger);
    }).catch(function(error) {
      if (error == 'not-allowed') {
        chrome.runtime.openOptionsPage();
      }
      if (speechRecognition.isActive()) {
        speechRecognition.stop();
      }
      console.log(error);
    });
  });
  return {};
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC1ydW5uZXIuanMiLCJzY3JpcHRzL2NvbW1hbmQuanMiLCJzY3JpcHRzL2hlbHBlcnMvY3NzLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtY2hhbmdlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWluc3BlY3Rpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3JlZG8uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3VuZG8uanMiLCJzY3JpcHRzL2hlbHBlcnMvdGFicy5qcyIsInNjcmlwdHMvcmVjb3JkaW5nLWljb24uanMiLCJzY3JpcHRzL2xpc3RlbmVyLW1hbmFnZXIuanMiLCJzY3JpcHRzL3NwZWVjaC1yZWNvZ25pdGlvbi5qcyIsInNjcmlwdHMvdGFiLWRlYnVnZ2VyLmpzIiwic2NyaXB0cy9iYWNrZ3JvdW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsQUFBSSxJQUFBLENBQUEsWUFBVyw4QkFBb0IsQ0FBQztJQ0E5QixjQUFZLEVBQWxCLENBQUEsU0FBUyxBQUFEO0FBQVIsV0FBTSxjQUFZLENBQ0osQUFBRCxDQUFHO0FBQ1osU0FBRyxhQUFhLEVBQUksS0FBRyxDQUFDO0FBQ3hCLFNBQUcsWUFBWSxFQUFJLEtBQUcsQ0FBQztBQUN2QixTQUFHLGVBQWUsRUFBSSxLQUFHLENBQUM7QUFDMUIsU0FBRyxVQUFVLEVBQUksSUFBSSxJQUFFLEFBQUMsRUFBQyxDQUFDO0lBQzVCO0FBa0VGLEFBdEVVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFNNUMsbUJBQWEsQ0FBYixVQUFlLFdBQVU7O0FBQ3ZCLFdBQUcsYUFBYSxFQUFJLFlBQVUsQ0FBQztBQUUvQixrQkFBVSxZQUFZLEFBQUMsQ0FBQyxZQUFXLENBQUMsS0FDOUIsQUFBQyxDQUFDLFdBQVUsWUFB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LEFBQUMsQ0FBQyxTQUFDLEFBQUQsQ0FBTTtBQUNWLGtCQUFZLEtBQUssQUFBQyxFQUFDLENBQUM7QUFDcEIsa0JBQVksZUFBZSxBQUFDLENBQUMsV0FBVSxDQUFDLENBQUM7SUFDM0MsQ0FBQyxNQUFNLEFBQUMsQ0FBQyxTQUFDLEtBQUksQ0FBTTtBQUNsQixTQUFJLEtBQUksR0FBSyxjQUFZLENBQUc7QUFDMUIsYUFBSyxRQUFRLGdCQUFnQixBQUFDLEVBQUMsQ0FBQztNQUNsQztBQUFBLEFBRUEsU0FBRyxpQkFBZ0IsU0FBUyxBQUFDLEVBQUMsQ0FBRztBQUMvQix3QkFBZ0IsS0FBSyxBQUFDLEVBQUMsQ0FBQztNQUMxQjtBQUFBLEFBRUEsWUFBTSxJQUFJLEFBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDLENBQUM7RUFDTixDQUFDLENBQUM7QUFoRUYsV0FBdUIiLCJmaWxlIjoiL1VzZXJzL2tkendpbmVsL1Byb2plY3RzL09TL0RldlRvb2xzVm9pY2VDb21tYW5kcy90ZW1wb3V0TUM0eU16Y3hNemM1TURVM09EYzJOelkxTndyZWRyZWQuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsImNsYXNzIENvbW1hbmRSdW5uZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl90YWJEZWJ1Z2dlciA9IG51bGw7XG4gICAgdGhpcy5fcm9vdE5vZGVJZCA9IG51bGw7XG4gICAgdGhpcy5fY29udGV4dE5vZGVJZCA9IG51bGw7XG4gICAgdGhpcy5fY29tbWFuZHMgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBzZXRUYWJEZWJ1Z2dlcih0YWJEZWJ1Z2dlcikge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gdGFiRGVidWdnZXI7XG5cbiAgICB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmVuYWJsZScpXG4gICAgICAudGhlbih0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZC5iaW5kKHRhYkRlYnVnZ2VyLCAnQ1NTLmVuYWJsZScpKVxuICAgICAgLnRoZW4odGFiRGVidWdnZXIuc2VuZENvbW1hbmQuYmluZCh0YWJEZWJ1Z2dlciwgJ0RPTS5nZXREb2N1bWVudCcpKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgaWYoIWRhdGEucm9vdCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRG9jdW1lbnQgcm9vdCBub3QgYXZhaWxhYmxlLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcm9vdE5vZGVJZCA9IGRhdGEucm9vdC5ub2RlSWQ7XG4gICAgICB9KTtcbiAgfVxuXG4gIGdldFRhYkRlYnVnZ2VyKCkge1xuICAgIHJldHVybiB0aGlzLl90YWJEZWJ1Z2dlcjtcbiAgfVxuXG4gIGdldENvbnRleHROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Tm9kZUlkKGlkKSB7XG4gICAgdGhpcy5fY29udGV4dE5vZGVJZCA9IGlkO1xuICB9XG5cbiAgZ2V0Um9vdE5vZGVJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcm9vdE5vZGVJZDtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29tbWFuZChjb21tYW5kVHlwZSkge1xuICAgIHRoaXMuX2NvbW1hbmRzLmFkZChuZXcgY29tbWFuZFR5cGUodGhpcykpO1xuICB9XG5cbiAgcmVjb2duaXplKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IFtdO1xuXG4gICAgLy9maWd1cmUgb3V0IHRoZSBvcmRlciBpbiB3aGljaCBjb21tYW5kcyBzaG91bGQgYmUgY2FsbGVkIChtdXN0IGJlIHRoZSBzYW1lIGFzIGluIHRoZSB0ZXh0KVxuICAgIHRoaXMuX2NvbW1hbmRzLmZvckVhY2goKGNvbW1hbmQpID0+IHtcbiAgICAgIGxldCBwb3NpdGlvbiA9IGNvbW1hbmQubWF0Y2godGV4dCk7XG5cbiAgICAgIGlmKHBvc2l0aW9uICE9PSAtMSkge1xuICAgICAgICBtYXRjaGVzLnB1c2goe1xuICAgICAgICAgIHBvc2l0aW9uLFxuICAgICAgICAgIGNvbW1hbmRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWF0Y2hlc1xuICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgcmV0dXJuIGEucG9zaXRpb24gLSBiLnBvc2l0aW9uO1xuICAgICAgfSlcbiAgICAgIC8vY2FsbCBuZXh0IGNvbW1hbmQgb25seSBhZnRlciBwcmV2aW91cyBvbmUgaGFzIGZpbmlzaGVkXG4gICAgICAucmVkdWNlKChwcm9taXNlLCB7Y29tbWFuZH0pID0+IHtcbiAgICAgICAgaWYoIXByb21pc2UpIHtcbiAgICAgICAgICByZXR1cm4gY29tbWFuZC5leGVjdXRlKHRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihjb21tYW5kLmV4ZWN1dGUuYmluZChjb21tYW5kLCB0ZXh0KSk7XG4gICAgICB9LCBudWxsKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmRSdW5uZXI7IiwiY2xhc3MgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICB0aGlzLl9yZWdleCA9IC9eJC9pO1xuICAgIHRoaXMuX2NvbW1hbmRSdW5uZXIgPSBjb21tYW5kUnVubmVyO1xuICB9XG5cbiAgbWF0Y2godGV4dCkge1xuICAgIHJldHVybiB0ZXh0LnNlYXJjaCh0aGlzLl9yZWdleCk7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHt0YWJEZWJ1Z2dlciwgcm9vdE5vZGVJZCwgY29udGV4dE5vZGVJZH0pIHtcblxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmQ7IiwiZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTUHJvcGVydHkodGV4dCkge1xuICByZXR1cm4gdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJyAnLCAnLScpO1xufVxuXG5sZXQgY3NzVW5pdHMgPSB7XG4gIHBpeGVsOiAncHgnLFxuICBwaXhlbHM6ICdweCcsXG4gIGVtOiAnZW0nLFxuICBlbXM6ICdlbScsXG4gIHBlcmNlbnQ6ICclJ1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTVmFsdWUodmFsdWUsIHVuaXQpIHtcbiAgaWYgKHVuaXQpIHtcbiAgICByZXR1cm4gdmFsdWUgKyBjc3NVbml0c1t1bml0XTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21DU1NWYWx1ZVRvVGV4dChjc3NWYWx1ZSkge1xuICBsZXQgbWF0Y2hlcyA9IGNzc1ZhbHVlLm1hdGNoKC8oWzAtOS5dKylweC9pKTtcblxuICBpZiAobWF0Y2hlcykge1xuICAgIGxldCBudW1WYWx1ZSA9IG1hdGNoZXNbMV07XG5cbiAgICByZXR1cm4gKG51bVZhbHVlID09PSAxKSA/ICdvbmUgcGl4ZWwnIDogbnVtVmFsdWUgKyAnIHBpeGVscyc7XG4gIH1cblxuICByZXR1cm4gY3NzVmFsdWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCB0b0NTU1ZhbHVlfSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0NoYW5nZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhjaGFuZ2V8c2V0KSggaXRzKT8gKFxcdysoIFxcdyspPykgdG8gKFxcdyspID8ocGl4ZWx8cGl4ZWxzfHBlcmNlbnR8ZW18ZW1zKT8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICBsZXQgY3NzID0gJzsnICsgdG9DU1NQcm9wZXJ0eShtYXRjaGVzWzNdKSArICc6ICcgKyB0b0NTU1ZhbHVlKG1hdGNoZXNbNV0sIG1hdGNoZXNbNl0pICsgJzsnO1xuICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kVG9TdHlsZXModGhpcy5fY29tbWFuZFJ1bm5lci5nZXRDb250ZXh0Tm9kZUlkKCksIGNzcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRUb1N0eWxlcyhub2RlSWQsIHRleHQpIHtcbiAgICBjb25zb2xlLmxvZygnY2hhbmdlIHN0eWxlcycsIG5vZGVJZCwgdGV4dCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5nZXRBdHRyaWJ1dGVzJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IG9sZFN0eWxlVmFsdWUgPSAnJztcblxuICAgICAgaWYoZGF0YS5hdHRyaWJ1dGVzICYmIGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpICE9PSAtMSkge1xuICAgICAgICBsZXQgaWR4T2ZTdHlsZSA9IGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpO1xuICAgICAgICBvbGRTdHlsZVZhbHVlID0gZGF0YS5hdHRyaWJ1dGVzW2lkeE9mU3R5bGUgKyAxXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uc2V0QXR0cmlidXRlVmFsdWUnLCB7XG4gICAgICAgIG5vZGVJZCxcbiAgICAgICAgbmFtZTogJ3N0eWxlJyxcbiAgICAgICAgdmFsdWU6IG9sZFN0eWxlVmFsdWUgKyB0ZXh0XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuQ1NTQ2hhbmdlQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBDaGFuZ2UgQ1NTIHByb3BlcnR5IHZhbHVlIG9mIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSBieSBzYXlpbmcgXCJjaGFuZ2UgaXRzIHggdG8geVwiIG9yIFwic2V0IGl0cyB4IHRvIHlcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIENTUyBwcm9wZXJ0eSBhbmQgXCJ5XCIgaXMgdGhlIG5ldyB2YWx1ZSkuYDtcblxuZXhwb3J0IGRlZmF1bHQgQ1NTQ2hhbmdlQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcbmltcG9ydCB7dG9DU1NQcm9wZXJ0eSwgZnJvbUNTU1ZhbHVlVG9UZXh0fSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0dldFZhbHVlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKHdoYXQnc3x3aGF0IGlzfGdldCkoIGl0cyk/IChcXHcrKCBcXHcrKT8pL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcHV0ZWRWYWx1ZSh0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pLCB0aGlzLl9jb21tYW5kUnVubmVyLmdldENvbnRleHROb2RlSWQoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb21wdXRlZFZhbHVlKHByb3BlcnR5LCBub2RlSWQpIHtcbiAgICBjb25zb2xlLmxvZygnZ2V0Q29tcHV0ZWRWYWx1ZScsIHByb3BlcnR5LCBub2RlSWQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vZGUuJyk7XG4gICAgfVxuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdDU1MuZ2V0Q29tcHV0ZWRTdHlsZUZvck5vZGUnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgaXRlbSA9IGRhdGEuY29tcHV0ZWRTdHlsZS5maW5kKChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLm5hbWUgPT09IHByb3BlcnR5O1xuICAgICAgfSk7XG5cbiAgICAgIGlmKGl0ZW0pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Byb3BlcnR5IGZvdW5kISBWYWx1ZTogJyArIGZyb21DU1NWYWx1ZVRvVGV4dChpdGVtLnZhbHVlKSk7XG4gICAgICAgIGNocm9tZS50dHMuc3BlYWsoZnJvbUNTU1ZhbHVlVG9UZXh0KGl0ZW0udmFsdWUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQcm9wZXJ0eSAnICsgcHJvcGVydHkgKyAnIG5vdCBmb3VuZC4nKTtcbiAgICAgIH1cbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuQ1NTR2V0VmFsdWVDb21tYW5kLmRlc2NyaXB0aW9uID0gYEdldCBDU1MgcHJvcGVydHkgdmFsdWUgb2YgY3VycmVudGx5IGluc3BlY3RlZCBub2RlIGJ5IHNheWluZyBcImdldCBpdHMgeFwiIG9yIFwid2hhdCdzIGl0cyB4XCIgKHdoZXJlIFwieFwiIGlzIHRoZSBuYW1lIG9mIHRoZSBDU1MgcHJvcGVydHkpLmA7XG5cbmV4cG9ydCBkZWZhdWx0IENTU0dldFZhbHVlQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgTm9kZURlbGV0aW9uQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKGRlbGV0ZXxyZW1vdmUpIGl0L2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTm9kZSh0aGlzLl9jb21tYW5kUnVubmVyLmdldENvbnRleHROb2RlSWQoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZW1vdmVOb2RlKG5vZGVJZCkge1xuICAgIGNvbnNvbGUubG9nKCdyZW1vdmVOb2RlJywgbm9kZUlkKTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub2RlLicpO1xuICAgIH1cblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnJlbW92ZU5vZGUnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuTm9kZURlbGV0aW9uQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBSZW1vdmUgY3VycmVudGx5IGluc3BlY3RlZCBub2RlIHdpdGggXCJyZW1vdmUgaXRcIiBvciBcImRlbGV0ZSBpdFwiLmA7XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVEZWxldGlvbkNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIE5vZGVJbnNwZWN0aW9uQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKHNlbGVjdHxpbnNwZWN0KSAoXFx3KykvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZWxlY3ROb2RlKG1hdGNoZXNbMl0gKyAnLCAjJyArIG1hdGNoZXNbMl0gKyAnLCAuJyArIG1hdGNoZXNbMl0pO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgc2VsZWN0Tm9kZShzZWxlY3Rvcikge1xuICAgIGNvbnNvbGUubG9nKCdzZWxlY3ROb2RlJywgc2VsZWN0b3IpO1xuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuICAgIGxldCByb290Tm9kZUlkID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRSb290Tm9kZUlkKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5xdWVyeVNlbGVjdG9yJywge1xuICAgICAgbm9kZUlkOiByb290Tm9kZUlkLFxuICAgICAgc2VsZWN0b3JcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBpZighZGF0YS5ub2RlSWQpIHtcbiAgICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2NvbW1hbmRSdW5uZXIuc2V0Q29udGV4dE5vZGVJZChkYXRhLm5vZGVJZCk7XG5cbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmhpZ2hsaWdodE5vZGUnLCB7XG4gICAgICAgIGhpZ2hsaWdodENvbmZpZzoge1xuICAgICAgICAgIGNvbnRlbnRDb2xvcjoge1xuICAgICAgICAgICAgcjogMTU1LFxuICAgICAgICAgICAgZzogMTEsXG4gICAgICAgICAgICBiOiAyMzksXG4gICAgICAgICAgICBhOiAwLjdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNob3dJbmZvOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIG5vZGVJZDogZGF0YS5ub2RlSWRcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAvL3N0b3AgaGlnaGxpZ2h0aW5nIGFmdGVyIGNvdXBsZSBvZiBzZWNvbmRzXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlkZUhpZ2hsaWdodCcpO1xuICAgICAgICB9LCAyMDAwKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5Ob2RlSW5zcGVjdGlvbkNvbW1hbmQuZGVzY3JpcHRpb24gPSBgU2VsZWN0IERPTSBub2RlcyB3aXRoIFwic2VsZWN0IHhcIiBvciBcImluc3BlY3QgeFwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgdGFnLCBpZCBvciBDU1MgY2xhc3MpLiBJZiBtdWx0aXBsZSBub2RlcyBtYXRjaCwgb25seSB0aGUgZmlyc3Qgb25lIHdpbGwgYmUgc2VsZWN0ZWQuYDtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZUluc3BlY3Rpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBSZWRvQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvcmVkby9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZG9MYXN0QWN0aW9uKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZWRvTGFzdEFjdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygncmVkbycpO1xuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucmVkbycpO1xuICB9XG59XG5cblJlZG9Db21tYW5kLmRlc2NyaXB0aW9uID0gYFJlZG8gbGFzdCBjb21tYW5kIHdpdGggXCJyZWRvXCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgUmVkb0NvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIFVuZG9Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC91bmRvL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMudW5kb0xhc3RBY3Rpb24oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVuZG9MYXN0QWN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKCd1bmRvJyk7XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS51bmRvJyk7XG4gIH1cbn1cblxuVW5kb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgVW5kbyBsYXN0IGNvbW1hbmQgd2l0aCBcInVuZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBVbmRvQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlVGFiKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWV9LCAodGFicykgPT4ge1xuICAgICAgaWYgKHRhYnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUodGFic1swXSk7XG4gICAgfSlcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImNvbnN0IElETEUgPSAxO1xuY29uc3QgUkVDT1JESU5HID0gMjtcblxuY2xhc3MgUmVjb3JkaW5nSWNvbiB7XG4gIGNvbnN0cnVjdCgpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBJRExFO1xuICB9XG5cbiAgc2hvdygpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBSRUNPUkRJTkc7XG5cbiAgICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZVRleHQoe1xuICAgICAgdGV4dDogJ8K3J1xuICAgIH0pO1xuICB9XG5cbiAgaGlkZSgpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBJRExFO1xuXG4gICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHtcbiAgICAgIHRleHQ6JydcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSZWNvcmRpbmdJY29uOyIsImNsYXNzIExpc3RlbmVyTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9XG5cbiAgbm90aWZ5TGlzdGVuZXJzKGRhdGEpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgbGlzdGVuZXIoZGF0YSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdGVuZXJNYW5hZ2VyOyIsImltcG9ydCBMaXN0ZW5lck1hbmFnZXIgZnJvbSAnLi9saXN0ZW5lci1tYW5hZ2VyLmpzJztcbmNvbnN0IEFDVElWRSA9IDE7XG5jb25zdCBJTkFDVElWRSA9IDI7XG5cbmNsYXNzIFNwZWVjaFJlY29nbml0aW9uIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVjb2duaXRpb24gPSBudWxsO1xuICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuXG4gICAgdGhpcy5vblJlc3VsdCA9IG5ldyBMaXN0ZW5lck1hbmFnZXIoKTtcbiAgICB0aGlzLm9uRW5kID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgdmFyIHJlY29nbml0aW9uID0gbmV3IHdlYmtpdFNwZWVjaFJlY29nbml0aW9uKCk7XG4gICAgcmVjb2duaXRpb24uY29udGludW91cyA9IHRydWU7XG4gICAgLy9yZWNvZ25pdGlvbi5pbnRlcmltUmVzdWx0cyA9IHRydWU7XG5cbiAgICByZWNvZ25pdGlvbi5vbmVuZCA9ICgpID0+IHtcbiAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoKTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24ub25yZXN1bHQgPSAoZXZlbnQpID0+IHtcbiAgICAgIGxldCBpbnRlcmltX3RyYW5zY3JpcHQgPSAnJywgZmluYWxfdHJhbnNjcmlwdCA9ICcnO1xuXG4gICAgICBmb3IgKGxldCBpID0gZXZlbnQucmVzdWx0SW5kZXg7IGkgPCBldmVudC5yZXN1bHRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChldmVudC5yZXN1bHRzW2ldLmlzRmluYWwpIHtcbiAgICAgICAgICBmaW5hbF90cmFuc2NyaXB0ICs9IGV2ZW50LnJlc3VsdHNbaV1bMF0udHJhbnNjcmlwdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbnRlcmltX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdTcGVlY2hSZWNvZ25pdGlvbicsIGZpbmFsX3RyYW5zY3JpcHQpO1xuICAgICAgdGhpcy5vblJlc3VsdC5ub3RpZnlMaXN0ZW5lcnMoZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgfTtcblxuICAgIHJlY29nbml0aW9uLnN0YXJ0KCk7XG5cbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IHJlY29nbml0aW9uO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlY29nbml0aW9uLm9uc3RhcnQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IEFDVElWRTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcmVjb2duaXRpb24ub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBJTkFDVElWRTtcbiAgICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoZXZlbnQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGlzQWN0aXZlKCkge1xuICAgIHJldHVybiB0aGlzLl9zdGF0dXMgPT09IEFDVElWRTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3JlY29nbml0aW9uKSB7XG4gICAgICB0aGlzLl9yZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNwZWVjaFJlY29nbml0aW9uO1xuIiwiZnVuY3Rpb24gX2F0dGFjaCh0YWJJZCkge1xuICB2YXIgcHJvdG9jb2xWZXJzaW9uID0gJzEuMSc7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUuZGVidWdnZXIuYXR0YWNoKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sIHByb3RvY29sVmVyc2lvbiwgKCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9kZXRhY2godGFiSWQpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUuZGVidWdnZXIuZGV0YWNoKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sICgpID0+IHtcbiAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfc2VuZENvbW1hbmQodGFiSWQsIGNvbW1hbmQsIGRhdGEgPSB7fSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5zZW5kQ29tbWFuZCh7XG4gICAgICB0YWJJZDogdGFiSWRcbiAgICB9LCBjb21tYW5kLCBkYXRhLCAocmVzcG9uc2UpID0+IHtcbiAgICAgIGlmIChyZXNwb25zZS5lcnJvcikge1xuICAgICAgICByZWplY3QocmVzcG9uc2UuZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY2xhc3MgVGFiRGVidWdnZXIge1xuICBjb25zdHJ1Y3Rvcih0YWJJZCkge1xuICAgIHRoaXMuX3RhYklkID0gdGFiSWQ7XG4gICAgdGhpcy5fYXR0YWNoZWQgPSB0cnVlO1xuXG4gICAgY2hyb21lLmRlYnVnZ2VyLm9uRGV0YWNoLmFkZExpc3RlbmVyKChzb3VyY2UsIHJlYXNvbikgPT4ge1xuICAgICAgaWYoc291cmNlLnRhYklkID09PSB0aGlzLl90YWJJZCkge1xuICAgICAgICB0aGlzLl9hdHRhY2hlZCA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY29ubmVjdCgpIHtcbiAgICByZXR1cm4gX2F0dGFjaCh0aGlzLl90YWJJZCkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG4gICAgfSk7XG4gIH1cblxuICBkaXNjb25uZWN0KCl7XG4gICAgcmV0dXJuIF9kZXRhY2godGhpcy5fdGFiSWQpO1xuICB9XG5cbiAgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkO1xuICB9XG5cbiAgc2VuZENvbW1hbmQoY29tbWFuZCwgZGF0YSkge1xuICAgIGlmKCF0aGlzLl9hdHRhY2hlZCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gX3NlbmRDb21tYW5kKHRoaXMuX3RhYklkLCBjb21tYW5kLCBkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBfc2VuZENvbW1hbmQodGhpcy5fdGFiSWQsIGNvbW1hbmQsIGRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRhYkRlYnVnZ2VyOyIsImltcG9ydCBTcGVlY2hSZWNvZ25pdGlvbiBmcm9tICcuL3NwZWVjaC1yZWNvZ25pdGlvbi5qcyc7XG5pbXBvcnQgQ29tbWFuZFJ1bm5lciBmcm9tICcuL2NvbW1hbmQtcnVubmVyLmpzJztcbmltcG9ydCBUYWJEZWJ1Z2dlciBmcm9tICcuL3RhYi1kZWJ1Z2dlci5qcyc7XG5pbXBvcnQge2dldEFjdGl2ZVRhYn0gZnJvbSAnLi9oZWxwZXJzL3RhYnMuanMnO1xuaW1wb3J0IFJlY29yZGluZ0ljb24gZnJvbSAnLi9yZWNvcmRpbmctaWNvbi5qcyc7XG5cbmltcG9ydCBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9ub2RlLWluc3BlY3Rpb24uanMnO1xuaW1wb3J0IE5vZGVEZWxldGlvbkNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzJztcbmltcG9ydCBDU1NDaGFuZ2VDb21tYW5kIGZyb20gJy4vY29tbWFuZHMvY3NzLWNoYW5nZS5qcyc7XG5pbXBvcnQgQ1NTR2V0VmFsdWVDb21tYW5kIGZyb20gJy4vY29tbWFuZHMvY3NzLWdldC12YWx1ZS5qcyc7XG5pbXBvcnQgVW5kb0NvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy91bmRvLmpzJztcbmltcG9ydCBSZWRvQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL3JlZG8uanMnO1xuXG5sZXQgcmVjb3JkaW5nSWNvbiA9IG5ldyBSZWNvcmRpbmdJY29uKCk7XG5sZXQgY29tbWFuZFJ1bm5lciA9IG5ldyBDb21tYW5kUnVubmVyKCk7XG5cbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKE5vZGVJbnNwZWN0aW9uQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChOb2RlRGVsZXRpb25Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKENTU0NoYW5nZUNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoQ1NTR2V0VmFsdWVDb21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKFVuZG9Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKFJlZG9Db21tYW5kKTtcblxubGV0IHNwZWVjaFJlY29nbml0aW9uID0gbmV3IFNwZWVjaFJlY29nbml0aW9uKCk7XG5sZXQgdGFiRGVidWdnZXIgPSBudWxsO1xuXG5zcGVlY2hSZWNvZ25pdGlvbi5vblJlc3VsdC5hZGRMaXN0ZW5lcigodHJhbnNjcmlwdCkgPT4ge1xuICBjb21tYW5kUnVubmVyLnJlY29nbml6ZSh0cmFuc2NyaXB0KTtcbn0pO1xuXG5zcGVlY2hSZWNvZ25pdGlvbi5vbkVuZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmKHRhYkRlYnVnZ2VyICYmIHRhYkRlYnVnZ2VyLmlzQ29ubmVjdGVkKCkpIHtcbiAgICB0YWJEZWJ1Z2dlci5kaXNjb25uZWN0KCk7XG4gIH1cbiAgcmVjb3JkaW5nSWNvbi5oaWRlKCk7XG59KTtcblxuY2hyb21lLmJyb3dzZXJBY3Rpb24ub25DbGlja2VkLmFkZExpc3RlbmVyKCgpID0+IHtcbiAgaWYoc3BlZWNoUmVjb2duaXRpb24uaXNBY3RpdmUoKSkge1xuICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBzcGVlY2hSZWNvZ25pdGlvblxuICAgIC5zdGFydCgpXG4gICAgLnRoZW4oZ2V0QWN0aXZlVGFiKVxuICAgIC50aGVuKCh0YWIpID0+IHtcbiAgICAgIHRhYkRlYnVnZ2VyID0gbmV3IFRhYkRlYnVnZ2VyKHRhYi5pZCk7XG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuY29ubmVjdCgpO1xuICAgIH0pXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgcmVjb3JkaW5nSWNvbi5zaG93KCk7XG4gICAgICBjb21tYW5kUnVubmVyLnNldFRhYkRlYnVnZ2VyKHRhYkRlYnVnZ2VyKTtcbiAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvciA9PSAnbm90LWFsbG93ZWQnKSB7XG4gICAgICAgIGNocm9tZS5ydW50aW1lLm9wZW5PcHRpb25zUGFnZSgpO1xuICAgICAgfVxuXG4gICAgICBpZihzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufSk7Il19
