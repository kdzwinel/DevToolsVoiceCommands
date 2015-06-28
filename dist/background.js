var $__scripts_47_command_45_context_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/command-context.js";
  var CommandContext = function() {
    function CommandContext() {
      this._rootNodeId = null;
      this._contextNodeId = null;
      this._contextCSSPropertyName = null;
    }
    return ($traceurRuntime.createClass)(CommandContext, {
      getContextNodeId: function() {
        return this._contextNodeId;
      },
      setContextNodeId: function(id) {
        this._contextNodeId = id;
      },
      setRootNodeId: function(id) {
        this._rootNodeId = id;
      },
      getRootNodeId: function() {
        return this._rootNodeId;
      },
      setContextCSSPropertyName: function(name) {
        this._contextCSSPropertyName = name;
      },
      getContextCSSPropertyName: function() {
        return this._contextCSSPropertyName;
      }
    }, {});
  }();
  var $__default = CommandContext;
  return {get default() {
      return $__default;
    }};
})();
var $__scripts_47_command_45_runner_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/command-runner.js";
  var CommandContext = ($__scripts_47_command_45_context_46_js__).default;
  var CommandRunner = function() {
    function CommandRunner() {
      this._tabDebugger = null;
      this._commandContext = new CommandContext();
      this._commands = new Set();
    }
    return ($traceurRuntime.createClass)(CommandRunner, {
      setTabDebugger: function(tabDebugger) {
        var $__1 = this;
        this._tabDebugger = tabDebugger;
        tabDebugger.sendCommand('DOM.enable').then(tabDebugger.sendCommand.bind(tabDebugger, 'CSS.enable')).then(tabDebugger.sendCommand.bind(tabDebugger, 'DOM.getDocument')).then(function(data) {
          if (!data.root) {
            throw new Error('Document root not available.');
          }
          $__1._commandContext.setRootNodeId(data.root.nodeId);
        });
      },
      registerCommand: function(commandType) {
        this._commands.add(new commandType());
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
        var tabDebugger = this._tabDebugger;
        var commandContext = this._commandContext;
        return matches.sort(function(a, b) {
          return a.position - b.position;
        }).reduce(function(promise, $__3) {
          var command = $__3.command;
          if (!promise) {
            return command.execute(text, tabDebugger, commandContext);
          }
          var nextCommand = command.execute.bind(command, text, tabDebugger, commandContext);
          return promise.then(nextCommand);
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
        console.log('change styles', nodeId, text);
        if (!nodeId) {
          throw new Error('Invalid node.');
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
        console.log('getComputedValue', property, nodeId);
        if (!nodeId) {
          throw new Error('Invalid node.');
        }
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
        console.log('removeNode', nodeId);
        if (!nodeId) {
          throw new Error('Invalid node.');
        }
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
        console.log('selectNode', selector);
        var rootNodeId = commandContext.getRootNodeId();
        return tabDebugger.sendCommand('DOM.querySelector', {
          nodeId: rootNodeId,
          selector: selector
        }).then(function(data) {
          if (!data.nodeId) {
            chrome.tts.speak('Node not found.');
            throw new Error('Node not found.');
          }
          commandContext.setContextNodeId(data.nodeId);
          commandContext.setContextCSSPropertyName(null);
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
        console.log('redo');
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
        console.log('undo');
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
  var ListenerManager = ($__scripts_47_listener_45_manager_46_js__).default;
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
      var $__1 = this;
      this._tabId = tabId;
      this._attached = true;
      this.onDisconnect = new ListenerManager();
      chrome.debugger.onDetach.addListener(function(source, reason) {
        if (source.tabId === $__1._tabId) {
          $__1._attached = false;
          $__1.onDisconnect.notifyListeners();
        }
      });
    }
    return ($traceurRuntime.createClass)(TabDebugger, {
      connect: function() {
        var $__1 = this;
        return _attach(this._tabId).then(function() {
          $__1._attached = true;
        });
      },
      disconnect: function() {
        return _detach(this._tabId);
      },
      isConnected: function() {
        return this._attached;
      },
      sendCommand: function(command, data) {
        var $__1 = this;
        if (!this._attached) {
          return this.connect().then(function() {
            return _sendCommand($__1._tabId, command, data);
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
      tabDebugger.onDisconnect.addListener(function() {
        speechRecognition.stop();
      });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC1jb250ZXh0LmpzIiwic2NyaXB0cy9jb21tYW5kLXJ1bm5lci5qcyIsInNjcmlwdHMvY29tbWFuZC5qcyIsInNjcmlwdHMvaGVscGVycy9jc3MuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyIsInNjcmlwdHMvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvY29tbWFuZHMvdW5kby5qcyIsInNjcmlwdHMvaGVscGVycy90YWJzLmpzIiwic2NyaXB0cy9yZWNvcmRpbmctaWNvbi5qcyIsInNjcmlwdHMvbGlzdGVuZXItbWFuYWdlci5qcyIsInNjcmlwdHMvc3BlZWNoLXJlY29nbml0aW9uLmpzIiwic2NyaXB0cy90YWItZGVidWdnZXIuanMiLCJzY3JpcHRzL2JhY2tncm91bmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxBQUFJLElBQUEsQ0FBQSxZQUFXLCtCQUFvQixDQUFDO0lDQTlCLGVBQWEsRUFBbkIsQ0FBQSxTQUFTLEFBQUQ7QUFBUixXQUFNLGVBQWEsQ0FDTCxBQUFELENBQUc7QUFDWixTQUFHLFlBQVksRUFBSSxLQUFHLENBQUM7QUFDdkIsU0FBRyxlQUFlLEVBQUksS0FBRyxDQUFDO0FBQzFCLFNBQUcsd0JBQXdCLEVBQUksS0FBRyxDQUFDO0lBQ3JDO0FBeUJGLEFBNUJVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFLNUMscUJBQWUsQ0FBZixVQUFpQixBQUFELENBQUc7QUFDakIsYUFBTyxDQUFBLElBQUcsZUFBZSxDQUFDO01BQzVCO0FBRUEscUJBQWUsQ0FBZixVQUFpQixFQUFDLENBQUc7QUFDbkIsV0FBRyxlQUFlLEVBQUksR0FBQyxDQUFDO01B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QyxFQUFDLENBQUM7TUFDbEM7QUFBQSxBQUVBLFNBQUcsaUJBQWdCLFNBQVMsQUFBQyxFQUFDLENBQUc7QUFDL0Isd0JBQWdCLEtBQUssQUFBQyxFQUFDLENBQUM7TUFDMUI7QUFBQSxBQUVBLFlBQU0sSUFBSSxBQUFDLENBQUMsS0FBSSxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0VBQ04sQ0FBQyxDQUFDO0FBbkVGLFdBQXVCIiwiZmlsZSI6Ii9Vc2Vycy9rZHp3aW5lbC9Qcm9qZWN0cy9PUy9EZXZUb29sc1ZvaWNlQ29tbWFuZHMvdGVtcG91dE1DNHdOVE0xTnpJME56RTVOVEl3TmpVNE1qVXJlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwiY2xhc3MgQ29tbWFuZENvbnRleHQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yb290Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Q1NTUHJvcGVydHlOYW1lID0gbnVsbDtcbiAgfVxuXG4gIGdldENvbnRleHROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Tm9kZUlkKGlkKSB7XG4gICAgdGhpcy5fY29udGV4dE5vZGVJZCA9IGlkO1xuICB9XG5cbiAgc2V0Um9vdE5vZGVJZChpZCkge1xuICAgIHRoaXMuX3Jvb3ROb2RlSWQgPSBpZDtcbiAgfVxuXG4gIGdldFJvb3ROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3ROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKG5hbWUpIHtcbiAgICB0aGlzLl9jb250ZXh0Q1NTUHJvcGVydHlOYW1lID0gbmFtZTtcbiAgfVxuXG4gIGdldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHRDU1NQcm9wZXJ0eU5hbWU7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZENvbnRleHQ7IiwiaW1wb3J0IENvbW1hbmRDb250ZXh0IGZyb20gJy4vY29tbWFuZC1jb250ZXh0LmpzJztcblxuY2xhc3MgQ29tbWFuZFJ1bm5lciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gbnVsbDtcbiAgICB0aGlzLl9jb21tYW5kQ29udGV4dCA9IG5ldyBDb21tYW5kQ29udGV4dCgpO1xuICAgIHRoaXMuX2NvbW1hbmRzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpIHtcbiAgICB0aGlzLl90YWJEZWJ1Z2dlciA9IHRhYkRlYnVnZ2VyO1xuXG4gICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5lbmFibGUnKVxuICAgICAgLnRoZW4odGFiRGVidWdnZXIuc2VuZENvbW1hbmQuYmluZCh0YWJEZWJ1Z2dlciwgJ0NTUy5lbmFibGUnKSlcbiAgICAgIC50aGVuKHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kLmJpbmQodGFiRGVidWdnZXIsICdET00uZ2V0RG9jdW1lbnQnKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGlmKCFkYXRhLnJvb3QpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvY3VtZW50IHJvb3Qgbm90IGF2YWlsYWJsZS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbW1hbmRDb250ZXh0LnNldFJvb3ROb2RlSWQoZGF0YS5yb290Lm5vZGVJZCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29tbWFuZChjb21tYW5kVHlwZSkge1xuICAgIHRoaXMuX2NvbW1hbmRzLmFkZChuZXcgY29tbWFuZFR5cGUoKSk7XG4gIH1cblxuICByZWNvZ25pemUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gW107XG5cbiAgICAvL2ZpZ3VyZSBvdXQgdGhlIG9yZGVyIGluIHdoaWNoIGNvbW1hbmRzIHNob3VsZCBiZSBjYWxsZWQgKG11c3QgYmUgdGhlIHNhbWUgYXMgaW4gdGhlIHRleHQpXG4gICAgdGhpcy5fY29tbWFuZHMuZm9yRWFjaCgoY29tbWFuZCkgPT4ge1xuICAgICAgbGV0IHBvc2l0aW9uID0gY29tbWFuZC5tYXRjaCh0ZXh0KTtcblxuICAgICAgaWYocG9zaXRpb24gIT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgY29tbWFuZFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX3RhYkRlYnVnZ2VyO1xuICAgIGxldCBjb21tYW5kQ29udGV4dCA9IHRoaXMuX2NvbW1hbmRDb250ZXh0O1xuXG4gICAgcmV0dXJuIG1hdGNoZXNcbiAgICAgIC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIHJldHVybiBhLnBvc2l0aW9uIC0gYi5wb3NpdGlvbjtcbiAgICAgIH0pXG4gICAgICAvL2NhbGwgbmV4dCBjb21tYW5kIG9ubHkgYWZ0ZXIgcHJldmlvdXMgb25lIGhhcyBmaW5pc2hlZFxuICAgICAgLnJlZHVjZSgocHJvbWlzZSwge2NvbW1hbmR9KSA9PiB7XG4gICAgICAgIGlmKCFwcm9taXNlKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbW1hbmQuZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG5leHRDb21tYW5kID0gY29tbWFuZC5leGVjdXRlLmJpbmQoY29tbWFuZCwgdGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KTtcblxuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKG5leHRDb21tYW5kKTtcbiAgICAgIH0sIG51bGwpO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZFJ1bm5lcjsiLCJjbGFzcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVnZXggPSAvXiQvaTtcbiAgfVxuXG4gIG1hdGNoKHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5zZWFyY2godGhpcy5fcmVnZXgpO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcblxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmQ7IiwiZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTUHJvcGVydHkodGV4dCkge1xuICByZXR1cm4gdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJyAnLCAnLScpO1xufVxuXG5sZXQgY3NzVW5pdHMgPSB7XG4gIHBpeGVsOiAncHgnLFxuICBwaXhlbHM6ICdweCcsXG4gIGVtOiAnZW0nLFxuICBlbXM6ICdlbScsXG4gIHBlcmNlbnQ6ICclJ1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTVmFsdWUodmFsdWUsIHVuaXQpIHtcbiAgaWYgKHVuaXQpIHtcbiAgICByZXR1cm4gdmFsdWUgKyBjc3NVbml0c1t1bml0XTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21DU1NWYWx1ZVRvVGV4dChjc3NWYWx1ZSkge1xuICBsZXQgbWF0Y2hlcyA9IGNzc1ZhbHVlLm1hdGNoKC8oWzAtOS5dKylweC9pKTtcblxuICBpZiAobWF0Y2hlcykge1xuICAgIGxldCBudW1WYWx1ZSA9IG1hdGNoZXNbMV07XG5cbiAgICByZXR1cm4gKG51bVZhbHVlID09PSAxKSA/ICdvbmUgcGl4ZWwnIDogbnVtVmFsdWUgKyAnIHBpeGVscyc7XG4gIH1cblxuICByZXR1cm4gY3NzVmFsdWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCB0b0NTU1ZhbHVlfSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0NoYW5nZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhjaGFuZ2V8c2V0KSAoaXRzICk/KFxcdysoIFxcdyspPykgdG8gKFxcdyspID8ocGl4ZWx8cGl4ZWxzfHBlcmNlbnR8ZW18ZW1zKT8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBwcm9wZXJ0eSA9IHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSk7XG4gICAgICBsZXQgdmFsdWUgPSB0b0NTU1ZhbHVlKG1hdGNoZXNbNV0sIG1hdGNoZXNbNl0pO1xuXG4gICAgICBpZihtYXRjaGVzWzNdID09PSAnaXQnKSB7XG4gICAgICAgIHByb3BlcnR5ID0gY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZSgpO1xuICAgICAgfVxuXG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKHByb3BlcnR5KTtcblxuICAgICAgbGV0IGNzcyA9ICc7JyArIHByb3BlcnR5ICsgJzogJyArIHZhbHVlICsgJzsnO1xuICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kVG9TdHlsZXMoY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dE5vZGVJZCgpLCBjc3MsIHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZFRvU3R5bGVzKG5vZGVJZCwgdGV4dCwgdGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnY2hhbmdlIHN0eWxlcycsIG5vZGVJZCwgdGV4dCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5nZXRBdHRyaWJ1dGVzJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IG9sZFN0eWxlVmFsdWUgPSAnJztcblxuICAgICAgaWYoZGF0YS5hdHRyaWJ1dGVzICYmIGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpICE9PSAtMSkge1xuICAgICAgICBsZXQgaWR4T2ZTdHlsZSA9IGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpO1xuICAgICAgICBvbGRTdHlsZVZhbHVlID0gZGF0YS5hdHRyaWJ1dGVzW2lkeE9mU3R5bGUgKyAxXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uc2V0QXR0cmlidXRlVmFsdWUnLCB7XG4gICAgICAgIG5vZGVJZCxcbiAgICAgICAgbmFtZTogJ3N0eWxlJyxcbiAgICAgICAgdmFsdWU6IG9sZFN0eWxlVmFsdWUgKyB0ZXh0XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBjaHJvbWUudHRzLnNwZWFrKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuQ1NTQ2hhbmdlQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBDaGFuZ2UgQ1NTIHByb3BlcnR5IHZhbHVlIG9mIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSBieSBzYXlpbmcgXCJjaGFuZ2UgaXRzIHggdG8geVwiIG9yIFwic2V0IGl0cyB4IHRvIHlcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIENTUyBwcm9wZXJ0eSBhbmQgXCJ5XCIgaXMgdGhlIG5ldyB2YWx1ZSkuYDtcblxuZXhwb3J0IGRlZmF1bHQgQ1NTQ2hhbmdlQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcbmltcG9ydCB7dG9DU1NQcm9wZXJ0eSwgZnJvbUNTU1ZhbHVlVG9UZXh0fSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0dldFZhbHVlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKHdoYXQnc3x3aGF0IGlzfGdldCkoIGl0cyk/IChcXHcrKCBcXHcrKT8pL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICBsZXQgcHJvcGVydHkgPSB0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pO1xuXG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKHByb3BlcnR5KTtcbiAgICAgIHJldHVybiB0aGlzLmdldENvbXB1dGVkVmFsdWUocHJvcGVydHksIGNvbW1hbmRDb250ZXh0LmdldENvbnRleHROb2RlSWQoKSwgdGFiRGVidWdnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29tcHV0ZWRWYWx1ZShwcm9wZXJ0eSwgbm9kZUlkLCB0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdnZXRDb21wdXRlZFZhbHVlJywgcHJvcGVydHksIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0NTUy5nZXRDb21wdXRlZFN0eWxlRm9yTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGxldCBpdGVtID0gZGF0YS5jb21wdXRlZFN0eWxlLmZpbmQoKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ubmFtZSA9PT0gcHJvcGVydHk7XG4gICAgICB9KTtcblxuICAgICAgaWYoaXRlbSkge1xuICAgICAgICBjb25zb2xlLmxvZygnUHJvcGVydHkgZm91bmQhIFZhbHVlOiAnICsgZnJvbUNTU1ZhbHVlVG9UZXh0KGl0ZW0udmFsdWUpKTtcbiAgICAgICAgY2hyb21lLnR0cy5zcGVhayhmcm9tQ1NTVmFsdWVUb1RleHQoaXRlbS52YWx1ZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Byb3BlcnR5ICcgKyBwcm9wZXJ0eSArICcgbm90IGZvdW5kLicpO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5DU1NHZXRWYWx1ZUNvbW1hbmQuZGVzY3JpcHRpb24gPSBgR2V0IENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgYnkgc2F5aW5nIFwiZ2V0IGl0cyB4XCIgb3IgXCJ3aGF0J3MgaXRzIHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIENTUyBwcm9wZXJ0eSkuYDtcblxuZXhwb3J0IGRlZmF1bHQgQ1NTR2V0VmFsdWVDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlRGVsZXRpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oZGVsZXRlfHJlbW92ZSkgaXQvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZU5vZGUoY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dE5vZGVJZCgpLCB0YWJEZWJ1Z2dlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZW1vdmVOb2RlKG5vZGVJZCwgdGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygncmVtb3ZlTm9kZScsIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgbm9kZS4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZW1vdmVOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY2hyb21lLnR0cy5zcGVhaygnTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbk5vZGVEZWxldGlvbkNvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVtb3ZlIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSB3aXRoIFwicmVtb3ZlIGl0XCIgb3IgXCJkZWxldGUgaXRcIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlRGVsZXRpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhzZWxlY3R8aW5zcGVjdCkgKFxcdyspL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy5zZWxlY3ROb2RlKG1hdGNoZXNbMl0gKyAnLCAjJyArIG1hdGNoZXNbMl0gKyAnLCAuJyArIG1hdGNoZXNbMl0sIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBzZWxlY3ROb2RlKHNlbGVjdG9yLCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBjb25zb2xlLmxvZygnc2VsZWN0Tm9kZScsIHNlbGVjdG9yKTtcblxuICAgIGxldCByb290Tm9kZUlkID0gY29tbWFuZENvbnRleHQuZ2V0Um9vdE5vZGVJZCgpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucXVlcnlTZWxlY3RvcicsIHtcbiAgICAgIG5vZGVJZDogcm9vdE5vZGVJZCxcbiAgICAgIHNlbGVjdG9yXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgaWYoIWRhdGEubm9kZUlkKSB7XG4gICAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgfVxuXG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Tm9kZUlkKGRhdGEubm9kZUlkKTtcbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUobnVsbCk7XG5cbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmhpZ2hsaWdodE5vZGUnLCB7XG4gICAgICAgIGhpZ2hsaWdodENvbmZpZzoge1xuICAgICAgICAgIGNvbnRlbnRDb2xvcjoge1xuICAgICAgICAgICAgcjogMTU1LFxuICAgICAgICAgICAgZzogMTEsXG4gICAgICAgICAgICBiOiAyMzksXG4gICAgICAgICAgICBhOiAwLjdcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNob3dJbmZvOiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIG5vZGVJZDogZGF0YS5ub2RlSWRcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAvL3N0b3AgaGlnaGxpZ2h0aW5nIGFmdGVyIGNvdXBsZSBvZiBzZWNvbmRzXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlkZUhpZ2hsaWdodCcpO1xuICAgICAgICB9LCAyMDAwKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIGNocm9tZS50dHMuc3BlYWsoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5Ob2RlSW5zcGVjdGlvbkNvbW1hbmQuZGVzY3JpcHRpb24gPSBgU2VsZWN0IERPTSBub2RlcyB3aXRoIFwic2VsZWN0IHhcIiBvciBcImluc3BlY3QgeFwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgdGFnLCBpZCBvciBDU1MgY2xhc3MpLiBJZiBtdWx0aXBsZSBub2RlcyBtYXRjaCwgb25seSB0aGUgZmlyc3Qgb25lIHdpbGwgYmUgc2VsZWN0ZWQuYDtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZUluc3BlY3Rpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBSZWRvQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvcmVkby9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVkb0xhc3RBY3Rpb24odGFiRGVidWdnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVkb0xhc3RBY3Rpb24odGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygncmVkbycpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucmVkbycpO1xuICB9XG59XG5cblJlZG9Db21tYW5kLmRlc2NyaXB0aW9uID0gYFJlZG8gbGFzdCBjb21tYW5kIHdpdGggXCJyZWRvXCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgUmVkb0NvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIFVuZG9Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC91bmRvL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICByZXR1cm4gdGhpcy51bmRvTGFzdEFjdGlvbih0YWJEZWJ1Z2dlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICB1bmRvTGFzdEFjdGlvbih0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCd1bmRvJyk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS51bmRvJyk7XG4gIH1cbn1cblxuVW5kb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgVW5kbyBsYXN0IGNvbW1hbmQgd2l0aCBcInVuZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBVbmRvQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlVGFiKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWV9LCAodGFicykgPT4ge1xuICAgICAgaWYgKHRhYnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUodGFic1swXSk7XG4gICAgfSlcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImNvbnN0IElETEUgPSAxO1xuY29uc3QgUkVDT1JESU5HID0gMjtcblxuY2xhc3MgUmVjb3JkaW5nSWNvbiB7XG4gIGNvbnN0cnVjdCgpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBJRExFO1xuICAgIHRoaXMuX2FuaW1hdGlvbkludGVydmFsID0gbnVsbDtcbiAgfVxuXG4gIHNob3coKSB7XG4gICAgdGhpcy5fc3RhdHVzID0gUkVDT1JESU5HO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIGxldCBhbmltYXRpb24gPSAnIMK3JztcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUZyYW1lKCkge1xuICAgICAgdmFyIGZyYW1lID0gYW5pbWF0aW9uW2kgJSBhbmltYXRpb24ubGVuZ3RoXTtcbiAgICAgIGkrKztcblxuICAgICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHtcbiAgICAgICAgdGV4dDogZnJhbWVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHVwZGF0ZUZyYW1lKCk7XG5cbiAgICB0aGlzLl9hbmltYXRpb25JbnRlcnZhbCA9IHNldEludGVydmFsKHVwZGF0ZUZyYW1lLCAxNTApO1xuICB9XG5cbiAgaGlkZSgpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBJRExFO1xuXG4gICAgaWYgKHRoaXMuX2FuaW1hdGlvbkludGVydmFsKSB7XG4gICAgICBjbGVhckludGVydmFsKHRoaXMuX2FuaW1hdGlvbkludGVydmFsKTtcbiAgICB9XG5cbiAgICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZVRleHQoe1xuICAgICAgdGV4dDogJydcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSZWNvcmRpbmdJY29uOyIsImNsYXNzIExpc3RlbmVyTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9XG5cbiAgbm90aWZ5TGlzdGVuZXJzKGRhdGEpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgbGlzdGVuZXIoZGF0YSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdGVuZXJNYW5hZ2VyOyIsImltcG9ydCBMaXN0ZW5lck1hbmFnZXIgZnJvbSAnLi9saXN0ZW5lci1tYW5hZ2VyLmpzJztcbmNvbnN0IEFDVElWRSA9IDE7XG5jb25zdCBJTkFDVElWRSA9IDI7XG5cbmNsYXNzIFNwZWVjaFJlY29nbml0aW9uIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVjb2duaXRpb24gPSBudWxsO1xuICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuXG4gICAgdGhpcy5vblJlc3VsdCA9IG5ldyBMaXN0ZW5lck1hbmFnZXIoKTtcbiAgICB0aGlzLm9uRW5kID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgdmFyIHJlY29nbml0aW9uID0gbmV3IHdlYmtpdFNwZWVjaFJlY29nbml0aW9uKCk7XG4gICAgcmVjb2duaXRpb24uY29udGludW91cyA9IHRydWU7XG4gICAgLy9yZWNvZ25pdGlvbi5pbnRlcmltUmVzdWx0cyA9IHRydWU7XG5cbiAgICByZWNvZ25pdGlvbi5vbmVuZCA9ICgpID0+IHtcbiAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoKTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24ub25yZXN1bHQgPSAoZXZlbnQpID0+IHtcbiAgICAgIGxldCBpbnRlcmltX3RyYW5zY3JpcHQgPSAnJywgZmluYWxfdHJhbnNjcmlwdCA9ICcnO1xuXG4gICAgICBmb3IgKGxldCBpID0gZXZlbnQucmVzdWx0SW5kZXg7IGkgPCBldmVudC5yZXN1bHRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChldmVudC5yZXN1bHRzW2ldLmlzRmluYWwpIHtcbiAgICAgICAgICBmaW5hbF90cmFuc2NyaXB0ICs9IGV2ZW50LnJlc3VsdHNbaV1bMF0udHJhbnNjcmlwdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbnRlcmltX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdTcGVlY2hSZWNvZ25pdGlvbicsIGZpbmFsX3RyYW5zY3JpcHQpO1xuICAgICAgdGhpcy5vblJlc3VsdC5ub3RpZnlMaXN0ZW5lcnMoZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgfTtcblxuICAgIHJlY29nbml0aW9uLnN0YXJ0KCk7XG5cbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IHJlY29nbml0aW9uO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlY29nbml0aW9uLm9uc3RhcnQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IEFDVElWRTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcmVjb2duaXRpb24ub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBJTkFDVElWRTtcbiAgICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoZXZlbnQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGlzQWN0aXZlKCkge1xuICAgIHJldHVybiB0aGlzLl9zdGF0dXMgPT09IEFDVElWRTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3JlY29nbml0aW9uKSB7XG4gICAgICB0aGlzLl9yZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNwZWVjaFJlY29nbml0aW9uO1xuIiwiaW1wb3J0IExpc3RlbmVyTWFuYWdlciBmcm9tICcuL2xpc3RlbmVyLW1hbmFnZXIuanMnO1xuXG5mdW5jdGlvbiBfYXR0YWNoKHRhYklkKSB7XG4gIHZhciBwcm90b2NvbFZlcnNpb24gPSAnMS4xJztcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5hdHRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgcHJvdG9jb2xWZXJzaW9uLCAoKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX2RldGFjaCh0YWJJZCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5kZXRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgKCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9zZW5kQ29tbWFuZCh0YWJJZCwgY29tbWFuZCwgZGF0YSA9IHt9KSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLnNlbmRDb21tYW5kKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sIGNvbW1hbmQsIGRhdGEsIChyZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgIHJlamVjdChyZXNwb25zZS5lcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5jbGFzcyBUYWJEZWJ1Z2dlciB7XG4gIGNvbnN0cnVjdG9yKHRhYklkKSB7XG4gICAgdGhpcy5fdGFiSWQgPSB0YWJJZDtcbiAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG4gICAgdGhpcy5vbkRpc2Nvbm5lY3QgPSBuZXcgTGlzdGVuZXJNYW5hZ2VyKCk7XG5cbiAgICBjaHJvbWUuZGVidWdnZXIub25EZXRhY2guYWRkTGlzdGVuZXIoKHNvdXJjZSwgcmVhc29uKSA9PiB7XG4gICAgICBpZihzb3VyY2UudGFiSWQgPT09IHRoaXMuX3RhYklkKSB7XG4gICAgICAgIHRoaXMuX2F0dGFjaGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25EaXNjb25uZWN0Lm5vdGlmeUxpc3RlbmVycygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY29ubmVjdCgpIHtcbiAgICByZXR1cm4gX2F0dGFjaCh0aGlzLl90YWJJZCkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLl9hdHRhY2hlZCA9IHRydWU7XG4gICAgfSk7XG4gIH1cblxuICBkaXNjb25uZWN0KCl7XG4gICAgcmV0dXJuIF9kZXRhY2godGhpcy5fdGFiSWQpO1xuICB9XG5cbiAgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2F0dGFjaGVkO1xuICB9XG5cbiAgc2VuZENvbW1hbmQoY29tbWFuZCwgZGF0YSkge1xuICAgIGlmKCF0aGlzLl9hdHRhY2hlZCkge1xuICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gX3NlbmRDb21tYW5kKHRoaXMuX3RhYklkLCBjb21tYW5kLCBkYXRhKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBfc2VuZENvbW1hbmQodGhpcy5fdGFiSWQsIGNvbW1hbmQsIGRhdGEpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRhYkRlYnVnZ2VyOyIsImltcG9ydCBTcGVlY2hSZWNvZ25pdGlvbiBmcm9tICcuL3NwZWVjaC1yZWNvZ25pdGlvbi5qcyc7XG5pbXBvcnQgQ29tbWFuZFJ1bm5lciBmcm9tICcuL2NvbW1hbmQtcnVubmVyLmpzJztcbmltcG9ydCBUYWJEZWJ1Z2dlciBmcm9tICcuL3RhYi1kZWJ1Z2dlci5qcyc7XG5pbXBvcnQge2dldEFjdGl2ZVRhYn0gZnJvbSAnLi9oZWxwZXJzL3RhYnMuanMnO1xuaW1wb3J0IFJlY29yZGluZ0ljb24gZnJvbSAnLi9yZWNvcmRpbmctaWNvbi5qcyc7XG5cbmltcG9ydCBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9ub2RlLWluc3BlY3Rpb24uanMnO1xuaW1wb3J0IE5vZGVEZWxldGlvbkNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzJztcbmltcG9ydCBDU1NDaGFuZ2VDb21tYW5kIGZyb20gJy4vY29tbWFuZHMvY3NzLWNoYW5nZS5qcyc7XG5pbXBvcnQgQ1NTR2V0VmFsdWVDb21tYW5kIGZyb20gJy4vY29tbWFuZHMvY3NzLWdldC12YWx1ZS5qcyc7XG5pbXBvcnQgVW5kb0NvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy91bmRvLmpzJztcbmltcG9ydCBSZWRvQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL3JlZG8uanMnO1xuXG5sZXQgcmVjb3JkaW5nSWNvbiA9IG5ldyBSZWNvcmRpbmdJY29uKCk7XG5sZXQgY29tbWFuZFJ1bm5lciA9IG5ldyBDb21tYW5kUnVubmVyKCk7XG5cbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKE5vZGVJbnNwZWN0aW9uQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChOb2RlRGVsZXRpb25Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKENTU0NoYW5nZUNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoQ1NTR2V0VmFsdWVDb21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKFVuZG9Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKFJlZG9Db21tYW5kKTtcblxubGV0IHNwZWVjaFJlY29nbml0aW9uID0gbmV3IFNwZWVjaFJlY29nbml0aW9uKCk7XG5sZXQgdGFiRGVidWdnZXIgPSBudWxsO1xuXG5zcGVlY2hSZWNvZ25pdGlvbi5vblJlc3VsdC5hZGRMaXN0ZW5lcigodHJhbnNjcmlwdCkgPT4ge1xuICBjb21tYW5kUnVubmVyLnJlY29nbml6ZSh0cmFuc2NyaXB0KTtcbn0pO1xuXG5zcGVlY2hSZWNvZ25pdGlvbi5vbkVuZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmKHRhYkRlYnVnZ2VyICYmIHRhYkRlYnVnZ2VyLmlzQ29ubmVjdGVkKCkpIHtcbiAgICB0YWJEZWJ1Z2dlci5kaXNjb25uZWN0KCk7XG4gIH1cbiAgcmVjb3JkaW5nSWNvbi5oaWRlKCk7XG59KTtcblxuY2hyb21lLmJyb3dzZXJBY3Rpb24ub25DbGlja2VkLmFkZExpc3RlbmVyKCgpID0+IHtcbiAgaWYoc3BlZWNoUmVjb2duaXRpb24uaXNBY3RpdmUoKSkge1xuICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBzcGVlY2hSZWNvZ25pdGlvblxuICAgIC5zdGFydCgpXG4gICAgLnRoZW4oZ2V0QWN0aXZlVGFiKVxuICAgIC50aGVuKCh0YWIpID0+IHtcbiAgICAgIHRhYkRlYnVnZ2VyID0gbmV3IFRhYkRlYnVnZ2VyKHRhYi5pZCk7XG4gICAgICB0YWJEZWJ1Z2dlci5vbkRpc2Nvbm5lY3QuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgICAgICBzcGVlY2hSZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5jb25uZWN0KCk7XG4gICAgfSlcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICByZWNvcmRpbmdJY29uLnNob3coKTtcbiAgICAgIGNvbW1hbmRSdW5uZXIuc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yID09ICdub3QtYWxsb3dlZCcpIHtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub3Blbk9wdGlvbnNQYWdlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmKHNwZWVjaFJlY29nbml0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59KTsiXX0=
