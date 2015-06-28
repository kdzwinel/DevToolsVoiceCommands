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
            return fromCSSValueToText(item.value);
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
var $__scripts_47_text_45_to_45_speech_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/text-to-speech.js";
  var TextToSpeech = function() {
    function TextToSpeech() {}
    return ($traceurRuntime.createClass)(TextToSpeech, {speak: function(text) {
        var options = {enqueue: true};
        if (localStorage.voiceName) {
          options.voiceName = localStorage.voiceName;
        }
        chrome.tts.speak(text, options);
      }}, {});
  }();
  var $__default = TextToSpeech;
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
  var TextToSpeech = ($__scripts_47_text_45_to_45_speech_46_js__).default;
  var textToSpeech = new TextToSpeech();
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
    commandRunner.recognize(transcript).then(function(result) {
      if (result) {
        textToSpeech.speak(result);
      }
    }).catch(function(error) {
      if (error) {
        textToSpeech.speak(error);
      }
    });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC1jb250ZXh0LmpzIiwic2NyaXB0cy9jb21tYW5kLXJ1bm5lci5qcyIsInNjcmlwdHMvY29tbWFuZC5qcyIsInNjcmlwdHMvaGVscGVycy9jc3MuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyIsInNjcmlwdHMvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvY29tbWFuZHMvdW5kby5qcyIsInNjcmlwdHMvaGVscGVycy90YWJzLmpzIiwic2NyaXB0cy9yZWNvcmRpbmctaWNvbi5qcyIsInNjcmlwdHMvbGlzdGVuZXItbWFuYWdlci5qcyIsInNjcmlwdHMvc3BlZWNoLXJlY29nbml0aW9uLmpzIiwic2NyaXB0cy90YWItZGVidWdnZXIuanMiLCJzY3JpcHRzL3RleHQtdG8tc3BlZWNoLmpzIiwic2NyaXB0cy9iYWNrZ3JvdW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsQUFBSSxJQUFBLENBQUEsWUFBVywrQkFBb0IsQ0FBQztJQ0E5QixlQUFhLEVBQW5CLENBQUEsU0FBUyxBQUFEO0FBQVIsV0FBTSxlQUFhLENBQ0wsQUFBRCxDQUFHO0FBQ1osU0FBRyxZQUFZLEVBQUksS0FBRyxDQUFDO0FBQ3ZCLFNBQUcsZUFBZSxFQUFJLEtBQUcsQ0FBQztBQUMxQixTQUFHLHdCQUF3QixFQUFJLEtBQUcsQ0FBQztJQUNyQztBQXlCRixBQTVCVSxTQUFPLENBQUEsQ0FBQyxlQUFjLFlBQVksQ0FBQyxBQUFDO0FBSzVDLHFCQUFlLENBQWYsVUFBaUIsQUFBRCxDQUFHO0FBQ2pCLGFBQU8sQ0FBQSxJQUFHLGVBQWUsQ0FBQztNQUM1QjtBQUVBLHFCQUFlLENBQWYsVUFBaUIsRUFBQyxDQUFHO0FBQ25C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QVcsQ0FBQyxLQUNkLEFBQUMsQ0FBQyxTQUFDLEdBQUU7QUFDUCxnQkFBVSxFQUFJLElBQUksWUFBVSxBQUFDLENBQUMsR0FBRSxHQUFHLENBQUMsQ0FBQztBQUNyQyxnQkFBVSxhQUFhLFlBQVksQUFBQyxDQUFDLFNBQUMsQUFBRCxDQUFNO0FBQ3pDLHdCQUFnQixLQUFLLEFBQUMsRUFBQyxDQUFDO01BQzFCLENBQUMsQ0FBQztBQUNGLFdBQU8sQ0FBQSxXQUFVLFFBQVEsQUFBQyxFQUFDLENBQUM7SUFDOUIsQ0FBQyxLQUNHLEFBQUMsQ0FBQyxTQUFDLEFBQUQsQ0FBTTtBQUNWLGtCQUFZLEtBQUssQUFBQyxFQUFDLENBQUM7QUFDcEIsa0JBQVksZUFBZSxBQUFDLENBQUMsV0FBVSxDQUFDLENBQUM7SUFDM0MsQ0FBQyxNQUFNLEFBQUMsQ0FBQyxTQUFDLEtBQUksQ0FBTTtBQUNsQixTQUFJLEtBQUksR0FBSyxjQUFZLENBQUc7QUFDMUIsYUFBSyxRQUFRLGdCQUFnQixBQUFDLEVBQUMsQ0FBQztNQUNsQztBQUFBLEFBRUEsU0FBSSxpQkFBZ0IsU0FBUyxBQUFDLEVBQUMsQ0FBRztBQUNoQyx3QkFBZ0IsS0FBSyxBQUFDLEVBQUMsQ0FBQztNQUMxQjtBQUFBLEFBRUEsWUFBTSxJQUFJLEFBQUMsQ0FBQyxLQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDLENBQUM7RUFDTixDQUFDLENBQUM7QUE3RUYsV0FBdUIiLCJmaWxlIjoiL1VzZXJzL2tkendpbmVsL1Byb2plY3RzL09TL0RldlRvb2xzVm9pY2VDb21tYW5kcy90ZW1wb3V0TUM0d016UXdNelUxTURrMk9EVXdOVFEwTWdyZWRyZWQuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsImNsYXNzIENvbW1hbmRDb250ZXh0IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcm9vdE5vZGVJZCA9IG51bGw7XG4gICAgdGhpcy5fY29udGV4dE5vZGVJZCA9IG51bGw7XG4gICAgdGhpcy5fY29udGV4dENTU1Byb3BlcnR5TmFtZSA9IG51bGw7XG4gIH1cblxuICBnZXRDb250ZXh0Tm9kZUlkKCkge1xuICAgIHJldHVybiB0aGlzLl9jb250ZXh0Tm9kZUlkO1xuICB9XG5cbiAgc2V0Q29udGV4dE5vZGVJZChpZCkge1xuICAgIHRoaXMuX2NvbnRleHROb2RlSWQgPSBpZDtcbiAgfVxuXG4gIHNldFJvb3ROb2RlSWQoaWQpIHtcbiAgICB0aGlzLl9yb290Tm9kZUlkID0gaWQ7XG4gIH1cblxuICBnZXRSb290Tm9kZUlkKCkge1xuICAgIHJldHVybiB0aGlzLl9yb290Tm9kZUlkO1xuICB9XG5cbiAgc2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZShuYW1lKSB7XG4gICAgdGhpcy5fY29udGV4dENTU1Byb3BlcnR5TmFtZSA9IG5hbWU7XG4gIH1cblxuICBnZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKCkge1xuICAgIHJldHVybiB0aGlzLl9jb250ZXh0Q1NTUHJvcGVydHlOYW1lO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmRDb250ZXh0OyIsImltcG9ydCBDb21tYW5kQ29udGV4dCBmcm9tICcuL2NvbW1hbmQtY29udGV4dC5qcyc7XG5cbmNsYXNzIENvbW1hbmRSdW5uZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl90YWJEZWJ1Z2dlciA9IG51bGw7XG4gICAgdGhpcy5fY29tbWFuZENvbnRleHQgPSBuZXcgQ29tbWFuZENvbnRleHQoKTtcbiAgICB0aGlzLl9jb21tYW5kcyA9IG5ldyBTZXQoKTtcbiAgfVxuXG4gIHNldFRhYkRlYnVnZ2VyKHRhYkRlYnVnZ2VyKSB7XG4gICAgdGhpcy5fdGFiRGVidWdnZXIgPSB0YWJEZWJ1Z2dlcjtcblxuICAgIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uZW5hYmxlJylcbiAgICAgIC50aGVuKHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kLmJpbmQodGFiRGVidWdnZXIsICdDU1MuZW5hYmxlJykpXG4gICAgICAudGhlbih0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZC5iaW5kKHRhYkRlYnVnZ2VyLCAnRE9NLmdldERvY3VtZW50JykpXG4gICAgICAudGhlbigoZGF0YSkgPT4ge1xuICAgICAgICBpZighZGF0YS5yb290KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEb2N1bWVudCByb290IG5vdCBhdmFpbGFibGUuJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9jb21tYW5kQ29udGV4dC5zZXRSb290Tm9kZUlkKGRhdGEucm9vdC5ub2RlSWQpO1xuICAgICAgfSk7XG4gIH1cblxuICByZWdpc3RlckNvbW1hbmQoY29tbWFuZFR5cGUpIHtcbiAgICB0aGlzLl9jb21tYW5kcy5hZGQobmV3IGNvbW1hbmRUeXBlKCkpO1xuICB9XG5cbiAgcmVjb2duaXplKHRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IFtdO1xuXG4gICAgLy9maWd1cmUgb3V0IHRoZSBvcmRlciBpbiB3aGljaCBjb21tYW5kcyBzaG91bGQgYmUgY2FsbGVkIChtdXN0IGJlIHRoZSBzYW1lIGFzIGluIHRoZSB0ZXh0KVxuICAgIHRoaXMuX2NvbW1hbmRzLmZvckVhY2goKGNvbW1hbmQpID0+IHtcbiAgICAgIGxldCBwb3NpdGlvbiA9IGNvbW1hbmQubWF0Y2godGV4dCk7XG5cbiAgICAgIGlmKHBvc2l0aW9uICE9PSAtMSkge1xuICAgICAgICBtYXRjaGVzLnB1c2goe1xuICAgICAgICAgIHBvc2l0aW9uLFxuICAgICAgICAgIGNvbW1hbmRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBsZXQgdGFiRGVidWdnZXIgPSB0aGlzLl90YWJEZWJ1Z2dlcjtcbiAgICBsZXQgY29tbWFuZENvbnRleHQgPSB0aGlzLl9jb21tYW5kQ29udGV4dDtcblxuICAgIHJldHVybiBtYXRjaGVzXG4gICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICByZXR1cm4gYS5wb3NpdGlvbiAtIGIucG9zaXRpb247XG4gICAgICB9KVxuICAgICAgLy9jYWxsIG5leHQgY29tbWFuZCBvbmx5IGFmdGVyIHByZXZpb3VzIG9uZSBoYXMgZmluaXNoZWRcbiAgICAgIC5yZWR1Y2UoKHByb21pc2UsIHtjb21tYW5kfSkgPT4ge1xuICAgICAgICBpZighcHJvbWlzZSkge1xuICAgICAgICAgIHJldHVybiBjb21tYW5kLmV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBuZXh0Q29tbWFuZCA9IGNvbW1hbmQuZXhlY3V0ZS5iaW5kKGNvbW1hbmQsIHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCk7XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihuZXh0Q29tbWFuZCk7XG4gICAgICB9LCBudWxsKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmRSdW5uZXI7IiwiY2xhc3MgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3JlZ2V4ID0gL14kL2k7XG4gIH1cblxuICBtYXRjaCh0ZXh0KSB7XG4gICAgcmV0dXJuIHRleHQuc2VhcmNoKHRoaXMuX3JlZ2V4KTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG5cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21tYW5kOyIsImV4cG9ydCBmdW5jdGlvbiB0b0NTU1Byb3BlcnR5KHRleHQpIHtcbiAgcmV0dXJuIHRleHQudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCcgJywgJy0nKTtcbn1cblxubGV0IGNzc1VuaXRzID0ge1xuICBwaXhlbDogJ3B4JyxcbiAgcGl4ZWxzOiAncHgnLFxuICBlbTogJ2VtJyxcbiAgZW1zOiAnZW0nLFxuICBwZXJjZW50OiAnJSdcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB0b0NTU1ZhbHVlKHZhbHVlLCB1bml0KSB7XG4gIGlmICh1bml0KSB7XG4gICAgcmV0dXJuIHZhbHVlICsgY3NzVW5pdHNbdW5pdF07XG4gIH1cblxuICByZXR1cm4gdmFsdWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tQ1NTVmFsdWVUb1RleHQoY3NzVmFsdWUpIHtcbiAgbGV0IG1hdGNoZXMgPSBjc3NWYWx1ZS5tYXRjaCgvKFswLTkuXSspcHgvaSk7XG5cbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBsZXQgbnVtVmFsdWUgPSBtYXRjaGVzWzFdO1xuXG4gICAgcmV0dXJuIChudW1WYWx1ZSA9PT0gMSkgPyAnb25lIHBpeGVsJyA6IG51bVZhbHVlICsgJyBwaXhlbHMnO1xuICB9XG5cbiAgcmV0dXJuIGNzc1ZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCB7fTsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcbmltcG9ydCB7dG9DU1NQcm9wZXJ0eSwgdG9DU1NWYWx1ZX0gZnJvbSAnLi4vaGVscGVycy9jc3MuanMnO1xuXG5jbGFzcyBDU1NDaGFuZ2VDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oY2hhbmdlfHNldCkgKGl0cyApPyhcXHcrKCBcXHcrKT8pIHRvIChcXHcrKSA/KHBpeGVsfHBpeGVsc3xwZXJjZW50fGVtfGVtcyk/L2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICBsZXQgcHJvcGVydHkgPSB0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pO1xuICAgICAgbGV0IHZhbHVlID0gdG9DU1NWYWx1ZShtYXRjaGVzWzVdLCBtYXRjaGVzWzZdKTtcblxuICAgICAgaWYobWF0Y2hlc1szXSA9PT0gJ2l0Jykge1xuICAgICAgICBwcm9wZXJ0eSA9IGNvbW1hbmRDb250ZXh0LmdldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUoKTtcbiAgICAgIH1cblxuICAgICAgY29tbWFuZENvbnRleHQuc2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZShwcm9wZXJ0eSk7XG5cbiAgICAgIGxldCBjc3MgPSAnOycgKyBwcm9wZXJ0eSArICc6ICcgKyB2YWx1ZSArICc7JztcbiAgICAgIHJldHVybiB0aGlzLmFwcGVuZFRvU3R5bGVzKGNvbW1hbmRDb250ZXh0LmdldENvbnRleHROb2RlSWQoKSwgY3NzLCB0YWJEZWJ1Z2dlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRUb1N0eWxlcyhub2RlSWQsIHRleHQsIHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ0NTU0NoYW5nZUNvbW1hbmQnLCBub2RlSWQsIHRleHQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbnRleHQuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uZ2V0QXR0cmlidXRlcycsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGxldCBvbGRTdHlsZVZhbHVlID0gJyc7XG5cbiAgICAgIGlmKGRhdGEuYXR0cmlidXRlcyAmJiBkYXRhLmF0dHJpYnV0ZXMuaW5kZXhPZignc3R5bGUnKSAhPT0gLTEpIHtcbiAgICAgICAgbGV0IGlkeE9mU3R5bGUgPSBkYXRhLmF0dHJpYnV0ZXMuaW5kZXhPZignc3R5bGUnKTtcbiAgICAgICAgb2xkU3R5bGVWYWx1ZSA9IGRhdGEuYXR0cmlidXRlc1tpZHhPZlN0eWxlICsgMV07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnNldEF0dHJpYnV0ZVZhbHVlJywge1xuICAgICAgICBub2RlSWQsXG4gICAgICAgIG5hbWU6ICdzdHlsZScsXG4gICAgICAgIHZhbHVlOiBvbGRTdHlsZVZhbHVlICsgdGV4dFxuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5DU1NDaGFuZ2VDb21tYW5kLmRlc2NyaXB0aW9uID0gYENoYW5nZSBDU1MgcHJvcGVydHkgdmFsdWUgb2YgY3VycmVudGx5IGluc3BlY3RlZCBub2RlIGJ5IHNheWluZyBcImNoYW5nZSBpdHMgeCB0byB5XCIgb3IgXCJzZXQgaXRzIHggdG8geVwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5IGFuZCBcInlcIiBpcyB0aGUgbmV3IHZhbHVlKS5gO1xuXG5leHBvcnQgZGVmYXVsdCBDU1NDaGFuZ2VDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCBmcm9tQ1NTVmFsdWVUb1RleHR9IGZyb20gJy4uL2hlbHBlcnMvY3NzLmpzJztcblxuY2xhc3MgQ1NTR2V0VmFsdWVDb21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8od2hhdCdzfHdoYXQgaXN8Z2V0KSggaXRzKT8gKFxcdysoIFxcdyspPykvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBwcm9wZXJ0eSA9IHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSk7XG5cbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUocHJvcGVydHkpO1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcHV0ZWRWYWx1ZShwcm9wZXJ0eSwgY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dE5vZGVJZCgpLCB0YWJEZWJ1Z2dlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb21wdXRlZFZhbHVlKHByb3BlcnR5LCBub2RlSWQsIHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ0NTU0dldFZhbHVlQ29tbWFuZCcsIHByb3BlcnR5LCBub2RlSWQpO1xuXG4gICAgaWYoIW5vZGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvbnRleHQuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdDU1MuZ2V0Q29tcHV0ZWRTdHlsZUZvck5vZGUnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgaXRlbSA9IGRhdGEuY29tcHV0ZWRTdHlsZS5maW5kKChpdGVtKSA9PiB7XG4gICAgICAgIHJldHVybiBpdGVtLm5hbWUgPT09IHByb3BlcnR5O1xuICAgICAgfSk7XG5cbiAgICAgIGlmKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGZyb21DU1NWYWx1ZVRvVGV4dChpdGVtLnZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnUHJvcGVydHkgJyArIHByb3BlcnR5ICsgJyBub3QgZm91bmQuJztcbiAgICAgIH1cbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbkNTU0dldFZhbHVlQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBHZXQgY29tcHV0ZWQgQ1NTIHByb3BlcnR5IHZhbHVlIG9mIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSBieSBzYXlpbmcgXCJnZXQgaXRzIHhcIiBvciBcIndoYXQncyBpdHMgeFwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5KS5gO1xuXG5leHBvcnQgZGVmYXVsdCBDU1NHZXRWYWx1ZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIE5vZGVEZWxldGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhkZWxldGV8cmVtb3ZlKSBpdC9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTm9kZShjb21tYW5kQ29udGV4dC5nZXRDb250ZXh0Tm9kZUlkKCksIHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbW92ZU5vZGUobm9kZUlkLCB0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdOb2RlRGVsZXRpb25Db21tYW5kJywgbm9kZUlkKTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb250ZXh0LicpO1xuICAgIH1cblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnJlbW92ZU5vZGUnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbk5vZGVEZWxldGlvbkNvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVtb3ZlIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSB3aXRoIFwicmVtb3ZlIGl0XCIgb3IgXCJkZWxldGUgaXRcIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlRGVsZXRpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jb25zdCBISUdITElHSFRfQ09MT1IgPSB7XG4gIHI6IDE1NSxcbiAgZzogMTEsXG4gIGI6IDIzOSxcbiAgYTogMC43XG59O1xuY29uc3QgSElHSExJR0hUX1RJTUVPVVQgPSAyMDAwO1xuXG5jbGFzcyBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhzZWxlY3R8aW5zcGVjdCkgKFxcdyspL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZiAobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0Tm9kZShtYXRjaGVzWzJdICsgJywgIycgKyBtYXRjaGVzWzJdICsgJywgLicgKyBtYXRjaGVzWzJdLCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgc2VsZWN0Tm9kZShzZWxlY3RvciwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgY29uc29sZS5sb2coJ05vZGVJbnNwZWN0aW9uQ29tbWFuZCcsIHNlbGVjdG9yKTtcblxuICAgIGxldCByb290Tm9kZUlkID0gY29tbWFuZENvbnRleHQuZ2V0Um9vdE5vZGVJZCgpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucXVlcnlTZWxlY3RvcicsIHtcbiAgICAgIG5vZGVJZDogcm9vdE5vZGVJZCxcbiAgICAgIHNlbGVjdG9yXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgY29tbWFuZENvbnRleHQuc2V0Q29udGV4dE5vZGVJZChkYXRhLm5vZGVJZCk7XG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKG51bGwpO1xuXG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWdobGlnaHROb2RlJywge1xuICAgICAgICBoaWdobGlnaHRDb25maWc6IHtcbiAgICAgICAgICBjb250ZW50Q29sb3I6IEhJR0hMSUdIVF9DT0xPUixcbiAgICAgICAgICBzaG93SW5mbzogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBub2RlSWQ6IGRhdGEubm9kZUlkXG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy9zdG9wIGhpZ2hsaWdodGluZyBhZnRlciBjb3VwbGUgb2Ygc2Vjb25kc1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmhpZGVIaWdobGlnaHQnKTtcbiAgICAgICAgfSwgSElHSExJR0hUX1RJTUVPVVQpO1xuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5Ob2RlSW5zcGVjdGlvbkNvbW1hbmQuZGVzY3JpcHRpb24gPSBgU2VsZWN0IERPTSBub2RlcyB3aXRoIFwic2VsZWN0IHhcIiBvciBcImluc3BlY3QgeFwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgdGFnLCBpZCBvciBDU1MgY2xhc3MpLiBJZiBtdWx0aXBsZSBub2RlcyBtYXRjaCwgb25seSB0aGUgZmlyc3Qgb25lIHdpbGwgYmUgc2VsZWN0ZWQuYDtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZUluc3BlY3Rpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBSZWRvQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvcmVkby9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVkb0xhc3RBY3Rpb24odGFiRGVidWdnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVkb0xhc3RBY3Rpb24odGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnUmVkb0NvbW1hbmQnKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnJlZG8nKTtcbiAgfVxufVxuXG5SZWRvQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBSZWRvIGxhc3QgY29tbWFuZCB3aXRoIFwicmVkb1wiLmA7XG5cbmV4cG9ydCBkZWZhdWx0IFJlZG9Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBVbmRvQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvdW5kby9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMudW5kb0xhc3RBY3Rpb24odGFiRGVidWdnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgdW5kb0xhc3RBY3Rpb24odGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnVW5kb0NvbW1hbmQnKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnVuZG8nKTtcbiAgfVxufVxuXG5VbmRvQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBVbmRvIGxhc3QgY29tbWFuZCB3aXRoIFwidW5kb1wiLmA7XG5cbmV4cG9ydCBkZWZhdWx0IFVuZG9Db21tYW5kOyIsImV4cG9ydCBmdW5jdGlvbiBnZXRBY3RpdmVUYWIoKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLnRhYnMucXVlcnkoe2FjdGl2ZTogdHJ1ZX0sICh0YWJzKSA9PiB7XG4gICAgICBpZiAodGFicy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSh0YWJzWzBdKTtcbiAgICB9KVxuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge307IiwiY29uc3QgSURMRSA9IDE7XG5jb25zdCBSRUNPUkRJTkcgPSAyO1xuXG5jbGFzcyBSZWNvcmRpbmdJY29uIHtcbiAgY29uc3RydWN0KCkge1xuICAgIHRoaXMuX3N0YXR1cyA9IElETEU7XG4gICAgdGhpcy5fYW5pbWF0aW9uSW50ZXJ2YWwgPSBudWxsO1xuICB9XG5cbiAgc2hvdygpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBSRUNPUkRJTkc7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgbGV0IGFuaW1hdGlvbiA9ICcgwrcnO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlRnJhbWUoKSB7XG4gICAgICB2YXIgZnJhbWUgPSBhbmltYXRpb25baSAlIGFuaW1hdGlvbi5sZW5ndGhdO1xuICAgICAgaSsrO1xuXG4gICAgICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZVRleHQoe1xuICAgICAgICB0ZXh0OiBmcmFtZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdXBkYXRlRnJhbWUoKTtcblxuICAgIHRoaXMuX2FuaW1hdGlvbkludGVydmFsID0gc2V0SW50ZXJ2YWwodXBkYXRlRnJhbWUsIDE1MCk7XG4gIH1cblxuICBoaWRlKCkge1xuICAgIHRoaXMuX3N0YXR1cyA9IElETEU7XG5cbiAgICBpZiAodGhpcy5fYW5pbWF0aW9uSW50ZXJ2YWwpIHtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fYW5pbWF0aW9uSW50ZXJ2YWwpO1xuICAgIH1cblxuICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgICB0ZXh0OiAnJ1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlY29yZGluZ0ljb247IiwiY2xhc3MgTGlzdGVuZXJNYW5hZ2VyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gIH1cblxuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLicpO1xuICAgIH1cblxuICAgIHRoaXMubGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gIH1cblxuICBub3RpZnlMaXN0ZW5lcnMoZGF0YSkge1xuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICBsaXN0ZW5lcihkYXRhKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0ZW5lck1hbmFnZXI7IiwiaW1wb3J0IExpc3RlbmVyTWFuYWdlciBmcm9tICcuL2xpc3RlbmVyLW1hbmFnZXIuanMnO1xuY29uc3QgQUNUSVZFID0gMTtcbmNvbnN0IElOQUNUSVZFID0gMjtcblxuY2xhc3MgU3BlZWNoUmVjb2duaXRpb24ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IG51bGw7XG4gICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG5cbiAgICB0aGlzLm9uUmVzdWx0ID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICAgIHRoaXMub25FbmQgPSBuZXcgTGlzdGVuZXJNYW5hZ2VyKCk7XG4gIH1cblxuICBzdGFydCgpIHtcbiAgICB2YXIgcmVjb2duaXRpb24gPSBuZXcgd2Via2l0U3BlZWNoUmVjb2duaXRpb24oKTtcbiAgICByZWNvZ25pdGlvbi5jb250aW51b3VzID0gdHJ1ZTtcbiAgICAvL3JlY29nbml0aW9uLmludGVyaW1SZXN1bHRzID0gdHJ1ZTtcblxuICAgIHJlY29nbml0aW9uLm9uZW5kID0gKCkgPT4ge1xuICAgICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG4gICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycygpO1xuICAgIH07XG5cbiAgICByZWNvZ25pdGlvbi5vbnJlc3VsdCA9IChldmVudCkgPT4ge1xuICAgICAgbGV0IGludGVyaW1fdHJhbnNjcmlwdCA9ICcnLCBmaW5hbF90cmFuc2NyaXB0ID0gJyc7XG5cbiAgICAgIGZvciAobGV0IGkgPSBldmVudC5yZXN1bHRJbmRleDsgaSA8IGV2ZW50LnJlc3VsdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKGV2ZW50LnJlc3VsdHNbaV0uaXNGaW5hbCkge1xuICAgICAgICAgIGZpbmFsX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGludGVyaW1fdHJhbnNjcmlwdCArPSBldmVudC5yZXN1bHRzW2ldWzBdLnRyYW5zY3JpcHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ1NwZWVjaFJlY29nbml0aW9uJywgZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgICB0aGlzLm9uUmVzdWx0Lm5vdGlmeUxpc3RlbmVycyhmaW5hbF90cmFuc2NyaXB0KTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24uc3RhcnQoKTtcblxuICAgIHRoaXMuX3JlY29nbml0aW9uID0gcmVjb2duaXRpb247XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVjb2duaXRpb24ub25zdGFydCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gQUNUSVZFO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9O1xuXG4gICAgICByZWNvZ25pdGlvbi5vbmVycm9yID0gKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgICB0aGlzLm9uRW5kLm5vdGlmeUxpc3RlbmVycyhldmVudC5lcnJvcik7XG4gICAgICAgIHJlamVjdChldmVudC5lcnJvcik7XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgaXNBY3RpdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gQUNUSVZFO1xuICB9XG5cbiAgc3RvcCgpIHtcbiAgICBpZiAodGhpcy5fcmVjb2duaXRpb24pIHtcbiAgICAgIHRoaXMuX3JlY29nbml0aW9uLnN0b3AoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU3BlZWNoUmVjb2duaXRpb247XG4iLCJpbXBvcnQgTGlzdGVuZXJNYW5hZ2VyIGZyb20gJy4vbGlzdGVuZXItbWFuYWdlci5qcyc7XG5cbmZ1bmN0aW9uIF9hdHRhY2godGFiSWQpIHtcbiAgdmFyIHByb3RvY29sVmVyc2lvbiA9ICcxLjEnO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLmF0dGFjaCh7XG4gICAgICB0YWJJZDogdGFiSWRcbiAgICB9LCBwcm90b2NvbFZlcnNpb24sICgpID0+IHtcbiAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfZGV0YWNoKHRhYklkKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLmRldGFjaCh7XG4gICAgICB0YWJJZDogdGFiSWRcbiAgICB9LCAoKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX3NlbmRDb21tYW5kKHRhYklkLCBjb21tYW5kLCBkYXRhID0ge30pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUuZGVidWdnZXIuc2VuZENvbW1hbmQoe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgY29tbWFuZCwgZGF0YSwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KHJlc3BvbnNlLmVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmNsYXNzIFRhYkRlYnVnZ2VyIHtcbiAgY29uc3RydWN0b3IodGFiSWQpIHtcbiAgICB0aGlzLl90YWJJZCA9IHRhYklkO1xuICAgIHRoaXMuX2F0dGFjaGVkID0gdHJ1ZTtcbiAgICB0aGlzLm9uRGlzY29ubmVjdCA9IG5ldyBMaXN0ZW5lck1hbmFnZXIoKTtcblxuICAgIGNocm9tZS5kZWJ1Z2dlci5vbkRldGFjaC5hZGRMaXN0ZW5lcigoc291cmNlLCByZWFzb24pID0+IHtcbiAgICAgIGlmKHNvdXJjZS50YWJJZCA9PT0gdGhpcy5fdGFiSWQpIHtcbiAgICAgICAgdGhpcy5fYXR0YWNoZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3Qubm90aWZ5TGlzdGVuZXJzKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIHJldHVybiBfYXR0YWNoKHRoaXMuX3RhYklkKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkID0gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3QoKXtcbiAgICByZXR1cm4gX2RldGFjaCh0aGlzLl90YWJJZCk7XG4gIH1cblxuICBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNoZWQ7XG4gIH1cblxuICBzZW5kQ29tbWFuZChjb21tYW5kLCBkYXRhKSB7XG4gICAgaWYoIXRoaXMuX2F0dGFjaGVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25uZWN0KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBfc2VuZENvbW1hbmQodGhpcy5fdGFiSWQsIGNvbW1hbmQsIGRhdGEpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9zZW5kQ29tbWFuZCh0aGlzLl90YWJJZCwgY29tbWFuZCwgZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGFiRGVidWdnZXI7IiwiY2xhc3MgVGV4dFRvU3BlZWNoIHtcbiAgc3BlYWsodGV4dCkge1xuICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgZW5xdWV1ZTogdHJ1ZVxuICAgIH07XG5cbiAgICBpZihsb2NhbFN0b3JhZ2Uudm9pY2VOYW1lKSB7XG4gICAgICBvcHRpb25zLnZvaWNlTmFtZSA9IGxvY2FsU3RvcmFnZS52b2ljZU5hbWU7XG4gICAgfVxuXG4gICAgY2hyb21lLnR0cy5zcGVhayh0ZXh0LCBvcHRpb25zKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUZXh0VG9TcGVlY2g7IiwiaW1wb3J0IFNwZWVjaFJlY29nbml0aW9uIGZyb20gJy4vc3BlZWNoLXJlY29nbml0aW9uLmpzJztcbmltcG9ydCBDb21tYW5kUnVubmVyIGZyb20gJy4vY29tbWFuZC1ydW5uZXIuanMnO1xuaW1wb3J0IFRhYkRlYnVnZ2VyIGZyb20gJy4vdGFiLWRlYnVnZ2VyLmpzJztcbmltcG9ydCB7Z2V0QWN0aXZlVGFifSBmcm9tICcuL2hlbHBlcnMvdGFicy5qcyc7XG5pbXBvcnQgUmVjb3JkaW5nSWNvbiBmcm9tICcuL3JlY29yZGluZy1pY29uLmpzJztcblxuaW1wb3J0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyc7XG5pbXBvcnQgTm9kZURlbGV0aW9uQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMnO1xuaW1wb3J0IENTU0NoYW5nZUNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9jc3MtY2hhbmdlLmpzJztcbmltcG9ydCBDU1NHZXRWYWx1ZUNvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzJztcbmltcG9ydCBVbmRvQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL3VuZG8uanMnO1xuaW1wb3J0IFJlZG9Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvcmVkby5qcyc7XG5pbXBvcnQgVGV4dFRvU3BlZWNoIGZyb20gJy4vdGV4dC10by1zcGVlY2guanMnO1xuXG5sZXQgdGV4dFRvU3BlZWNoID0gbmV3IFRleHRUb1NwZWVjaCgpO1xubGV0IHJlY29yZGluZ0ljb24gPSBuZXcgUmVjb3JkaW5nSWNvbigpO1xubGV0IGNvbW1hbmRSdW5uZXIgPSBuZXcgQ29tbWFuZFJ1bm5lcigpO1xuXG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChOb2RlSW5zcGVjdGlvbkNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoTm9kZURlbGV0aW9uQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChDU1NDaGFuZ2VDb21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKENTU0dldFZhbHVlQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChVbmRvQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChSZWRvQ29tbWFuZCk7XG5cbmxldCBzcGVlY2hSZWNvZ25pdGlvbiA9IG5ldyBTcGVlY2hSZWNvZ25pdGlvbigpO1xubGV0IHRhYkRlYnVnZ2VyID0gbnVsbDtcblxuc3BlZWNoUmVjb2duaXRpb24ub25SZXN1bHQuYWRkTGlzdGVuZXIoKHRyYW5zY3JpcHQpID0+IHtcbiAgY29tbWFuZFJ1bm5lci5yZWNvZ25pemUodHJhbnNjcmlwdCkudGhlbigocmVzdWx0KSA9PiB7XG4gICAgaWYgKHJlc3VsdCkge1xuICAgICAgdGV4dFRvU3BlZWNoLnNwZWFrKHJlc3VsdCk7XG4gICAgfVxuICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICBpZiAoZXJyb3IpIHtcbiAgICAgIHRleHRUb1NwZWVjaC5zcGVhayhlcnJvcik7XG4gICAgfVxuICB9KTtcbn0pO1xuXG5zcGVlY2hSZWNvZ25pdGlvbi5vbkVuZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmICh0YWJEZWJ1Z2dlciAmJiB0YWJEZWJ1Z2dlci5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgdGFiRGVidWdnZXIuZGlzY29ubmVjdCgpO1xuICB9XG4gIHJlY29yZGluZ0ljb24uaGlkZSgpO1xufSk7XG5cbmNocm9tZS5icm93c2VyQWN0aW9uLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmIChzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHNwZWVjaFJlY29nbml0aW9uXG4gICAgLnN0YXJ0KClcbiAgICAudGhlbihnZXRBY3RpdmVUYWIpXG4gICAgLnRoZW4oKHRhYikgPT4ge1xuICAgICAgdGFiRGVidWdnZXIgPSBuZXcgVGFiRGVidWdnZXIodGFiLmlkKTtcbiAgICAgIHRhYkRlYnVnZ2VyLm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLmNvbm5lY3QoKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJlY29yZGluZ0ljb24uc2hvdygpO1xuICAgICAgY29tbWFuZFJ1bm5lci5zZXRUYWJEZWJ1Z2dlcih0YWJEZWJ1Z2dlcik7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IgPT0gJ25vdC1hbGxvd2VkJykge1xuICAgICAgICBjaHJvbWUucnVudGltZS5vcGVuT3B0aW9uc1BhZ2UoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNwZWVjaFJlY29nbml0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59KTsiXX0=
