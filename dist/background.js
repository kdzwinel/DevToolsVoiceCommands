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
        this._animationInterval = null;
      },
      show: function() {
        this._status = RECORDING;
        var i = 0;
        var animation = ' ·';
        function updateFrame() {
          var frame = animation[i % animation.length];
          i++;
          chrome.browserAction.setBadgeText({text: frame});
        }
        updateFrame();
        this._animationInterval = setInterval(updateFrame, 150);
      },
      hide: function() {
        this._status = IDLE;
        if (this._animationInterval) {
          clearInterval(this._animationInterval);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC1ydW5uZXIuanMiLCJzY3JpcHRzL2NvbW1hbmQuanMiLCJzY3JpcHRzL2hlbHBlcnMvY3NzLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtY2hhbmdlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzIiwic2NyaXB0cy9jb21tYW5kcy9ub2RlLWluc3BlY3Rpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3JlZG8uanMiLCJzY3JpcHRzL2NvbW1hbmRzL3VuZG8uanMiLCJzY3JpcHRzL2hlbHBlcnMvdGFicy5qcyIsInNjcmlwdHMvcmVjb3JkaW5nLWljb24uanMiLCJzY3JpcHRzL2xpc3RlbmVyLW1hbmFnZXIuanMiLCJzY3JpcHRzL3NwZWVjaC1yZWNvZ25pdGlvbi5qcyIsInNjcmlwdHMvdGFiLWRlYnVnZ2VyLmpzIiwic2NyaXB0cy9iYWNrZ3JvdW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsQUFBSSxJQUFBLENBQUEsWUFBVyw4QkFBb0IsQ0FBQztJQ0E5QixjQUFZLEVBQWxCLENBQUEsU0FBUyxBQUFEO0FBQVIsV0FBTSxjQUFZLENBQ0osQUFBRCxDQUFHO0FBQ1osU0FBRyxhQUFhLEVBQUksS0FBRyxDQUFDO0FBQ3hCLFNBQUcsWUFBWSxFQUFJLEtBQUcsQ0FBQztBQUN2QixTQUFHLGVBQWUsRUFBSSxLQUFHLENBQUM7QUFDMUIsU0FBRyxVQUFVLEVBQUksSUFBSSxJQUFFLEFBQUMsRUFBQyxDQUFDO0lBQzVCO0FBa0VGLEFBdEVVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFNNUMsbUJBQWEsQ0FBYixVQUFlLFdBQVU7O0FBQ3ZCLFdBQUcsYUFBYSxFQUFJLFlBQVUsQ0FBQztBQUUvQixrQkFBVSxZQUFZLEFBQUMsQ0FBQyxZQUFXLENBQUMsS0FDOUIsQUFBQyxDQUFDLFdBQVUsWUFB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LEVBQUMsQ0FBRztBQUMzQyxnQkFBVSxXQUFXLEFBQUMsRUFBQyxDQUFDO0lBQzFCO0FBQUEsQUFDQSxnQkFBWSxLQUFLLEFBQUMsRUFBQyxDQUFDO0VBQ3RCLENBQUMsQ0FBQztBQUVGLE9BQUssY0FBYyxVQUFVLFlBQVksQUFBQyxDQUFDLFNBQUMsQUFBRDtBQUN6QyxPQUFHLGlCQUFnQixTQUFTLEFBQUMsRUFBQyxDQUFHO0FBQy9CLHNCQUFnQixLQUFLLEFBQUMsRUFBQyxDQUFDO0FBQ3hCLFlBQU07SUFDUjtBQUFBLEFBRUEsb0JBQWdCLE1BQ1QsQUFBQyxFQUFDLEtBQ0gsQUFBQyxDQUFDLFlBQVcsQ0FBQyxLQUNkLEFBQUMsQ0FBQyxTQUFDLEdBQUUsQ0FBTTtBQUNiLGdCQUFVLEVBQUksSUFBSSxZQUFVLEFBQUMsQ0FBQyxHQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3JDLFdBQU8sQ0FBQSxXQUFVLFFBQVEsQUFBQyxFQUFDLENBQUM7SUFDOUIsQ0FBQyxLQUNHLEFBQUMsQ0FBQyxTQUFDLEFBQUQsQ0FBTTtBQUNWLGtCQUFZLEtBQUssQUFBQyxFQUFDLENBQUM7QUFDcEIsa0JBQVksZUFBZSxBQUFDLENBQUMsV0FBVSxDQUFDLENBQUM7SUFDM0MsQ0FBQyxNQUFNLEFBQUMsQ0FBQyxTQUFDLEtBQUksQ0FBTTtBQUNsQixTQUFJLEtBQUksR0FBSyxjQUFZLENBQUc7QUFDMUIsYUFBSyxRQUFRLGdCQUFnQixBQUFDLEVBQUMsQ0FBQztNQUNsQztBQUFBLEFBRUEsU0FBRyxpQkFBZ0IsU0FBUyxBQUFDLEVBQUMsQ0FBRztBQUMvQix3QkFBZ0IsS0FBSyxBQUFDLEVBQUMsQ0FBQztNQUMxQjtBQUFBLEFBRUEsWUFBTSxJQUFJLEFBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDLENBQUM7RUFDTixDQUFDLENBQUM7QUFoRUYsV0FBdUIiLCJmaWxlIjoiL1VzZXJzL2tkendpbmVsL1Byb2plY3RzL09TL0RldlRvb2xzVm9pY2VDb21tYW5kcy90ZW1wb3V0TUM0MU16VTJNRGd3TURVeU5EUXlPRFE1LmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJjbGFzcyBDb21tYW5kUnVubmVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fdGFiRGVidWdnZXIgPSBudWxsO1xuICAgIHRoaXMuX3Jvb3ROb2RlSWQgPSBudWxsO1xuICAgIHRoaXMuX2NvbnRleHROb2RlSWQgPSBudWxsO1xuICAgIHRoaXMuX2NvbW1hbmRzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpIHtcbiAgICB0aGlzLl90YWJEZWJ1Z2dlciA9IHRhYkRlYnVnZ2VyO1xuXG4gICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5lbmFibGUnKVxuICAgICAgLnRoZW4odGFiRGVidWdnZXIuc2VuZENvbW1hbmQuYmluZCh0YWJEZWJ1Z2dlciwgJ0NTUy5lbmFibGUnKSlcbiAgICAgIC50aGVuKHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kLmJpbmQodGFiRGVidWdnZXIsICdET00uZ2V0RG9jdW1lbnQnKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGlmKCFkYXRhLnJvb3QpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvY3VtZW50IHJvb3Qgbm90IGF2YWlsYWJsZS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3Jvb3ROb2RlSWQgPSBkYXRhLnJvb3Qubm9kZUlkO1xuICAgICAgfSk7XG4gIH1cblxuICBnZXRUYWJEZWJ1Z2dlcigpIHtcbiAgICByZXR1cm4gdGhpcy5fdGFiRGVidWdnZXI7XG4gIH1cblxuICBnZXRDb250ZXh0Tm9kZUlkKCkge1xuICAgIHJldHVybiB0aGlzLl9jb250ZXh0Tm9kZUlkO1xuICB9XG5cbiAgc2V0Q29udGV4dE5vZGVJZChpZCkge1xuICAgIHRoaXMuX2NvbnRleHROb2RlSWQgPSBpZDtcbiAgfVxuXG4gIGdldFJvb3ROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3ROb2RlSWQ7XG4gIH1cblxuICByZWdpc3RlckNvbW1hbmQoY29tbWFuZFR5cGUpIHtcbiAgICB0aGlzLl9jb21tYW5kcy5hZGQobmV3IGNvbW1hbmRUeXBlKHRoaXMpKTtcbiAgfVxuXG4gIHJlY29nbml6ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSBbXTtcblxuICAgIC8vZmlndXJlIG91dCB0aGUgb3JkZXIgaW4gd2hpY2ggY29tbWFuZHMgc2hvdWxkIGJlIGNhbGxlZCAobXVzdCBiZSB0aGUgc2FtZSBhcyBpbiB0aGUgdGV4dClcbiAgICB0aGlzLl9jb21tYW5kcy5mb3JFYWNoKChjb21tYW5kKSA9PiB7XG4gICAgICBsZXQgcG9zaXRpb24gPSBjb21tYW5kLm1hdGNoKHRleHQpO1xuXG4gICAgICBpZihwb3NpdGlvbiAhPT0gLTEpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICBjb21tYW5kXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1hdGNoZXNcbiAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIHJldHVybiBhLnBvc2l0aW9uIC0gYi5wb3NpdGlvbjtcbiAgICAgIH0pXG4gICAgICAvL2NhbGwgbmV4dCBjb21tYW5kIG9ubHkgYWZ0ZXIgcHJldmlvdXMgb25lIGhhcyBmaW5pc2hlZFxuICAgICAgLnJlZHVjZSgocHJvbWlzZSwge2NvbW1hbmR9KSA9PiB7XG4gICAgICAgIGlmKCFwcm9taXNlKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbW1hbmQuZXhlY3V0ZSh0ZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oY29tbWFuZC5leGVjdXRlLmJpbmQoY29tbWFuZCwgdGV4dCkpO1xuICAgICAgfSwgbnVsbCk7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21tYW5kUnVubmVyOyIsImNsYXNzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgdGhpcy5fcmVnZXggPSAvXiQvaTtcbiAgICB0aGlzLl9jb21tYW5kUnVubmVyID0gY29tbWFuZFJ1bm5lcjtcbiAgfVxuXG4gIG1hdGNoKHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5zZWFyY2godGhpcy5fcmVnZXgpO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB7dGFiRGVidWdnZXIsIHJvb3ROb2RlSWQsIGNvbnRleHROb2RlSWR9KSB7XG5cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21tYW5kOyIsImV4cG9ydCBmdW5jdGlvbiB0b0NTU1Byb3BlcnR5KHRleHQpIHtcbiAgcmV0dXJuIHRleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCcgJywgJy0nKTtcbn1cblxubGV0IGNzc1VuaXRzID0ge1xuICBwaXhlbDogJ3B4JyxcbiAgcGl4ZWxzOiAncHgnLFxuICBlbTogJ2VtJyxcbiAgZW1zOiAnZW0nLFxuICBwZXJjZW50OiAnJSdcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0NTU1ZhbHVlKHZhbHVlLCB1bml0KSB7XG4gIGlmICh1bml0KSB7XG4gICAgcmV0dXJuIHZhbHVlICsgY3NzVW5pdHNbdW5pdF07XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQ1NTVmFsdWVUb1RleHQoY3NzVmFsdWUpIHtcbiAgbGV0IG1hdGNoZXMgPSBjc3NWYWx1ZS5tYXRjaCgvKFswLTkuXSspcHgvaSk7XG5cbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBsZXQgbnVtVmFsdWUgPSBtYXRjaGVzWzFdO1xuXG4gICAgcmV0dXJuIChudW1WYWx1ZSA9PT0gMSkgPyAnb25lIHBpeGVsJyA6IG51bVZhbHVlICsgJyBwaXhlbHMnO1xuICB9XG5cbiAgcmV0dXJuIGNzc1ZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7fTsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcbmltcG9ydCB7dG9DU1NQcm9wZXJ0eSwgdG9DU1NWYWx1ZX0gZnJvbSAnLi4vaGVscGVycy9jc3MuanMnO1xuXG5jbGFzcyBDU1NDaGFuZ2VDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oY2hhbmdlfHNldCkoIGl0cyk/IChcXHcrKCBcXHcrKT8pIHRvIChcXHcrKSA/KHBpeGVsfHBpeGVsc3xwZXJjZW50fGVtfGVtcyk/L2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgbGV0IGNzcyA9ICc7JyArIHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSkgKyAnOiAnICsgdG9DU1NWYWx1ZShtYXRjaGVzWzVdLCBtYXRjaGVzWzZdKSArICc7JztcbiAgICAgIHJldHVybiB0aGlzLmFwcGVuZFRvU3R5bGVzKHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Q29udGV4dE5vZGVJZCgpLCBjc3MpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kVG9TdHlsZXMobm9kZUlkLCB0ZXh0KSB7XG4gICAgY29uc29sZS5sb2coJ2NoYW5nZSBzdHlsZXMnLCBub2RlSWQsIHRleHQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIG5vZGUuJyk7XG4gICAgfVxuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uZ2V0QXR0cmlidXRlcycsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGxldCBvbGRTdHlsZVZhbHVlID0gJyc7XG5cbiAgICAgIGlmKGRhdGEuYXR0cmlidXRlcyAmJiBkYXRhLmF0dHJpYnV0ZXMuaW5kZXhPZignc3R5bGUnKSAhPT0gLTEpIHtcbiAgICAgICAgbGV0IGlkeE9mU3R5bGUgPSBkYXRhLmF0dHJpYnV0ZXMuaW5kZXhPZignc3R5bGUnKTtcbiAgICAgICAgb2xkU3R5bGVWYWx1ZSA9IGRhdGEuYXR0cmlidXRlc1tpZHhPZlN0eWxlICsgMV07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnNldEF0dHJpYnV0ZVZhbHVlJywge1xuICAgICAgICBub2RlSWQsXG4gICAgICAgIG5hbWU6ICdzdHlsZScsXG4gICAgICAgIHZhbHVlOiBvbGRTdHlsZVZhbHVlICsgdGV4dFxuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbkNTU0NoYW5nZUNvbW1hbmQuZGVzY3JpcHRpb24gPSBgQ2hhbmdlIENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgYnkgc2F5aW5nIFwiY2hhbmdlIGl0cyB4IHRvIHlcIiBvciBcInNldCBpdHMgeCB0byB5XCIgKHdoZXJlIFwieFwiIGlzIHRoZSBuYW1lIG9mIHRoZSBDU1MgcHJvcGVydHkgYW5kIFwieVwiIGlzIHRoZSBuZXcgdmFsdWUpLmA7XG5cbmV4cG9ydCBkZWZhdWx0IENTU0NoYW5nZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIGZyb21DU1NWYWx1ZVRvVGV4dH0gZnJvbSAnLi4vaGVscGVycy9jc3MuanMnO1xuXG5jbGFzcyBDU1NHZXRWYWx1ZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyh3aGF0J3N8d2hhdCBpc3xnZXQpKCBpdHMpPyAoXFx3KyggXFx3Kyk/KS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldENvbXB1dGVkVmFsdWUodG9DU1NQcm9wZXJ0eShtYXRjaGVzWzNdKSwgdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRDb250ZXh0Tm9kZUlkKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29tcHV0ZWRWYWx1ZShwcm9wZXJ0eSwgbm9kZUlkKSB7XG4gICAgY29uc29sZS5sb2coJ2dldENvbXB1dGVkVmFsdWUnLCBwcm9wZXJ0eSwgbm9kZUlkKTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBub2RlLicpO1xuICAgIH1cblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnQ1NTLmdldENvbXB1dGVkU3R5bGVGb3JOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IGl0ZW0gPSBkYXRhLmNvbXB1dGVkU3R5bGUuZmluZCgoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5uYW1lID09PSBwcm9wZXJ0eTtcbiAgICAgIH0pO1xuXG4gICAgICBpZihpdGVtKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdQcm9wZXJ0eSBmb3VuZCEgVmFsdWU6ICcgKyBmcm9tQ1NTVmFsdWVUb1RleHQoaXRlbS52YWx1ZSkpO1xuICAgICAgICBjaHJvbWUudHRzLnNwZWFrKGZyb21DU1NWYWx1ZVRvVGV4dChpdGVtLnZhbHVlKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnUHJvcGVydHkgJyArIHByb3BlcnR5ICsgJyBub3QgZm91bmQuJyk7XG4gICAgICB9XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbkNTU0dldFZhbHVlQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBHZXQgQ1NTIHByb3BlcnR5IHZhbHVlIG9mIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSBieSBzYXlpbmcgXCJnZXQgaXRzIHhcIiBvciBcIndoYXQncyBpdHMgeFwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5KS5gO1xuXG5leHBvcnQgZGVmYXVsdCBDU1NHZXRWYWx1ZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIE5vZGVEZWxldGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhkZWxldGV8cmVtb3ZlKSBpdC9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZU5vZGUodGhpcy5fY29tbWFuZFJ1bm5lci5nZXRDb250ZXh0Tm9kZUlkKCkpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVtb3ZlTm9kZShub2RlSWQpIHtcbiAgICBjb25zb2xlLmxvZygncmVtb3ZlTm9kZScsIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl9jb21tYW5kUnVubmVyLmdldFRhYkRlYnVnZ2VyKCk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZW1vdmVOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbk5vZGVEZWxldGlvbkNvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVtb3ZlIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSB3aXRoIFwicmVtb3ZlIGl0XCIgb3IgXCJkZWxldGUgaXRcIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlRGVsZXRpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhzZWxlY3R8aW5zcGVjdCkgKFxcdyspL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0Tm9kZShtYXRjaGVzWzJdICsgJywgIycgKyBtYXRjaGVzWzJdICsgJywgLicgKyBtYXRjaGVzWzJdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNlbGVjdE5vZGUoc2VsZWN0b3IpIHtcbiAgICBjb25zb2xlLmxvZygnc2VsZWN0Tm9kZScsIHNlbGVjdG9yKTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcbiAgICBsZXQgcm9vdE5vZGVJZCA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0Um9vdE5vZGVJZCgpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucXVlcnlTZWxlY3RvcicsIHtcbiAgICAgIG5vZGVJZDogcm9vdE5vZGVJZCxcbiAgICAgIHNlbGVjdG9yXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgaWYoIWRhdGEubm9kZUlkKSB7XG4gICAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9jb21tYW5kUnVubmVyLnNldENvbnRleHROb2RlSWQoZGF0YS5ub2RlSWQpO1xuXG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWdobGlnaHROb2RlJywge1xuICAgICAgICBoaWdobGlnaHRDb25maWc6IHtcbiAgICAgICAgICBjb250ZW50Q29sb3I6IHtcbiAgICAgICAgICAgIHI6IDE1NSxcbiAgICAgICAgICAgIGc6IDExLFxuICAgICAgICAgICAgYjogMjM5LFxuICAgICAgICAgICAgYTogMC43XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzaG93SW5mbzogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBub2RlSWQ6IGRhdGEubm9kZUlkXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy9zdG9wIGhpZ2hsaWdodGluZyBhZnRlciBjb3VwbGUgb2Ygc2Vjb25kc1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmhpZGVIaWdobGlnaHQnKTtcbiAgICAgICAgfSwgMjAwMCk7XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuTm9kZUluc3BlY3Rpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFNlbGVjdCBET00gbm9kZXMgd2l0aCBcInNlbGVjdCB4XCIgb3IgXCJpbnNwZWN0IHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIHRhZywgaWQgb3IgQ1NTIGNsYXNzKS4gSWYgbXVsdGlwbGUgbm9kZXMgbWF0Y2gsIG9ubHkgdGhlIGZpcnN0IG9uZSB3aWxsIGJlIHNlbGVjdGVkLmA7XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgUmVkb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3JlZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWRvTGFzdEFjdGlvbigpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVkb0xhc3RBY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coJ3JlZG8nKTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX2NvbW1hbmRSdW5uZXIuZ2V0VGFiRGVidWdnZXIoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnJlZG8nKTtcbiAgfVxufVxuXG5SZWRvQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBSZWRvIGxhc3QgY29tbWFuZCB3aXRoIFwicmVkb1wiLmA7XG5cbmV4cG9ydCBkZWZhdWx0IFJlZG9Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBVbmRvQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvdW5kby9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnVuZG9MYXN0QWN0aW9uKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICB1bmRvTGFzdEFjdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZygndW5kbycpO1xuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fY29tbWFuZFJ1bm5lci5nZXRUYWJEZWJ1Z2dlcigpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00udW5kbycpO1xuICB9XG59XG5cblVuZG9Db21tYW5kLmRlc2NyaXB0aW9uID0gYFVuZG8gbGFzdCBjb21tYW5kIHdpdGggXCJ1bmRvXCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgVW5kb0NvbW1hbmQ7IiwiZXhwb3J0IGZ1bmN0aW9uIGdldEFjdGl2ZVRhYigpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUudGFicy5xdWVyeSh7YWN0aXZlOiB0cnVlfSwgKHRhYnMpID0+IHtcbiAgICAgIGlmICh0YWJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZWplY3QoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKHRhYnNbMF0pO1xuICAgIH0pXG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7fTsiLCJjb25zdCBJRExFID0gMTtcbmNvbnN0IFJFQ09SRElORyA9IDI7XG5cbmNsYXNzIFJlY29yZGluZ0ljb24ge1xuICBjb25zdHJ1Y3QoKSB7XG4gICAgdGhpcy5fc3RhdHVzID0gSURMRTtcbiAgICB0aGlzLl9hbmltYXRpb25JbnRlcnZhbCA9IG51bGw7XG4gIH1cblxuICBzaG93KCkge1xuICAgIHRoaXMuX3N0YXR1cyA9IFJFQ09SRElORztcblxuICAgIGxldCBpID0gMDtcbiAgICBsZXQgYW5pbWF0aW9uID0gJyDCtyc7XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVGcmFtZSgpIHtcbiAgICAgIHZhciBmcmFtZSA9IGFuaW1hdGlvbltpICUgYW5pbWF0aW9uLmxlbmd0aF07XG4gICAgICBpKys7XG5cbiAgICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgICAgIHRleHQ6IGZyYW1lXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB1cGRhdGVGcmFtZSgpO1xuICAgIFxuICAgIHRoaXMuX2FuaW1hdGlvbkludGVydmFsID0gc2V0SW50ZXJ2YWwodXBkYXRlRnJhbWUsIDE1MCk7XG4gIH1cblxuICBoaWRlKCkge1xuICAgIHRoaXMuX3N0YXR1cyA9IElETEU7XG5cbiAgICBpZiAodGhpcy5fYW5pbWF0aW9uSW50ZXJ2YWwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fYW5pbWF0aW9uSW50ZXJ2YWwpO1xuICAgIH1cblxuICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgICB0ZXh0OiAnJ1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlY29yZGluZ0ljb247IiwiY2xhc3MgTGlzdGVuZXJNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH1cblxuICBub3RpZnlMaXN0ZW5lcnMoZGF0YSkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBsaXN0ZW5lcihkYXRhKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0ZW5lck1hbmFnZXI7IiwiaW1wb3J0IExpc3RlbmVyTWFuYWdlciBmcm9tICcuL2xpc3RlbmVyLW1hbmFnZXIuanMnO1xuY29uc3QgQUNUSVZFID0gMTtcbmNvbnN0IElOQUNUSVZFID0gMjtcblxuY2xhc3MgU3BlZWNoUmVjb2duaXRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG5cbiAgICB0aGlzLm9uUmVzdWx0ID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICAgIHRoaXMub25FbmQgPSBuZXcgTGlzdGVuZXJNYW5hZ2VyKCk7XG4gIH1cblxuICBzdGFydCgpIHtcbiAgICB2YXIgcmVjb2duaXRpb24gPSBuZXcgd2Via2l0U3BlZWNoUmVjb2duaXRpb24oKTtcbiAgICByZWNvZ25pdGlvbi5jb250aW51b3VzID0gdHJ1ZTtcbiAgICAvL3JlY29nbml0aW9uLmludGVyaW1SZXN1bHRzID0gdHJ1ZTtcblxuICAgIHJlY29nbml0aW9uLm9uZW5kID0gKCkgPT4ge1xuICAgICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG4gICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycygpO1xuICAgIH07XG5cbiAgICByZWNvZ25pdGlvbi5vbnJlc3VsdCA9IChldmVudCkgPT4ge1xuICAgICAgbGV0IGludGVyaW1fdHJhbnNjcmlwdCA9ICcnLCBmaW5hbF90cmFuc2NyaXB0ID0gJyc7XG5cbiAgICAgIGZvciAobGV0IGkgPSBldmVudC5yZXN1bHRJbmRleDsgaSA8IGV2ZW50LnJlc3VsdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKGV2ZW50LnJlc3VsdHNbaV0uaXNGaW5hbCkge1xuICAgICAgICAgIGZpbmFsX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGludGVyaW1fdHJhbnNjcmlwdCArPSBldmVudC5yZXN1bHRzW2ldWzBdLnRyYW5zY3JpcHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1NwZWVjaFJlY29nbml0aW9uJywgZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgICB0aGlzLm9uUmVzdWx0Lm5vdGlmeUxpc3RlbmVycyhmaW5hbF90cmFuc2NyaXB0KTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24uc3RhcnQoKTtcblxuICAgIHRoaXMuX3JlY29nbml0aW9uID0gcmVjb2duaXRpb247XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVjb2duaXRpb24ub25zdGFydCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gQUNUSVZFO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuXG4gICAgICByZWNvZ25pdGlvbi5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycyhldmVudC5lcnJvcik7XG4gICAgICAgIHJlamVjdChldmVudC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgaXNBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gQUNUSVZFO1xuICB9XG5cbiAgc3RvcCgpIHtcbiAgICBpZiAodGhpcy5fcmVjb2duaXRpb24pIHtcbiAgICAgIHRoaXMuX3JlY29nbml0aW9uLnN0b3AoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU3BlZWNoUmVjb2duaXRpb247XG4iLCJmdW5jdGlvbiBfYXR0YWNoKHRhYklkKSB7XG4gIHZhciBwcm90b2NvbFZlcnNpb24gPSAnMS4xJztcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5hdHRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgcHJvdG9jb2xWZXJzaW9uLCAoKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX2RldGFjaCh0YWJJZCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5kZXRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgKCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9zZW5kQ29tbWFuZCh0YWJJZCwgY29tbWFuZCwgZGF0YSA9IHt9KSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLnNlbmRDb21tYW5kKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sIGNvbW1hbmQsIGRhdGEsIChyZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgIHJlamVjdChyZXNwb25zZS5lcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5jbGFzcyBUYWJEZWJ1Z2dlciB7XG4gIGNvbnN0cnVjdG9yKHRhYklkKSB7XG4gICAgdGhpcy5fdGFiSWQgPSB0YWJJZDtcbiAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG5cbiAgICBjaHJvbWUuZGVidWdnZXIub25EZXRhY2guYWRkTGlzdGVuZXIoKHNvdXJjZSwgcmVhc29uKSA9PiB7XG4gICAgICBpZihzb3VyY2UudGFiSWQgPT09IHRoaXMuX3RhYklkKSB7XG4gICAgICAgIHRoaXMuX2F0dGFjaGVkID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIHJldHVybiBfYXR0YWNoKHRoaXMuX3RhYklkKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkID0gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3QoKXtcbiAgICByZXR1cm4gX2RldGFjaCh0aGlzLl90YWJJZCk7XG4gIH1cblxuICBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNoZWQ7XG4gIH1cblxuICBzZW5kQ29tbWFuZChjb21tYW5kLCBkYXRhKSB7XG4gICAgaWYoIXRoaXMuX2F0dGFjaGVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25uZWN0KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBfc2VuZENvbW1hbmQodGhpcy5fdGFiSWQsIGNvbW1hbmQsIGRhdGEpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9zZW5kQ29tbWFuZCh0aGlzLl90YWJJZCwgY29tbWFuZCwgZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGFiRGVidWdnZXI7IiwiaW1wb3J0IFNwZWVjaFJlY29nbml0aW9uIGZyb20gJy4vc3BlZWNoLXJlY29nbml0aW9uLmpzJztcbmltcG9ydCBDb21tYW5kUnVubmVyIGZyb20gJy4vY29tbWFuZC1ydW5uZXIuanMnO1xuaW1wb3J0IFRhYkRlYnVnZ2VyIGZyb20gJy4vdGFiLWRlYnVnZ2VyLmpzJztcbmltcG9ydCB7Z2V0QWN0aXZlVGFifSBmcm9tICcuL2hlbHBlcnMvdGFicy5qcyc7XG5pbXBvcnQgUmVjb3JkaW5nSWNvbiBmcm9tICcuL3JlY29yZGluZy1pY29uLmpzJztcblxuaW1wb3J0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyc7XG5pbXBvcnQgTm9kZURlbGV0aW9uQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMnO1xuaW1wb3J0IENTU0NoYW5nZUNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9jc3MtY2hhbmdlLmpzJztcbmltcG9ydCBDU1NHZXRWYWx1ZUNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzJztcbmltcG9ydCBVbmRvQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL3VuZG8uanMnO1xuaW1wb3J0IFJlZG9Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvcmVkby5qcyc7XG5cbmxldCByZWNvcmRpbmdJY29uID0gbmV3IFJlY29yZGluZ0ljb24oKTtcbmxldCBjb21tYW5kUnVubmVyID0gbmV3IENvbW1hbmRSdW5uZXIoKTtcblxuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoTm9kZUluc3BlY3Rpb25Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKE5vZGVEZWxldGlvbkNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoQ1NTQ2hhbmdlQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChDU1NHZXRWYWx1ZUNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoVW5kb0NvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoUmVkb0NvbW1hbmQpO1xuXG5sZXQgc3BlZWNoUmVjb2duaXRpb24gPSBuZXcgU3BlZWNoUmVjb2duaXRpb24oKTtcbmxldCB0YWJEZWJ1Z2dlciA9IG51bGw7XG5cbnNwZWVjaFJlY29nbml0aW9uLm9uUmVzdWx0LmFkZExpc3RlbmVyKCh0cmFuc2NyaXB0KSA9PiB7XG4gIGNvbW1hbmRSdW5uZXIucmVjb2duaXplKHRyYW5zY3JpcHQpO1xufSk7XG5cbnNwZWVjaFJlY29nbml0aW9uLm9uRW5kLmFkZExpc3RlbmVyKCgpID0+IHtcbiAgaWYodGFiRGVidWdnZXIgJiYgdGFiRGVidWdnZXIuaXNDb25uZWN0ZWQoKSkge1xuICAgIHRhYkRlYnVnZ2VyLmRpc2Nvbm5lY3QoKTtcbiAgfVxuICByZWNvcmRpbmdJY29uLmhpZGUoKTtcbn0pO1xuXG5jaHJvbWUuYnJvd3NlckFjdGlvbi5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICBpZihzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHNwZWVjaFJlY29nbml0aW9uXG4gICAgLnN0YXJ0KClcbiAgICAudGhlbihnZXRBY3RpdmVUYWIpXG4gICAgLnRoZW4oKHRhYikgPT4ge1xuICAgICAgdGFiRGVidWdnZXIgPSBuZXcgVGFiRGVidWdnZXIodGFiLmlkKTtcbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5jb25uZWN0KCk7XG4gICAgfSlcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICByZWNvcmRpbmdJY29uLnNob3coKTtcbiAgICAgIGNvbW1hbmRSdW5uZXIuc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yID09ICdub3QtYWxsb3dlZCcpIHtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub3Blbk9wdGlvbnNQYWdlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHNwZWVjaFJlY29nbml0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59KTsiXX0=
