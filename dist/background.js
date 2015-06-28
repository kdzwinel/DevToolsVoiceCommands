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
        var dummyPromise = new Promise(function(resolve, reject) {
          resolve();
        });
        return matches.sort(function(a, b) {
          return a.position - b.position;
        }).reduce(function(promise, $__3) {
          var command = $__3.command;
          var nextCommand = command.execute.bind(command, text, tabDebugger, commandContext);
          return promise.then(nextCommand);
        }, dummyPromise);
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
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
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
        var options = {
          enqueue: true,
          voiceName: localStorage.getItem('voiceName')
        };
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
  var TextToSpeech = ($__scripts_47_text_45_to_45_speech_46_js__).default;
  var NodeInspectionCommand = ($__scripts_47_commands_47_node_45_inspection_46_js__).default;
  var NodeDeletionCommand = ($__scripts_47_commands_47_node_45_deletion_46_js__).default;
  var CSSChangeCommand = ($__scripts_47_commands_47_css_45_change_46_js__).default;
  var CSSGetValueCommand = ($__scripts_47_commands_47_css_45_get_45_value_46_js__).default;
  var UndoCommand = ($__scripts_47_commands_47_undo_46_js__).default;
  var RedoCommand = ($__scripts_47_commands_47_redo_46_js__).default;
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
      if (result && typeof result === 'string') {
        textToSpeech.speak(result);
      }
    }).catch(function(error) {
      if (error) {
        textToSpeech.speak(error.message);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvY29tbWFuZC1jb250ZXh0LmpzIiwic2NyaXB0cy9jb21tYW5kLXJ1bm5lci5qcyIsInNjcmlwdHMvY29tbWFuZC5qcyIsInNjcmlwdHMvaGVscGVycy9jc3MuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMiLCJzY3JpcHRzL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMiLCJzY3JpcHRzL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyIsInNjcmlwdHMvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvY29tbWFuZHMvdW5kby5qcyIsInNjcmlwdHMvaGVscGVycy90YWJzLmpzIiwic2NyaXB0cy9yZWNvcmRpbmctaWNvbi5qcyIsInNjcmlwdHMvbGlzdGVuZXItbWFuYWdlci5qcyIsInNjcmlwdHMvc3BlZWNoLXJlY29nbml0aW9uLmpzIiwic2NyaXB0cy90YWItZGVidWdnZXIuanMiLCJzY3JpcHRzL3RleHQtdG8tc3BlZWNoLmpzIiwic2NyaXB0cy9iYWNrZ3JvdW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsQUFBSSxJQUFBLENBQUEsWUFBVywrQkFBb0IsQ0FBQztJQ0E5QixlQUFhLEVBQW5CLENBQUEsU0FBUyxBQUFEO0FBQVIsV0FBTSxlQUFhLENBQ0wsQUFBRCxDQUFHO0FBQ1osU0FBRyxZQUFZLEVBQUksS0FBRyxDQUFDO0FBQ3ZCLFNBQUcsZUFBZSxFQUFJLEtBQUcsQ0FBQztBQUMxQixTQUFHLHdCQUF3QixFQUFJLEtBQUcsQ0FBQztJQUNyQztBQXlCRixBQTVCVSxTQUFPLENBQUEsQ0FBQyxlQUFjLFlBQVksQ0FBQyxBQUFDO0FBSzVDLHFCQUFlLENBQWYsVUFBaUIsQUFBRCxDQUFHO0FBQ2pCLGFBQU8sQ0FBQSxJQUFHLGVBQWUsQ0FBQztNQUM1QjtBQUVBLHFCQUFlLENBQWYsVUFBaUIsRUFBQyxDQUFHO0FBQ25C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ZXJzL2tkendpbmVsL1Byb2plY3RzL09TL0RldlRvb2xzVm9pY2VDb21tYW5kcy90ZW1wb3V0TUM0Mk9ERTFOamd5TWpBM01qTTBNakEwLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLCJjbGFzcyBDb21tYW5kQ29udGV4dCB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3Jvb3ROb2RlSWQgPSBudWxsO1xuICAgIHRoaXMuX2NvbnRleHROb2RlSWQgPSBudWxsO1xuICAgIHRoaXMuX2NvbnRleHRDU1NQcm9wZXJ0eU5hbWUgPSBudWxsO1xuICB9XG5cbiAgZ2V0Q29udGV4dE5vZGVJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29udGV4dE5vZGVJZDtcbiAgfVxuXG4gIHNldENvbnRleHROb2RlSWQoaWQpIHtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gaWQ7XG4gIH1cblxuICBzZXRSb290Tm9kZUlkKGlkKSB7XG4gICAgdGhpcy5fcm9vdE5vZGVJZCA9IGlkO1xuICB9XG5cbiAgZ2V0Um9vdE5vZGVJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fcm9vdE5vZGVJZDtcbiAgfVxuXG4gIHNldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUobmFtZSkge1xuICAgIHRoaXMuX2NvbnRleHRDU1NQcm9wZXJ0eU5hbWUgPSBuYW1lO1xuICB9XG5cbiAgZ2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29udGV4dENTU1Byb3BlcnR5TmFtZTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21tYW5kQ29udGV4dDsiLCJpbXBvcnQgQ29tbWFuZENvbnRleHQgZnJvbSAnLi9jb21tYW5kLWNvbnRleHQuanMnO1xuXG5jbGFzcyBDb21tYW5kUnVubmVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fdGFiRGVidWdnZXIgPSBudWxsO1xuICAgIHRoaXMuX2NvbW1hbmRDb250ZXh0ID0gbmV3IENvbW1hbmRDb250ZXh0KCk7XG4gICAgdGhpcy5fY29tbWFuZHMgPSBuZXcgU2V0KCk7XG4gIH1cblxuICBzZXRUYWJEZWJ1Z2dlcih0YWJEZWJ1Z2dlcikge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gdGFiRGVidWdnZXI7XG5cbiAgICB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmVuYWJsZScpXG4gICAgICAudGhlbih0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZC5iaW5kKHRhYkRlYnVnZ2VyLCAnQ1NTLmVuYWJsZScpKVxuICAgICAgLnRoZW4odGFiRGVidWdnZXIuc2VuZENvbW1hbmQuYmluZCh0YWJEZWJ1Z2dlciwgJ0RPTS5nZXREb2N1bWVudCcpKVxuICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgaWYoIWRhdGEucm9vdCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRG9jdW1lbnQgcm9vdCBub3QgYXZhaWxhYmxlLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fY29tbWFuZENvbnRleHQuc2V0Um9vdE5vZGVJZChkYXRhLnJvb3Qubm9kZUlkKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgcmVnaXN0ZXJDb21tYW5kKGNvbW1hbmRUeXBlKSB7XG4gICAgdGhpcy5fY29tbWFuZHMuYWRkKG5ldyBjb21tYW5kVHlwZSgpKTtcbiAgfVxuXG4gIHJlY29nbml6ZSh0ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSBbXTtcblxuICAgIC8vZmlndXJlIG91dCB0aGUgb3JkZXIgaW4gd2hpY2ggY29tbWFuZHMgc2hvdWxkIGJlIGNhbGxlZCAobXVzdCBiZSB0aGUgc2FtZSBhcyBpbiB0aGUgdGV4dClcbiAgICB0aGlzLl9jb21tYW5kcy5mb3JFYWNoKChjb21tYW5kKSA9PiB7XG4gICAgICBsZXQgcG9zaXRpb24gPSBjb21tYW5kLm1hdGNoKHRleHQpO1xuXG4gICAgICBpZihwb3NpdGlvbiAhPT0gLTEpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKHtcbiAgICAgICAgICBwb3NpdGlvbixcbiAgICAgICAgICBjb21tYW5kXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgbGV0IHRhYkRlYnVnZ2VyID0gdGhpcy5fdGFiRGVidWdnZXI7XG4gICAgbGV0IGNvbW1hbmRDb250ZXh0ID0gdGhpcy5fY29tbWFuZENvbnRleHQ7XG4gICAgbGV0IGR1bW15UHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBtYXRjaGVzXG4gICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICByZXR1cm4gYS5wb3NpdGlvbiAtIGIucG9zaXRpb247XG4gICAgICB9KVxuICAgICAgLy9jYWxsIG5leHQgY29tbWFuZCBvbmx5IGFmdGVyIHByZXZpb3VzIG9uZSBoYXMgZmluaXNoZWRcbiAgICAgIC5yZWR1Y2UoKHByb21pc2UsIHtjb21tYW5kfSkgPT4ge1xuICAgICAgICBsZXQgbmV4dENvbW1hbmQgPSBjb21tYW5kLmV4ZWN1dGUuYmluZChjb21tYW5kLCB0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKG5leHRDb21tYW5kKTtcbiAgICAgIH0sIGR1bW15UHJvbWlzZSk7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21tYW5kUnVubmVyOyIsImNsYXNzIENvbW1hbmQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yZWdleCA9IC9eJC9pO1xuICB9XG5cbiAgbWF0Y2godGV4dCkge1xuICAgIHJldHVybiB0ZXh0LnNlYXJjaCh0aGlzLl9yZWdleCk7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gdG9DU1NQcm9wZXJ0eSh0ZXh0KSB7XG4gIHJldHVybiB0ZXh0LnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnICcsICctJyk7XG59XG5cbmxldCBjc3NVbml0cyA9IHtcbiAgcGl4ZWw6ICdweCcsXG4gIHBpeGVsczogJ3B4JyxcbiAgZW06ICdlbScsXG4gIGVtczogJ2VtJyxcbiAgcGVyY2VudDogJyUnXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdG9DU1NWYWx1ZSh2YWx1ZSwgdW5pdCkge1xuICBpZiAodW5pdCkge1xuICAgIHJldHVybiB2YWx1ZSArIGNzc1VuaXRzW3VuaXRdO1xuICB9XG5cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZnJvbUNTU1ZhbHVlVG9UZXh0KGNzc1ZhbHVlKSB7XG4gIGxldCBtYXRjaGVzID0gY3NzVmFsdWUubWF0Y2goLyhbMC05Ll0rKXB4L2kpO1xuXG4gIGlmIChtYXRjaGVzKSB7XG4gICAgbGV0IG51bVZhbHVlID0gbWF0Y2hlc1sxXTtcblxuICAgIHJldHVybiAobnVtVmFsdWUgPT09IDEpID8gJ29uZSBwaXhlbCcgOiBudW1WYWx1ZSArICcgcGl4ZWxzJztcbiAgfVxuXG4gIHJldHVybiBjc3NWYWx1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge307IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIHRvQ1NTVmFsdWV9IGZyb20gJy4uL2hlbHBlcnMvY3NzLmpzJztcblxuY2xhc3MgQ1NTQ2hhbmdlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKGNoYW5nZXxzZXQpIChpdHMgKT8oXFx3KyggXFx3Kyk/KSB0byAoXFx3KykgPyhwaXhlbHxwaXhlbHN8cGVyY2VudHxlbXxlbXMpPy9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgbGV0IHByb3BlcnR5ID0gdG9DU1NQcm9wZXJ0eShtYXRjaGVzWzNdKTtcbiAgICAgIGxldCB2YWx1ZSA9IHRvQ1NTVmFsdWUobWF0Y2hlc1s1XSwgbWF0Y2hlc1s2XSk7XG5cbiAgICAgIGlmKG1hdGNoZXNbM10gPT09ICdpdCcpIHtcbiAgICAgICAgcHJvcGVydHkgPSBjb21tYW5kQ29udGV4dC5nZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUocHJvcGVydHkpO1xuXG4gICAgICBsZXQgY3NzID0gJzsnICsgcHJvcGVydHkgKyAnOiAnICsgdmFsdWUgKyAnOyc7XG4gICAgICByZXR1cm4gdGhpcy5hcHBlbmRUb1N0eWxlcyhjb21tYW5kQ29udGV4dC5nZXRDb250ZXh0Tm9kZUlkKCksIGNzcywgdGFiRGVidWdnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kVG9TdHlsZXMobm9kZUlkLCB0ZXh0LCB0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdDU1NDaGFuZ2VDb21tYW5kJywgbm9kZUlkLCB0ZXh0KTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb250ZXh0LicpO1xuICAgIH1cblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLmdldEF0dHJpYnV0ZXMnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS50aGVuKChkYXRhKSA9PiB7XG4gICAgICBsZXQgb2xkU3R5bGVWYWx1ZSA9ICcnO1xuXG4gICAgICBpZihkYXRhLmF0dHJpYnV0ZXMgJiYgZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJykgIT09IC0xKSB7XG4gICAgICAgIGxldCBpZHhPZlN0eWxlID0gZGF0YS5hdHRyaWJ1dGVzLmluZGV4T2YoJ3N0eWxlJyk7XG4gICAgICAgIG9sZFN0eWxlVmFsdWUgPSBkYXRhLmF0dHJpYnV0ZXNbaWR4T2ZTdHlsZSArIDFdO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5zZXRBdHRyaWJ1dGVWYWx1ZScsIHtcbiAgICAgICAgbm9kZUlkLFxuICAgICAgICBuYW1lOiAnc3R5bGUnLFxuICAgICAgICB2YWx1ZTogb2xkU3R5bGVWYWx1ZSArIHRleHRcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuQ1NTQ2hhbmdlQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBDaGFuZ2UgQ1NTIHByb3BlcnR5IHZhbHVlIG9mIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSBieSBzYXlpbmcgXCJjaGFuZ2UgaXRzIHggdG8geVwiIG9yIFwic2V0IGl0cyB4IHRvIHlcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIENTUyBwcm9wZXJ0eSBhbmQgXCJ5XCIgaXMgdGhlIG5ldyB2YWx1ZSkuYDtcblxuZXhwb3J0IGRlZmF1bHQgQ1NTQ2hhbmdlQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcbmltcG9ydCB7dG9DU1NQcm9wZXJ0eSwgZnJvbUNTU1ZhbHVlVG9UZXh0fSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0dldFZhbHVlQ29tbWFuZCBleHRlbmRzIENvbW1hbmQge1xuICBjb25zdHJ1Y3Rvcihjb21tYW5kUnVubmVyKSB7XG4gICAgc3VwZXIoY29tbWFuZFJ1bm5lcik7XG4gICAgdGhpcy5fcmVnZXggPSAvKHdoYXQnc3x3aGF0IGlzfGdldCkoIGl0cyk/IChcXHcrKCBcXHcrKT8pL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZihtYXRjaGVzKSB7XG4gICAgICBsZXQgcHJvcGVydHkgPSB0b0NTU1Byb3BlcnR5KG1hdGNoZXNbM10pO1xuXG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKHByb3BlcnR5KTtcbiAgICAgIHJldHVybiB0aGlzLmdldENvbXB1dGVkVmFsdWUocHJvcGVydHksIGNvbW1hbmRDb250ZXh0LmdldENvbnRleHROb2RlSWQoKSwgdGFiRGVidWdnZXIpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29tcHV0ZWRWYWx1ZShwcm9wZXJ0eSwgbm9kZUlkLCB0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdDU1NHZXRWYWx1ZUNvbW1hbmQnLCBwcm9wZXJ0eSwgbm9kZUlkKTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb250ZXh0LicpO1xuICAgIH1cblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnQ1NTLmdldENvbXB1dGVkU3R5bGVGb3JOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IGl0ZW0gPSBkYXRhLmNvbXB1dGVkU3R5bGUuZmluZCgoaXRlbSkgPT4ge1xuICAgICAgICByZXR1cm4gaXRlbS5uYW1lID09PSBwcm9wZXJ0eTtcbiAgICAgIH0pO1xuXG4gICAgICBpZihpdGVtKSB7XG4gICAgICAgIHJldHVybiBwcm9wZXJ0eSArICcgdmFsdWUgaXMgJyArIGZyb21DU1NWYWx1ZVRvVGV4dChpdGVtLnZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAnUHJvcGVydHkgJyArIHByb3BlcnR5ICsgJyBub3QgZm91bmQuJztcbiAgICAgIH1cbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbkNTU0dldFZhbHVlQ29tbWFuZC5kZXNjcmlwdGlvbiA9IGBHZXQgY29tcHV0ZWQgQ1NTIHByb3BlcnR5IHZhbHVlIG9mIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSBieSBzYXlpbmcgXCJnZXQgaXRzIHhcIiBvciBcIndoYXQncyBpdHMgeFwiICh3aGVyZSBcInhcIiBpcyB0aGUgbmFtZSBvZiB0aGUgQ1NTIHByb3BlcnR5KS5gO1xuXG5leHBvcnQgZGVmYXVsdCBDU1NHZXRWYWx1ZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5cbmNsYXNzIE5vZGVEZWxldGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhkZWxldGV8cmVtb3ZlKSBpdC9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlTm9kZShjb21tYW5kQ29udGV4dC5nZXRDb250ZXh0Tm9kZUlkKCksIHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbW92ZU5vZGUobm9kZUlkLCB0YWJEZWJ1Z2dlcikge1xuICAgIGNvbnNvbGUubG9nKCdOb2RlRGVsZXRpb25Db21tYW5kJywgbm9kZUlkKTtcblxuICAgIGlmKCFub2RlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb250ZXh0LicpO1xuICAgIH1cblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnJlbW92ZU5vZGUnLCB7XG4gICAgICBub2RlSWRcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbk5vZGVEZWxldGlvbkNvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVtb3ZlIGN1cnJlbnRseSBpbnNwZWN0ZWQgbm9kZSB3aXRoIFwicmVtb3ZlIGl0XCIgb3IgXCJkZWxldGUgaXRcIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBOb2RlRGVsZXRpb25Db21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jb25zdCBISUdITElHSFRfQ09MT1IgPSB7XG4gIHI6IDE1NSxcbiAgZzogMTEsXG4gIGI6IDIzOSxcbiAgYTogMC43XG59O1xuY29uc3QgSElHSExJR0hUX1RJTUVPVVQgPSAyMDAwO1xuXG5jbGFzcyBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhzZWxlY3R8aW5zcGVjdCkgKFxcdyspL2k7XG4gIH1cblxuICBleGVjdXRlKHRleHQsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gdGV4dC5tYXRjaCh0aGlzLl9yZWdleCk7XG5cbiAgICBpZiAobWF0Y2hlcykge1xuICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0Tm9kZShtYXRjaGVzWzJdICsgJywgIycgKyBtYXRjaGVzWzJdICsgJywgLicgKyBtYXRjaGVzWzJdLCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWplY3QoJ1RleHQgZG9lc25cXCd0IG1hdGNoIHRoZSBjb21tYW5kLicpO1xuICAgIH0pO1xuICB9XG5cbiAgc2VsZWN0Tm9kZShzZWxlY3RvciwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgY29uc29sZS5sb2coJ05vZGVJbnNwZWN0aW9uQ29tbWFuZCcsIHNlbGVjdG9yKTtcblxuICAgIGxldCByb290Tm9kZUlkID0gY29tbWFuZENvbnRleHQuZ2V0Um9vdE5vZGVJZCgpO1xuXG4gICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00ucXVlcnlTZWxlY3RvcicsIHtcbiAgICAgIG5vZGVJZDogcm9vdE5vZGVJZCxcbiAgICAgIHNlbGVjdG9yXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgaWYoIWRhdGEubm9kZUlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHROb2RlSWQoZGF0YS5ub2RlSWQpO1xuICAgICAgY29tbWFuZENvbnRleHQuc2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZShudWxsKTtcblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlnaGxpZ2h0Tm9kZScsIHtcbiAgICAgICAgaGlnaGxpZ2h0Q29uZmlnOiB7XG4gICAgICAgICAgY29udGVudENvbG9yOiBISUdITElHSFRfQ09MT1IsXG4gICAgICAgICAgc2hvd0luZm86IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgbm9kZUlkOiBkYXRhLm5vZGVJZFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vc3RvcCBoaWdobGlnaHRpbmcgYWZ0ZXIgY291cGxlIG9mIHNlY29uZHNcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWRlSGlnaGxpZ2h0Jyk7XG4gICAgICAgIH0sIEhJR0hMSUdIVF9USU1FT1VUKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuTm9kZUluc3BlY3Rpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFNlbGVjdCBET00gbm9kZXMgd2l0aCBcInNlbGVjdCB4XCIgb3IgXCJpbnNwZWN0IHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIHRhZywgaWQgb3IgQ1NTIGNsYXNzKS4gSWYgbXVsdGlwbGUgbm9kZXMgbWF0Y2gsIG9ubHkgdGhlIGZpcnN0IG9uZSB3aWxsIGJlIHNlbGVjdGVkLmA7XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgUmVkb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3JlZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ1JlZG9Db21tYW5kJyk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZWRvJyk7XG4gIH1cbn1cblxuUmVkb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVkbyBsYXN0IGNvbW1hbmQgd2l0aCBcInJlZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBSZWRvQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgVW5kb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3VuZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnVuZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVuZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ1VuZG9Db21tYW5kJyk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS51bmRvJyk7XG4gIH1cbn1cblxuVW5kb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgVW5kbyBsYXN0IGNvbW1hbmQgd2l0aCBcInVuZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBVbmRvQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlVGFiKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWV9LCAodGFicykgPT4ge1xuICAgICAgaWYgKHRhYnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUodGFic1swXSk7XG4gICAgfSlcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImNvbnN0IElETEUgPSAxO1xuY29uc3QgUkVDT1JESU5HID0gMjtcblxuY2xhc3MgUmVjb3JkaW5nSWNvbiB7XG4gIGNvbnN0cnVjdCgpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBJRExFO1xuICAgIHRoaXMuX2FuaW1hdGlvbkludGVydmFsID0gbnVsbDtcbiAgfVxuXG4gIHNob3coKSB7XG4gICAgdGhpcy5fc3RhdHVzID0gUkVDT1JESU5HO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIGxldCBhbmltYXRpb24gPSAnIMK3JztcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUZyYW1lKCkge1xuICAgICAgdmFyIGZyYW1lID0gYW5pbWF0aW9uW2kgJSBhbmltYXRpb24ubGVuZ3RoXTtcbiAgICAgIGkrKztcblxuICAgICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHtcbiAgICAgICAgdGV4dDogZnJhbWVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHVwZGF0ZUZyYW1lKCk7XG5cbiAgICB0aGlzLl9hbmltYXRpb25JbnRlcnZhbCA9IHNldEludGVydmFsKHVwZGF0ZUZyYW1lLCAxNTApO1xuICB9XG5cbiAgaGlkZSgpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBJRExFO1xuXG4gICAgaWYgKHRoaXMuX2FuaW1hdGlvbkludGVydmFsKSB7XG4gICAgICBjbGVhckludGVydmFsKHRoaXMuX2FuaW1hdGlvbkludGVydmFsKTtcbiAgICB9XG5cbiAgICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZVRleHQoe1xuICAgICAgdGV4dDogJydcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSZWNvcmRpbmdJY29uOyIsImNsYXNzIExpc3RlbmVyTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9XG5cbiAgbm90aWZ5TGlzdGVuZXJzKGRhdGEpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgbGlzdGVuZXIoZGF0YSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdGVuZXJNYW5hZ2VyOyIsImltcG9ydCBMaXN0ZW5lck1hbmFnZXIgZnJvbSAnLi9saXN0ZW5lci1tYW5hZ2VyLmpzJztcbmNvbnN0IEFDVElWRSA9IDE7XG5jb25zdCBJTkFDVElWRSA9IDI7XG5cbmNsYXNzIFNwZWVjaFJlY29nbml0aW9uIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVjb2duaXRpb24gPSBudWxsO1xuICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuXG4gICAgdGhpcy5vblJlc3VsdCA9IG5ldyBMaXN0ZW5lck1hbmFnZXIoKTtcbiAgICB0aGlzLm9uRW5kID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgdmFyIHJlY29nbml0aW9uID0gbmV3IHdlYmtpdFNwZWVjaFJlY29nbml0aW9uKCk7XG4gICAgcmVjb2duaXRpb24uY29udGludW91cyA9IHRydWU7XG4gICAgLy9yZWNvZ25pdGlvbi5pbnRlcmltUmVzdWx0cyA9IHRydWU7XG5cbiAgICByZWNvZ25pdGlvbi5vbmVuZCA9ICgpID0+IHtcbiAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoKTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24ub25yZXN1bHQgPSAoZXZlbnQpID0+IHtcbiAgICAgIGxldCBpbnRlcmltX3RyYW5zY3JpcHQgPSAnJywgZmluYWxfdHJhbnNjcmlwdCA9ICcnO1xuXG4gICAgICBmb3IgKGxldCBpID0gZXZlbnQucmVzdWx0SW5kZXg7IGkgPCBldmVudC5yZXN1bHRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChldmVudC5yZXN1bHRzW2ldLmlzRmluYWwpIHtcbiAgICAgICAgICBmaW5hbF90cmFuc2NyaXB0ICs9IGV2ZW50LnJlc3VsdHNbaV1bMF0udHJhbnNjcmlwdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbnRlcmltX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdTcGVlY2hSZWNvZ25pdGlvbicsIGZpbmFsX3RyYW5zY3JpcHQpO1xuICAgICAgdGhpcy5vblJlc3VsdC5ub3RpZnlMaXN0ZW5lcnMoZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgfTtcblxuICAgIHJlY29nbml0aW9uLnN0YXJ0KCk7XG5cbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IHJlY29nbml0aW9uO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlY29nbml0aW9uLm9uc3RhcnQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IEFDVElWRTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcmVjb2duaXRpb24ub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBJTkFDVElWRTtcbiAgICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoZXZlbnQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGlzQWN0aXZlKCkge1xuICAgIHJldHVybiB0aGlzLl9zdGF0dXMgPT09IEFDVElWRTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3JlY29nbml0aW9uKSB7XG4gICAgICB0aGlzLl9yZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNwZWVjaFJlY29nbml0aW9uO1xuIiwiaW1wb3J0IExpc3RlbmVyTWFuYWdlciBmcm9tICcuL2xpc3RlbmVyLW1hbmFnZXIuanMnO1xuXG5mdW5jdGlvbiBfYXR0YWNoKHRhYklkKSB7XG4gIHZhciBwcm90b2NvbFZlcnNpb24gPSAnMS4xJztcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5hdHRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgcHJvdG9jb2xWZXJzaW9uLCAoKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX2RldGFjaCh0YWJJZCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5kZXRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgKCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9zZW5kQ29tbWFuZCh0YWJJZCwgY29tbWFuZCwgZGF0YSA9IHt9KSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLnNlbmRDb21tYW5kKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sIGNvbW1hbmQsIGRhdGEsIChyZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXNwb25zZS5lcnJvcikge1xuICAgICAgICByZWplY3QocmVzcG9uc2UuZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY2xhc3MgVGFiRGVidWdnZXIge1xuICBjb25zdHJ1Y3Rvcih0YWJJZCkge1xuICAgIHRoaXMuX3RhYklkID0gdGFiSWQ7XG4gICAgdGhpcy5fYXR0YWNoZWQgPSB0cnVlO1xuICAgIHRoaXMub25EaXNjb25uZWN0ID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuXG4gICAgY2hyb21lLmRlYnVnZ2VyLm9uRGV0YWNoLmFkZExpc3RlbmVyKChzb3VyY2UsIHJlYXNvbikgPT4ge1xuICAgICAgaWYoc291cmNlLnRhYklkID09PSB0aGlzLl90YWJJZCkge1xuICAgICAgICB0aGlzLl9hdHRhY2hlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uRGlzY29ubmVjdC5ub3RpZnlMaXN0ZW5lcnMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbm5lY3QoKSB7XG4gICAgcmV0dXJuIF9hdHRhY2godGhpcy5fdGFiSWQpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fYXR0YWNoZWQgPSB0cnVlO1xuICAgIH0pO1xuICB9XG5cbiAgZGlzY29ubmVjdCgpe1xuICAgIHJldHVybiBfZGV0YWNoKHRoaXMuX3RhYklkKTtcbiAgfVxuXG4gIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2hlZDtcbiAgfVxuXG4gIHNlbmRDb21tYW5kKGNvbW1hbmQsIGRhdGEpIHtcbiAgICBpZighdGhpcy5fYXR0YWNoZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbm5lY3QoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIF9zZW5kQ29tbWFuZCh0aGlzLl90YWJJZCwgY29tbWFuZCwgZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3NlbmRDb21tYW5kKHRoaXMuX3RhYklkLCBjb21tYW5kLCBkYXRhKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUYWJEZWJ1Z2dlcjsiLCJjbGFzcyBUZXh0VG9TcGVlY2gge1xuICBzcGVhayh0ZXh0KSB7XG4gICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICBlbnF1ZXVlOiB0cnVlLFxuICAgICAgdm9pY2VOYW1lOiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndm9pY2VOYW1lJykvL1RPRE8gZG8gbm90IHF1ZXJ5IGxvY2FsU3RvcmFnZSBldmVyeSB0aW1lXG4gICAgfTtcblxuICAgIGNocm9tZS50dHMuc3BlYWsodGV4dCwgb3B0aW9ucyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGV4dFRvU3BlZWNoOyIsImltcG9ydCBTcGVlY2hSZWNvZ25pdGlvbiBmcm9tICcuL3NwZWVjaC1yZWNvZ25pdGlvbi5qcyc7XG5pbXBvcnQgQ29tbWFuZFJ1bm5lciBmcm9tICcuL2NvbW1hbmQtcnVubmVyLmpzJztcbmltcG9ydCBUYWJEZWJ1Z2dlciBmcm9tICcuL3RhYi1kZWJ1Z2dlci5qcyc7XG5pbXBvcnQge2dldEFjdGl2ZVRhYn0gZnJvbSAnLi9oZWxwZXJzL3RhYnMuanMnO1xuaW1wb3J0IFJlY29yZGluZ0ljb24gZnJvbSAnLi9yZWNvcmRpbmctaWNvbi5qcyc7XG5pbXBvcnQgVGV4dFRvU3BlZWNoIGZyb20gJy4vdGV4dC10by1zcGVlY2guanMnO1xuXG5pbXBvcnQgTm9kZUluc3BlY3Rpb25Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvbm9kZS1pbnNwZWN0aW9uLmpzJztcbmltcG9ydCBOb2RlRGVsZXRpb25Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvbm9kZS1kZWxldGlvbi5qcyc7XG5pbXBvcnQgQ1NTQ2hhbmdlQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMnO1xuaW1wb3J0IENTU0dldFZhbHVlQ29tbWFuZCBmcm9tICcuL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMnO1xuaW1wb3J0IFVuZG9Db21tYW5kIGZyb20gJy4vY29tbWFuZHMvdW5kby5qcyc7XG5pbXBvcnQgUmVkb0NvbW1hbmQgZnJvbSAnLi9jb21tYW5kcy9yZWRvLmpzJztcblxubGV0IHRleHRUb1NwZWVjaCA9IG5ldyBUZXh0VG9TcGVlY2goKTtcbmxldCByZWNvcmRpbmdJY29uID0gbmV3IFJlY29yZGluZ0ljb24oKTtcbmxldCBjb21tYW5kUnVubmVyID0gbmV3IENvbW1hbmRSdW5uZXIoKTtcblxuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoTm9kZUluc3BlY3Rpb25Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKE5vZGVEZWxldGlvbkNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoQ1NTQ2hhbmdlQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChDU1NHZXRWYWx1ZUNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoVW5kb0NvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoUmVkb0NvbW1hbmQpO1xuXG5sZXQgc3BlZWNoUmVjb2duaXRpb24gPSBuZXcgU3BlZWNoUmVjb2duaXRpb24oKTtcbmxldCB0YWJEZWJ1Z2dlciA9IG51bGw7XG5cbnNwZWVjaFJlY29nbml0aW9uLm9uUmVzdWx0LmFkZExpc3RlbmVyKCh0cmFuc2NyaXB0KSA9PiB7XG4gIGNvbW1hbmRSdW5uZXIucmVjb2duaXplKHRyYW5zY3JpcHQpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgIGlmIChyZXN1bHQgJiYgdHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRleHRUb1NwZWVjaC5zcGVhayhyZXN1bHQpO1xuICAgIH1cbiAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0ZXh0VG9TcGVlY2guc3BlYWsoZXJyb3IubWVzc2FnZSk7XG4gICAgfVxuICB9KTtcbn0pO1xuXG5zcGVlY2hSZWNvZ25pdGlvbi5vbkVuZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmICh0YWJEZWJ1Z2dlciAmJiB0YWJEZWJ1Z2dlci5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgdGFiRGVidWdnZXIuZGlzY29ubmVjdCgpO1xuICB9XG4gIHJlY29yZGluZ0ljb24uaGlkZSgpO1xufSk7XG5cbmNocm9tZS5icm93c2VyQWN0aW9uLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmIChzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHNwZWVjaFJlY29nbml0aW9uXG4gICAgLnN0YXJ0KClcbiAgICAudGhlbihnZXRBY3RpdmVUYWIpXG4gICAgLnRoZW4oKHRhYikgPT4ge1xuICAgICAgdGFiRGVidWdnZXIgPSBuZXcgVGFiRGVidWdnZXIodGFiLmlkKTtcbiAgICAgIHRhYkRlYnVnZ2VyLm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLmNvbm5lY3QoKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJlY29yZGluZ0ljb24uc2hvdygpO1xuICAgICAgY29tbWFuZFJ1bm5lci5zZXRUYWJEZWJ1Z2dlcih0YWJEZWJ1Z2dlcik7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IgPT0gJ25vdC1hbGxvd2VkJykge1xuICAgICAgICBjaHJvbWUucnVudGltZS5vcGVuT3B0aW9uc1BhZ2UoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNwZWVjaFJlY29nbml0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59KTsiXX0=
