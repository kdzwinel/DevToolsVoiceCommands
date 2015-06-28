var $__scripts_47_lib_47_command_45_context_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/command-context.js";
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
var $__scripts_47_lib_47_command_45_runner_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/command-runner.js";
  var CommandContext = ($__scripts_47_lib_47_command_45_context_46_js__).default;
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
var $__scripts_47_lib_47_command_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/command.js";
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
var $__scripts_47_lib_47_helpers_47_css_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/helpers/css.js";
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
var $__scripts_47_lib_47_commands_47_css_45_change_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/css-change.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
  var $__1 = $__scripts_47_lib_47_helpers_47_css_46_js__,
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
var $__scripts_47_lib_47_commands_47_css_45_get_45_value_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/css-get-value.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
  var $__1 = $__scripts_47_lib_47_helpers_47_css_46_js__,
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
var $__scripts_47_lib_47_commands_47_node_45_deletion_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/node-deletion.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
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
var $__scripts_47_lib_47_commands_47_node_45_inspection_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/node-inspection.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
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
var $__scripts_47_lib_47_commands_47_redo_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/redo.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
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
var $__scripts_47_lib_47_commands_47_undo_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/commands/undo.js";
  var Command = ($__scripts_47_lib_47_command_46_js__).default;
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
var $__scripts_47_lib_47_helpers_47_tabs_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/helpers/tabs.js";
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
var $__scripts_47_lib_47_recording_45_icon_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/recording-icon.js";
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
var $__scripts_47_lib_47_listener_45_manager_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/listener-manager.js";
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
var $__scripts_47_lib_47_speech_45_recognition_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/speech-recognition.js";
  var ListenerManager = ($__scripts_47_lib_47_listener_45_manager_46_js__).default;
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
var $__scripts_47_lib_47_tab_45_debugger_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/tab-debugger.js";
  var ListenerManager = ($__scripts_47_lib_47_listener_45_manager_46_js__).default;
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
var $__scripts_47_lib_47_text_45_to_45_speech_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/text-to-speech.js";
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
  var SpeechRecognition = ($__scripts_47_lib_47_speech_45_recognition_46_js__).default;
  var CommandRunner = ($__scripts_47_lib_47_command_45_runner_46_js__).default;
  var TabDebugger = ($__scripts_47_lib_47_tab_45_debugger_46_js__).default;
  var getActiveTab = ($__scripts_47_lib_47_helpers_47_tabs_46_js__).getActiveTab;
  var RecordingIcon = ($__scripts_47_lib_47_recording_45_icon_46_js__).default;
  var TextToSpeech = ($__scripts_47_lib_47_text_45_to_45_speech_46_js__).default;
  var NodeInspectionCommand = ($__scripts_47_lib_47_commands_47_node_45_inspection_46_js__).default;
  var NodeDeletionCommand = ($__scripts_47_lib_47_commands_47_node_45_deletion_46_js__).default;
  var CSSChangeCommand = ($__scripts_47_lib_47_commands_47_css_45_change_46_js__).default;
  var CSSGetValueCommand = ($__scripts_47_lib_47_commands_47_css_45_get_45_value_46_js__).default;
  var UndoCommand = ($__scripts_47_lib_47_commands_47_undo_46_js__).default;
  var RedoCommand = ($__scripts_47_lib_47_commands_47_redo_46_js__).default;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvbGliL2NvbW1hbmQtY29udGV4dC5qcyIsInNjcmlwdHMvbGliL2NvbW1hbmQtcnVubmVyLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZC5qcyIsInNjcmlwdHMvbGliL2hlbHBlcnMvY3NzLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZHMvY3NzLWNoYW5nZS5qcyIsInNjcmlwdHMvbGliL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMiLCJzY3JpcHRzL2xpYi9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZHMvbm9kZS1pbnNwZWN0aW9uLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvbGliL2NvbW1hbmRzL3VuZG8uanMiLCJzY3JpcHRzL2xpYi9oZWxwZXJzL3RhYnMuanMiLCJzY3JpcHRzL2xpYi9yZWNvcmRpbmctaWNvbi5qcyIsInNjcmlwdHMvbGliL2xpc3RlbmVyLW1hbmFnZXIuanMiLCJzY3JpcHRzL2xpYi9zcGVlY2gtcmVjb2duaXRpb24uanMiLCJzY3JpcHRzL2xpYi90YWItZGVidWdnZXIuanMiLCJzY3JpcHRzL2xpYi90ZXh0LXRvLXNwZWVjaC5qcyIsInNjcmlwdHMvYmFja2dyb3VuZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLEFBQUksSUFBQSxDQUFBLFlBQVcsbUNBQW9CLENBQUM7SUNBOUIsZUFBYSxFQUFuQixDQUFBLFNBQVMsQUFBRDtBQUFSLFdBQU0sZUFBYSxDQUNMLEFBQUQsQ0FBRztBQUNaLFNBQUcsWUFBWSxFQUFJLEtBQUcsQ0FBQztBQUN2QixTQUFHLGVBQWUsRUFBSSxLQUFHLENBQUM7QUFDMUIsU0FBRyx3QkFBd0IsRUFBSSxLQUFHLENBQUM7SUFDckM7QUF5QkYsQUE1QlUsU0FBTyxDQUFBLENBQUMsZUFBYyxZQUFZLENBQUMsQUFBQztBQUs1QyxxQkFBZSxDQUFmLFVBQWlCLEFBQUQsQ0FBRztBQUNqQixhQUFP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QUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0VBQ04sQ0FBQyxDQUFDO0FBN0VGLFdBQXVCIiwiZmlsZSI6Ii9Vc2Vycy9rZHp3aW5lbC9Qcm9qZWN0cy9PUy9EZXZUb29sc1ZvaWNlQ29tbWFuZHMvdGVtcG91dE1DNDFOakUxT1RBMk5qYzRNVFF3TVRZei5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwiY2xhc3MgQ29tbWFuZENvbnRleHQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yb290Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Q1NTUHJvcGVydHlOYW1lID0gbnVsbDtcbiAgfVxuXG4gIGdldENvbnRleHROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Tm9kZUlkKGlkKSB7XG4gICAgdGhpcy5fY29udGV4dE5vZGVJZCA9IGlkO1xuICB9XG5cbiAgc2V0Um9vdE5vZGVJZChpZCkge1xuICAgIHRoaXMuX3Jvb3ROb2RlSWQgPSBpZDtcbiAgfVxuXG4gIGdldFJvb3ROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3ROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKG5hbWUpIHtcbiAgICB0aGlzLl9jb250ZXh0Q1NTUHJvcGVydHlOYW1lID0gbmFtZTtcbiAgfVxuXG4gIGdldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHRDU1NQcm9wZXJ0eU5hbWU7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZENvbnRleHQ7IiwiaW1wb3J0IENvbW1hbmRDb250ZXh0IGZyb20gJy4vY29tbWFuZC1jb250ZXh0LmpzJztcblxuY2xhc3MgQ29tbWFuZFJ1bm5lciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gbnVsbDtcbiAgICB0aGlzLl9jb21tYW5kQ29udGV4dCA9IG5ldyBDb21tYW5kQ29udGV4dCgpO1xuICAgIHRoaXMuX2NvbW1hbmRzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpIHtcbiAgICB0aGlzLl90YWJEZWJ1Z2dlciA9IHRhYkRlYnVnZ2VyO1xuXG4gICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5lbmFibGUnKVxuICAgICAgLnRoZW4odGFiRGVidWdnZXIuc2VuZENvbW1hbmQuYmluZCh0YWJEZWJ1Z2dlciwgJ0NTUy5lbmFibGUnKSlcbiAgICAgIC50aGVuKHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kLmJpbmQodGFiRGVidWdnZXIsICdET00uZ2V0RG9jdW1lbnQnKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGlmKCFkYXRhLnJvb3QpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvY3VtZW50IHJvb3Qgbm90IGF2YWlsYWJsZS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbW1hbmRDb250ZXh0LnNldFJvb3ROb2RlSWQoZGF0YS5yb290Lm5vZGVJZCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29tbWFuZChjb21tYW5kVHlwZSkge1xuICAgIHRoaXMuX2NvbW1hbmRzLmFkZChuZXcgY29tbWFuZFR5cGUoKSk7XG4gIH1cblxuICByZWNvZ25pemUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gW107XG5cbiAgICAvL2ZpZ3VyZSBvdXQgdGhlIG9yZGVyIGluIHdoaWNoIGNvbW1hbmRzIHNob3VsZCBiZSBjYWxsZWQgKG11c3QgYmUgdGhlIHNhbWUgYXMgaW4gdGhlIHRleHQpXG4gICAgdGhpcy5fY29tbWFuZHMuZm9yRWFjaCgoY29tbWFuZCkgPT4ge1xuICAgICAgbGV0IHBvc2l0aW9uID0gY29tbWFuZC5tYXRjaCh0ZXh0KTtcblxuICAgICAgaWYocG9zaXRpb24gIT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgY29tbWFuZFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX3RhYkRlYnVnZ2VyO1xuICAgIGxldCBjb21tYW5kQ29udGV4dCA9IHRoaXMuX2NvbW1hbmRDb250ZXh0O1xuICAgIGxldCBkdW1teVByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWF0Y2hlc1xuICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgcmV0dXJuIGEucG9zaXRpb24gLSBiLnBvc2l0aW9uO1xuICAgICAgfSlcbiAgICAgIC8vY2FsbCBuZXh0IGNvbW1hbmQgb25seSBhZnRlciBwcmV2aW91cyBvbmUgaGFzIGZpbmlzaGVkXG4gICAgICAucmVkdWNlKChwcm9taXNlLCB7Y29tbWFuZH0pID0+IHtcbiAgICAgICAgbGV0IG5leHRDb21tYW5kID0gY29tbWFuZC5leGVjdXRlLmJpbmQoY29tbWFuZCwgdGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihuZXh0Q29tbWFuZCk7XG4gICAgICB9LCBkdW1teVByb21pc2UpO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZFJ1bm5lcjsiLCJjbGFzcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVnZXggPSAvXiQvaTtcbiAgfVxuXG4gIG1hdGNoKHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5zZWFyY2godGhpcy5fcmVnZXgpO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcblxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmQ7IiwiZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTUHJvcGVydHkodGV4dCkge1xuICByZXR1cm4gdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJyAnLCAnLScpO1xufVxuXG5sZXQgY3NzVW5pdHMgPSB7XG4gIHBpeGVsOiAncHgnLFxuICBwaXhlbHM6ICdweCcsXG4gIGVtOiAnZW0nLFxuICBlbXM6ICdlbScsXG4gIHBlcmNlbnQ6ICclJ1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTVmFsdWUodmFsdWUsIHVuaXQpIHtcbiAgaWYgKHVuaXQpIHtcbiAgICByZXR1cm4gdmFsdWUgKyBjc3NVbml0c1t1bml0XTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21DU1NWYWx1ZVRvVGV4dChjc3NWYWx1ZSkge1xuICBsZXQgbWF0Y2hlcyA9IGNzc1ZhbHVlLm1hdGNoKC8oWzAtOS5dKylweC9pKTtcblxuICBpZiAobWF0Y2hlcykge1xuICAgIGxldCBudW1WYWx1ZSA9IG1hdGNoZXNbMV07XG5cbiAgICByZXR1cm4gKG51bVZhbHVlID09PSAxKSA/ICdvbmUgcGl4ZWwnIDogbnVtVmFsdWUgKyAnIHBpeGVscyc7XG4gIH1cblxuICByZXR1cm4gY3NzVmFsdWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCB0b0NTU1ZhbHVlfSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0NoYW5nZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhjaGFuZ2V8c2V0KSAoaXRzICk/KFxcdysoIFxcdyspPykgdG8gKFxcdyspID8ocGl4ZWx8cGl4ZWxzfHBlcmNlbnR8ZW18ZW1zKT8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBwcm9wZXJ0eSA9IHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSk7XG4gICAgICBsZXQgdmFsdWUgPSB0b0NTU1ZhbHVlKG1hdGNoZXNbNV0sIG1hdGNoZXNbNl0pO1xuXG4gICAgICBpZihtYXRjaGVzWzNdID09PSAnaXQnKSB7XG4gICAgICAgIHByb3BlcnR5ID0gY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZSgpO1xuICAgICAgfVxuXG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKHByb3BlcnR5KTtcblxuICAgICAgbGV0IGNzcyA9ICc7JyArIHByb3BlcnR5ICsgJzogJyArIHZhbHVlICsgJzsnO1xuICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kVG9TdHlsZXMoY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dE5vZGVJZCgpLCBjc3MsIHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZFRvU3R5bGVzKG5vZGVJZCwgdGV4dCwgdGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnQ1NTQ2hhbmdlQ29tbWFuZCcsIG5vZGVJZCwgdGV4dCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29udGV4dC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5nZXRBdHRyaWJ1dGVzJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IG9sZFN0eWxlVmFsdWUgPSAnJztcblxuICAgICAgaWYoZGF0YS5hdHRyaWJ1dGVzICYmIGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpICE9PSAtMSkge1xuICAgICAgICBsZXQgaWR4T2ZTdHlsZSA9IGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpO1xuICAgICAgICBvbGRTdHlsZVZhbHVlID0gZGF0YS5hdHRyaWJ1dGVzW2lkeE9mU3R5bGUgKyAxXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uc2V0QXR0cmlidXRlVmFsdWUnLCB7XG4gICAgICAgIG5vZGVJZCxcbiAgICAgICAgbmFtZTogJ3N0eWxlJyxcbiAgICAgICAgdmFsdWU6IG9sZFN0eWxlVmFsdWUgKyB0ZXh0XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbkNTU0NoYW5nZUNvbW1hbmQuZGVzY3JpcHRpb24gPSBgQ2hhbmdlIENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgYnkgc2F5aW5nIFwiY2hhbmdlIGl0cyB4IHRvIHlcIiBvciBcInNldCBpdHMgeCB0byB5XCIgKHdoZXJlIFwieFwiIGlzIHRoZSBuYW1lIG9mIHRoZSBDU1MgcHJvcGVydHkgYW5kIFwieVwiIGlzIHRoZSBuZXcgdmFsdWUpLmA7XG5cbmV4cG9ydCBkZWZhdWx0IENTU0NoYW5nZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIGZyb21DU1NWYWx1ZVRvVGV4dH0gZnJvbSAnLi4vaGVscGVycy9jc3MuanMnO1xuXG5jbGFzcyBDU1NHZXRWYWx1ZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyh3aGF0J3N8d2hhdCBpc3xnZXQpKCBpdHMpPyAoXFx3KyggXFx3Kyk/KS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgbGV0IHByb3BlcnR5ID0gdG9DU1NQcm9wZXJ0eShtYXRjaGVzWzNdKTtcblxuICAgICAgY29tbWFuZENvbnRleHQuc2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZShwcm9wZXJ0eSk7XG4gICAgICByZXR1cm4gdGhpcy5nZXRDb21wdXRlZFZhbHVlKHByb3BlcnR5LCBjb21tYW5kQ29udGV4dC5nZXRDb250ZXh0Tm9kZUlkKCksIHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldENvbXB1dGVkVmFsdWUocHJvcGVydHksIG5vZGVJZCwgdGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnQ1NTR2V0VmFsdWVDb21tYW5kJywgcHJvcGVydHksIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29udGV4dC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0NTUy5nZXRDb21wdXRlZFN0eWxlRm9yTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGxldCBpdGVtID0gZGF0YS5jb21wdXRlZFN0eWxlLmZpbmQoKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ubmFtZSA9PT0gcHJvcGVydHk7XG4gICAgICB9KTtcblxuICAgICAgaWYoaXRlbSkge1xuICAgICAgICByZXR1cm4gcHJvcGVydHkgKyAnIHZhbHVlIGlzICcgKyBmcm9tQ1NTVmFsdWVUb1RleHQoaXRlbS52YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ1Byb3BlcnR5ICcgKyBwcm9wZXJ0eSArICcgbm90IGZvdW5kLic7XG4gICAgICB9XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5DU1NHZXRWYWx1ZUNvbW1hbmQuZGVzY3JpcHRpb24gPSBgR2V0IGNvbXB1dGVkIENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgYnkgc2F5aW5nIFwiZ2V0IGl0cyB4XCIgb3IgXCJ3aGF0J3MgaXRzIHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIENTUyBwcm9wZXJ0eSkuYDtcblxuZXhwb3J0IGRlZmF1bHQgQ1NTR2V0VmFsdWVDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlRGVsZXRpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oZGVsZXRlfHJlbW92ZSkgaXQvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZU5vZGUoY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dE5vZGVJZCgpLCB0YWJEZWJ1Z2dlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZW1vdmVOb2RlKG5vZGVJZCwgdGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnTm9kZURlbGV0aW9uQ29tbWFuZCcsIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29udGV4dC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZW1vdmVOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5Ob2RlRGVsZXRpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFJlbW92ZSBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgd2l0aCBcInJlbW92ZSBpdFwiIG9yIFwiZGVsZXRlIGl0XCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZURlbGV0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY29uc3QgSElHSExJR0hUX0NPTE9SID0ge1xuICByOiAxNTUsXG4gIGc6IDExLFxuICBiOiAyMzksXG4gIGE6IDAuN1xufTtcbmNvbnN0IEhJR0hMSUdIVF9USU1FT1VUID0gMjAwMDtcblxuY2xhc3MgTm9kZUluc3BlY3Rpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oc2VsZWN0fGluc3BlY3QpIChcXHcrKS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlbGVjdE5vZGUobWF0Y2hlc1syXSArICcsICMnICsgbWF0Y2hlc1syXSArICcsIC4nICsgbWF0Y2hlc1syXSwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNlbGVjdE5vZGUoc2VsZWN0b3IsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGNvbnNvbGUubG9nKCdOb2RlSW5zcGVjdGlvbkNvbW1hbmQnLCBzZWxlY3Rvcik7XG5cbiAgICBsZXQgcm9vdE5vZGVJZCA9IGNvbW1hbmRDb250ZXh0LmdldFJvb3ROb2RlSWQoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnF1ZXJ5U2VsZWN0b3InLCB7XG4gICAgICBub2RlSWQ6IHJvb3ROb2RlSWQsXG4gICAgICBzZWxlY3RvclxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIC8vd2hlbiBubyByZXN1bHRzIEFQSSByZXR1cm5zIG5vZGVJZCA9PT0gMFxuICAgICAgaWYoIWRhdGEubm9kZUlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHROb2RlSWQoZGF0YS5ub2RlSWQpO1xuICAgICAgY29tbWFuZENvbnRleHQuc2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZShudWxsKTtcblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlnaGxpZ2h0Tm9kZScsIHtcbiAgICAgICAgaGlnaGxpZ2h0Q29uZmlnOiB7XG4gICAgICAgICAgY29udGVudENvbG9yOiBISUdITElHSFRfQ09MT1IsXG4gICAgICAgICAgc2hvd0luZm86IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgbm9kZUlkOiBkYXRhLm5vZGVJZFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vc3RvcCBoaWdobGlnaHRpbmcgYWZ0ZXIgY291cGxlIG9mIHNlY29uZHNcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWRlSGlnaGxpZ2h0Jyk7XG4gICAgICAgIH0sIEhJR0hMSUdIVF9USU1FT1VUKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuTm9kZUluc3BlY3Rpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFNlbGVjdCBET00gbm9kZXMgd2l0aCBcInNlbGVjdCB4XCIgb3IgXCJpbnNwZWN0IHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIHRhZywgaWQgb3IgQ1NTIGNsYXNzKS4gSWYgbXVsdGlwbGUgbm9kZXMgbWF0Y2gsIG9ubHkgdGhlIGZpcnN0IG9uZSB3aWxsIGJlIHNlbGVjdGVkLmA7XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgUmVkb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3JlZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ1JlZG9Db21tYW5kJyk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZWRvJyk7XG4gIH1cbn1cblxuUmVkb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVkbyBsYXN0IGNvbW1hbmQgd2l0aCBcInJlZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBSZWRvQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgVW5kb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3VuZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnVuZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVuZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ1VuZG9Db21tYW5kJyk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS51bmRvJyk7XG4gIH1cbn1cblxuVW5kb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgVW5kbyBsYXN0IGNvbW1hbmQgd2l0aCBcInVuZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBVbmRvQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlVGFiKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWV9LCAodGFicykgPT4ge1xuICAgICAgaWYgKHRhYnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUodGFic1swXSk7XG4gICAgfSlcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImNvbnN0IElETEUgPSAxO1xuY29uc3QgUkVDT1JESU5HID0gMjtcblxuY2xhc3MgUmVjb3JkaW5nSWNvbiB7XG4gIGNvbnN0cnVjdCgpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBJRExFO1xuICAgIHRoaXMuX2FuaW1hdGlvbkludGVydmFsID0gbnVsbDtcbiAgfVxuXG4gIHNob3coKSB7XG4gICAgdGhpcy5fc3RhdHVzID0gUkVDT1JESU5HO1xuXG4gICAgbGV0IGkgPSAwO1xuICAgIGxldCBhbmltYXRpb24gPSAnIMK3JztcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUZyYW1lKCkge1xuICAgICAgdmFyIGZyYW1lID0gYW5pbWF0aW9uW2kgJSBhbmltYXRpb24ubGVuZ3RoXTtcbiAgICAgIGkrKztcblxuICAgICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHtcbiAgICAgICAgdGV4dDogZnJhbWVcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHVwZGF0ZUZyYW1lKCk7XG5cbiAgICB0aGlzLl9hbmltYXRpb25JbnRlcnZhbCA9IHNldEludGVydmFsKHVwZGF0ZUZyYW1lLCAxNTApO1xuICB9XG5cbiAgaGlkZSgpIHtcbiAgICB0aGlzLl9zdGF0dXMgPSBJRExFO1xuXG4gICAgaWYgKHRoaXMuX2FuaW1hdGlvbkludGVydmFsKSB7XG4gICAgICBjbGVhckludGVydmFsKHRoaXMuX2FuaW1hdGlvbkludGVydmFsKTtcbiAgICB9XG5cbiAgICBjaHJvbWUuYnJvd3NlckFjdGlvbi5zZXRCYWRnZVRleHQoe1xuICAgICAgdGV4dDogJydcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBSZWNvcmRpbmdJY29uOyIsImNsYXNzIExpc3RlbmVyTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMubGlzdGVuZXJzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuICB9XG5cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbi4nKTtcbiAgICB9XG5cbiAgICB0aGlzLmxpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuICB9XG5cbiAgbm90aWZ5TGlzdGVuZXJzKGRhdGEpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgbGlzdGVuZXIoZGF0YSk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdGVuZXJNYW5hZ2VyOyIsImltcG9ydCBMaXN0ZW5lck1hbmFnZXIgZnJvbSAnLi9saXN0ZW5lci1tYW5hZ2VyLmpzJztcbmNvbnN0IEFDVElWRSA9IDE7XG5jb25zdCBJTkFDVElWRSA9IDI7XG5cbmNsYXNzIFNwZWVjaFJlY29nbml0aW9uIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVjb2duaXRpb24gPSBudWxsO1xuICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuXG4gICAgdGhpcy5vblJlc3VsdCA9IG5ldyBMaXN0ZW5lck1hbmFnZXIoKTtcbiAgICB0aGlzLm9uRW5kID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuICB9XG5cbiAgc3RhcnQoKSB7XG4gICAgdmFyIHJlY29nbml0aW9uID0gbmV3IHdlYmtpdFNwZWVjaFJlY29nbml0aW9uKCk7XG4gICAgcmVjb2duaXRpb24uY29udGludW91cyA9IHRydWU7XG4gICAgLy9yZWNvZ25pdGlvbi5pbnRlcmltUmVzdWx0cyA9IHRydWU7XG5cbiAgICByZWNvZ25pdGlvbi5vbmVuZCA9ICgpID0+IHtcbiAgICAgIHRoaXMuX3N0YXR1cyA9IElOQUNUSVZFO1xuICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoKTtcbiAgICB9O1xuXG4gICAgcmVjb2duaXRpb24ub25yZXN1bHQgPSAoZXZlbnQpID0+IHtcbiAgICAgIGxldCBpbnRlcmltX3RyYW5zY3JpcHQgPSAnJywgZmluYWxfdHJhbnNjcmlwdCA9ICcnO1xuXG4gICAgICBmb3IgKGxldCBpID0gZXZlbnQucmVzdWx0SW5kZXg7IGkgPCBldmVudC5yZXN1bHRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChldmVudC5yZXN1bHRzW2ldLmlzRmluYWwpIHtcbiAgICAgICAgICBmaW5hbF90cmFuc2NyaXB0ICs9IGV2ZW50LnJlc3VsdHNbaV1bMF0udHJhbnNjcmlwdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbnRlcmltX3RyYW5zY3JpcHQgKz0gZXZlbnQucmVzdWx0c1tpXVswXS50cmFuc2NyaXB0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnNvbGUubG9nKCdTcGVlY2hSZWNvZ25pdGlvbicsIGZpbmFsX3RyYW5zY3JpcHQpO1xuICAgICAgdGhpcy5vblJlc3VsdC5ub3RpZnlMaXN0ZW5lcnMoZmluYWxfdHJhbnNjcmlwdCk7XG4gICAgfTtcblxuICAgIHJlY29nbml0aW9uLnN0YXJ0KCk7XG5cbiAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IHJlY29nbml0aW9uO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlY29nbml0aW9uLm9uc3RhcnQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuX3N0YXR1cyA9IEFDVElWRTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfTtcblxuICAgICAgcmVjb2duaXRpb24ub25lcnJvciA9IChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBJTkFDVElWRTtcbiAgICAgICAgdGhpcy5vbkVuZC5ub3RpZnlMaXN0ZW5lcnMoZXZlbnQuZXJyb3IpO1xuICAgICAgICByZWplY3QoZXZlbnQuZXJyb3IpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGlzQWN0aXZlKCkge1xuICAgIHJldHVybiB0aGlzLl9zdGF0dXMgPT09IEFDVElWRTtcbiAgfVxuXG4gIHN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3JlY29nbml0aW9uKSB7XG4gICAgICB0aGlzLl9yZWNvZ25pdGlvbi5zdG9wKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNwZWVjaFJlY29nbml0aW9uO1xuIiwiaW1wb3J0IExpc3RlbmVyTWFuYWdlciBmcm9tICcuL2xpc3RlbmVyLW1hbmFnZXIuanMnO1xuXG5mdW5jdGlvbiBfYXR0YWNoKHRhYklkKSB7XG4gIHZhciBwcm90b2NvbFZlcnNpb24gPSAnMS4xJztcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5hdHRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgcHJvdG9jb2xWZXJzaW9uLCAoKSA9PiB7XG4gICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gX2RldGFjaCh0YWJJZCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5kZXRhY2goe1xuICAgICAgdGFiSWQ6IHRhYklkXG4gICAgfSwgKCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9zZW5kQ29tbWFuZCh0YWJJZCwgY29tbWFuZCwgZGF0YSA9IHt9KSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY2hyb21lLmRlYnVnZ2VyLnNlbmRDb21tYW5kKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sIGNvbW1hbmQsIGRhdGEsIChyZXNwb25zZSkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXNwb25zZS5lcnJvcikge1xuICAgICAgICByZWplY3QocmVzcG9uc2UuZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuICAgIH0pO1xuICB9KTtcbn1cblxuY2xhc3MgVGFiRGVidWdnZXIge1xuICBjb25zdHJ1Y3Rvcih0YWJJZCkge1xuICAgIHRoaXMuX3RhYklkID0gdGFiSWQ7XG4gICAgdGhpcy5fYXR0YWNoZWQgPSB0cnVlO1xuICAgIHRoaXMub25EaXNjb25uZWN0ID0gbmV3IExpc3RlbmVyTWFuYWdlcigpO1xuXG4gICAgY2hyb21lLmRlYnVnZ2VyLm9uRGV0YWNoLmFkZExpc3RlbmVyKChzb3VyY2UsIHJlYXNvbikgPT4ge1xuICAgICAgaWYoc291cmNlLnRhYklkID09PSB0aGlzLl90YWJJZCkge1xuICAgICAgICB0aGlzLl9hdHRhY2hlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLm9uRGlzY29ubmVjdC5ub3RpZnlMaXN0ZW5lcnMoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGNvbm5lY3QoKSB7XG4gICAgcmV0dXJuIF9hdHRhY2godGhpcy5fdGFiSWQpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5fYXR0YWNoZWQgPSB0cnVlO1xuICAgIH0pO1xuICB9XG5cbiAgZGlzY29ubmVjdCgpe1xuICAgIHJldHVybiBfZGV0YWNoKHRoaXMuX3RhYklkKTtcbiAgfVxuXG4gIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9hdHRhY2hlZDtcbiAgfVxuXG4gIHNlbmRDb21tYW5kKGNvbW1hbmQsIGRhdGEpIHtcbiAgICBpZighdGhpcy5fYXR0YWNoZWQpIHtcbiAgICAgIHJldHVybiB0aGlzLmNvbm5lY3QoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIF9zZW5kQ29tbWFuZCh0aGlzLl90YWJJZCwgY29tbWFuZCwgZGF0YSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gX3NlbmRDb21tYW5kKHRoaXMuX3RhYklkLCBjb21tYW5kLCBkYXRhKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBUYWJEZWJ1Z2dlcjsiLCJjbGFzcyBUZXh0VG9TcGVlY2gge1xuICBzcGVhayh0ZXh0KSB7XG4gICAgbGV0IG9wdGlvbnMgPSB7XG4gICAgICBlbnF1ZXVlOiB0cnVlLFxuICAgICAgdm9pY2VOYW1lOiBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndm9pY2VOYW1lJykvL1RPRE8gZG8gbm90IHF1ZXJ5IGxvY2FsU3RvcmFnZSBldmVyeSB0aW1lXG4gICAgfTtcblxuICAgIGNocm9tZS50dHMuc3BlYWsodGV4dCwgb3B0aW9ucyk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGV4dFRvU3BlZWNoOyIsImltcG9ydCBTcGVlY2hSZWNvZ25pdGlvbiBmcm9tICcuL2xpYi9zcGVlY2gtcmVjb2duaXRpb24uanMnO1xuaW1wb3J0IENvbW1hbmRSdW5uZXIgZnJvbSAnLi9saWIvY29tbWFuZC1ydW5uZXIuanMnO1xuaW1wb3J0IFRhYkRlYnVnZ2VyIGZyb20gJy4vbGliL3RhYi1kZWJ1Z2dlci5qcyc7XG5pbXBvcnQge2dldEFjdGl2ZVRhYn0gZnJvbSAnLi9saWIvaGVscGVycy90YWJzLmpzJztcbmltcG9ydCBSZWNvcmRpbmdJY29uIGZyb20gJy4vbGliL3JlY29yZGluZy1pY29uLmpzJztcbmltcG9ydCBUZXh0VG9TcGVlY2ggZnJvbSAnLi9saWIvdGV4dC10by1zcGVlY2guanMnO1xuXG5pbXBvcnQgTm9kZUluc3BlY3Rpb25Db21tYW5kIGZyb20gJy4vbGliL2NvbW1hbmRzL25vZGUtaW5zcGVjdGlvbi5qcyc7XG5pbXBvcnQgTm9kZURlbGV0aW9uQ29tbWFuZCBmcm9tICcuL2xpYi9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzJztcbmltcG9ydCBDU1NDaGFuZ2VDb21tYW5kIGZyb20gJy4vbGliL2NvbW1hbmRzL2Nzcy1jaGFuZ2UuanMnO1xuaW1wb3J0IENTU0dldFZhbHVlQ29tbWFuZCBmcm9tICcuL2xpYi9jb21tYW5kcy9jc3MtZ2V0LXZhbHVlLmpzJztcbmltcG9ydCBVbmRvQ29tbWFuZCBmcm9tICcuL2xpYi9jb21tYW5kcy91bmRvLmpzJztcbmltcG9ydCBSZWRvQ29tbWFuZCBmcm9tICcuL2xpYi9jb21tYW5kcy9yZWRvLmpzJztcblxubGV0IHRleHRUb1NwZWVjaCA9IG5ldyBUZXh0VG9TcGVlY2goKTtcbmxldCByZWNvcmRpbmdJY29uID0gbmV3IFJlY29yZGluZ0ljb24oKTtcbmxldCBjb21tYW5kUnVubmVyID0gbmV3IENvbW1hbmRSdW5uZXIoKTtcblxuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoTm9kZUluc3BlY3Rpb25Db21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKE5vZGVEZWxldGlvbkNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoQ1NTQ2hhbmdlQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChDU1NHZXRWYWx1ZUNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoVW5kb0NvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoUmVkb0NvbW1hbmQpO1xuXG5sZXQgc3BlZWNoUmVjb2duaXRpb24gPSBuZXcgU3BlZWNoUmVjb2duaXRpb24oKTtcbmxldCB0YWJEZWJ1Z2dlciA9IG51bGw7XG5cbnNwZWVjaFJlY29nbml0aW9uLm9uUmVzdWx0LmFkZExpc3RlbmVyKCh0cmFuc2NyaXB0KSA9PiB7XG4gIGNvbW1hbmRSdW5uZXIucmVjb2duaXplKHRyYW5zY3JpcHQpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgIGlmIChyZXN1bHQgJiYgdHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRleHRUb1NwZWVjaC5zcGVhayhyZXN1bHQpO1xuICAgIH1cbiAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0ZXh0VG9TcGVlY2guc3BlYWsoZXJyb3IubWVzc2FnZSk7XG4gICAgfVxuICB9KTtcbn0pO1xuXG5zcGVlY2hSZWNvZ25pdGlvbi5vbkVuZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmICh0YWJEZWJ1Z2dlciAmJiB0YWJEZWJ1Z2dlci5pc0Nvbm5lY3RlZCgpKSB7XG4gICAgdGFiRGVidWdnZXIuZGlzY29ubmVjdCgpO1xuICB9XG4gIHJlY29yZGluZ0ljb24uaGlkZSgpO1xufSk7XG5cbmNocm9tZS5icm93c2VyQWN0aW9uLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmIChzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHNwZWVjaFJlY29nbml0aW9uXG4gICAgLnN0YXJ0KClcbiAgICAudGhlbihnZXRBY3RpdmVUYWIpXG4gICAgLnRoZW4oKHRhYikgPT4ge1xuICAgICAgdGFiRGVidWdnZXIgPSBuZXcgVGFiRGVidWdnZXIodGFiLmlkKTtcbiAgICAgIHRhYkRlYnVnZ2VyLm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLmNvbm5lY3QoKTtcbiAgICB9KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIHJlY29yZGluZ0ljb24uc2hvdygpO1xuICAgICAgY29tbWFuZFJ1bm5lci5zZXRUYWJEZWJ1Z2dlcih0YWJEZWJ1Z2dlcik7XG4gICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBpZiAoZXJyb3IgPT0gJ25vdC1hbGxvd2VkJykge1xuICAgICAgICBjaHJvbWUucnVudGltZS5vcGVuT3B0aW9uc1BhZ2UoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNwZWVjaFJlY29nbml0aW9uLmlzQWN0aXZlKCkpIHtcbiAgICAgICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgfSk7XG59KTsiXX0=
