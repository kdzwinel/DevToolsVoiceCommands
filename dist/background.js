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
var $__scripts_47_lib_47_injected_45_console_46_js__ = (function() {
  "use strict";
  var __moduleName = "scripts/lib/injected-console.js";
  var InjectedConsole = function() {
    function InjectedConsole(tabId) {
      this._tabId = tabId;
      chrome.tabs.executeScript(tabId, {file: 'bower_components/traceur-runtime/traceur-runtime.min.js'}, function() {
        chrome.tabs.executeScript(tabId, {file: 'dist/content-script.js'});
      });
    }
    return ($traceurRuntime.createClass)(InjectedConsole, {
      logMessage: function(text) {
        chrome.tabs.sendMessage(this._tabId, {
          type: 'log',
          content: text
        });
      },
      destroy: function() {
        chrome.tabs.sendMessage(this._tabId, {type: 'destroy'});
      }
    }, {});
  }();
  var $__default = InjectedConsole;
  return {get default() {
      return $__default;
    }};
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
  var InjectedConsole = ($__scripts_47_lib_47_injected_45_console_46_js__).default;
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
  var injectedConsole = null;
  speechRecognition.onResult.addListener(function(transcript) {
    injectedConsole.logMessage(("&#9834; \"" + transcript + "\""));
    commandRunner.recognize(transcript).then(function(result) {
      if (result && typeof result === 'string') {
        injectedConsole.logMessage('&#10145; ' + result);
        textToSpeech.speak(result);
      }
    }).catch(function(error) {
      if (error) {
        injectedConsole.logMessage('&#9762; Error: ' + error.message);
        textToSpeech.speak(error.message);
      }
    });
  });
  speechRecognition.onEnd.addListener(function() {
    if (tabDebugger && tabDebugger.isConnected()) {
      tabDebugger.disconnect();
    }
    recordingIcon.hide();
    if (injectedConsole) {
      injectedConsole.destroy();
    }
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
      injectedConsole = new InjectedConsole(tab.id);
      window.ic = injectedConsole;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiIsInNjcmlwdHMvbGliL2NvbW1hbmQtY29udGV4dC5qcyIsInNjcmlwdHMvbGliL2NvbW1hbmQtcnVubmVyLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZC5qcyIsInNjcmlwdHMvbGliL2hlbHBlcnMvY3NzLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZHMvY3NzLWNoYW5nZS5qcyIsInNjcmlwdHMvbGliL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMiLCJzY3JpcHRzL2xpYi9jb21tYW5kcy9ub2RlLWRlbGV0aW9uLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZHMvbm9kZS1pbnNwZWN0aW9uLmpzIiwic2NyaXB0cy9saWIvY29tbWFuZHMvcmVkby5qcyIsInNjcmlwdHMvbGliL2NvbW1hbmRzL3VuZG8uanMiLCJzY3JpcHRzL2xpYi9oZWxwZXJzL3RhYnMuanMiLCJzY3JpcHRzL2xpYi9pbmplY3RlZC1jb25zb2xlLmpzIiwic2NyaXB0cy9saWIvcmVjb3JkaW5nLWljb24uanMiLCJzY3JpcHRzL2xpYi9saXN0ZW5lci1tYW5hZ2VyLmpzIiwic2NyaXB0cy9saWIvc3BlZWNoLXJlY29nbml0aW9uLmpzIiwic2NyaXB0cy9saWIvdGFiLWRlYnVnZ2VyLmpzIiwic2NyaXB0cy9saWIvdGV4dC10by1zcGVlY2guanMiLCJzY3JpcHRzL2JhY2tncm91bmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxBQUFJLElBQUEsQ0FBQSxZQUFXLG1DQUFvQixDQUFDO0lDQTlCLGVBQWEsRUFBbkIsQ0FBQSxTQUFTLEFBQUQ7QUFBUixXQUFNLGVBQWEsQ0FDTCxBQUFELENBQUc7QUFDWixTQUFHLFlBQVksRUFBSSxLQUFHLENBQUM7QUFDdkIsU0FBRyxlQUFlLEVBQUksS0FBRyxDQUFDO0FBQzFCLFNBQUcsd0JBQXdCLEVBQUksS0FBRyxDQUFDO0lBQ3JDO0FBeUJGLEFBNUJVLFNBQU8sQ0FBQSxDQUFDLGVBQWMsWUFBWSxDQUFDLEFBQUM7QUFLNUMscUJB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QUFBQyxDQUFDLFdBQVUsQ0FBQyxDQUFDO0lBQzNDLENBQUMsTUFBTSxBQUFDLENBQUMsU0FBQyxLQUFJLENBQU07QUFDbEIsU0FBSSxLQUFJLEdBQUssY0FBWSxDQUFHO0FBQzFCLGFBQUssUUFBUSxnQkFBZ0IsQUFBQyxFQUFDLENBQUM7TUFDbEM7QUFBQSxBQUVBLFNBQUksaUJBQWdCLFNBQVMsQUFBQyxFQUFDLENBQUc7QUFDaEMsd0JBQWdCLEtBQUssQUFBQyxFQUFDLENBQUM7TUFDMUI7QUFBQSxBQUVBLFlBQU0sSUFBSSxBQUFDLENBQUMsS0FBSSxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0VBQ04sQ0FBQyxDQUFDO0FBMUZGLFdBQXVCIiwiZmlsZSI6Ii9Vc2Vycy9rZHp3aW5lbC9Qcm9qZWN0cy9PUy9EZXZUb29sc1ZvaWNlQ29tbWFuZHMvdGVtcG91dE1DNDBOemN4TkRVME1ETXpPVEEzTlRBei5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCwiY2xhc3MgQ29tbWFuZENvbnRleHQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yb290Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Tm9kZUlkID0gbnVsbDtcbiAgICB0aGlzLl9jb250ZXh0Q1NTUHJvcGVydHlOYW1lID0gbnVsbDtcbiAgfVxuXG4gIGdldENvbnRleHROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Tm9kZUlkKGlkKSB7XG4gICAgdGhpcy5fY29udGV4dE5vZGVJZCA9IGlkO1xuICB9XG5cbiAgc2V0Um9vdE5vZGVJZChpZCkge1xuICAgIHRoaXMuX3Jvb3ROb2RlSWQgPSBpZDtcbiAgfVxuXG4gIGdldFJvb3ROb2RlSWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3Jvb3ROb2RlSWQ7XG4gIH1cblxuICBzZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKG5hbWUpIHtcbiAgICB0aGlzLl9jb250ZXh0Q1NTUHJvcGVydHlOYW1lID0gbmFtZTtcbiAgfVxuXG4gIGdldENvbnRleHRDU1NQcm9wZXJ0eU5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHRDU1NQcm9wZXJ0eU5hbWU7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZENvbnRleHQ7IiwiaW1wb3J0IENvbW1hbmRDb250ZXh0IGZyb20gJy4vY29tbWFuZC1jb250ZXh0LmpzJztcblxuY2xhc3MgQ29tbWFuZFJ1bm5lciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3RhYkRlYnVnZ2VyID0gbnVsbDtcbiAgICB0aGlzLl9jb21tYW5kQ29udGV4dCA9IG5ldyBDb21tYW5kQ29udGV4dCgpO1xuICAgIHRoaXMuX2NvbW1hbmRzID0gbmV3IFNldCgpO1xuICB9XG5cbiAgc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpIHtcbiAgICB0aGlzLl90YWJEZWJ1Z2dlciA9IHRhYkRlYnVnZ2VyO1xuXG4gICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5lbmFibGUnKVxuICAgICAgLnRoZW4odGFiRGVidWdnZXIuc2VuZENvbW1hbmQuYmluZCh0YWJEZWJ1Z2dlciwgJ0NTUy5lbmFibGUnKSlcbiAgICAgIC50aGVuKHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kLmJpbmQodGFiRGVidWdnZXIsICdET00uZ2V0RG9jdW1lbnQnKSlcbiAgICAgIC50aGVuKChkYXRhKSA9PiB7XG4gICAgICAgIGlmKCFkYXRhLnJvb3QpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RvY3VtZW50IHJvb3Qgbm90IGF2YWlsYWJsZS4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbW1hbmRDb250ZXh0LnNldFJvb3ROb2RlSWQoZGF0YS5yb290Lm5vZGVJZCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHJlZ2lzdGVyQ29tbWFuZChjb21tYW5kVHlwZSkge1xuICAgIHRoaXMuX2NvbW1hbmRzLmFkZChuZXcgY29tbWFuZFR5cGUoKSk7XG4gIH1cblxuICByZWNvZ25pemUodGV4dCkge1xuICAgIGxldCBtYXRjaGVzID0gW107XG5cbiAgICAvL2ZpZ3VyZSBvdXQgdGhlIG9yZGVyIGluIHdoaWNoIGNvbW1hbmRzIHNob3VsZCBiZSBjYWxsZWQgKG11c3QgYmUgdGhlIHNhbWUgYXMgaW4gdGhlIHRleHQpXG4gICAgdGhpcy5fY29tbWFuZHMuZm9yRWFjaCgoY29tbWFuZCkgPT4ge1xuICAgICAgbGV0IHBvc2l0aW9uID0gY29tbWFuZC5tYXRjaCh0ZXh0KTtcblxuICAgICAgaWYocG9zaXRpb24gIT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaCh7XG4gICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgY29tbWFuZFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGxldCB0YWJEZWJ1Z2dlciA9IHRoaXMuX3RhYkRlYnVnZ2VyO1xuICAgIGxldCBjb21tYW5kQ29udGV4dCA9IHRoaXMuX2NvbW1hbmRDb250ZXh0O1xuICAgIGxldCBkdW1teVByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWF0Y2hlc1xuICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgcmV0dXJuIGEucG9zaXRpb24gLSBiLnBvc2l0aW9uO1xuICAgICAgfSlcbiAgICAgIC8vY2FsbCBuZXh0IGNvbW1hbmQgb25seSBhZnRlciBwcmV2aW91cyBvbmUgaGFzIGZpbmlzaGVkXG4gICAgICAucmVkdWNlKChwcm9taXNlLCB7Y29tbWFuZH0pID0+IHtcbiAgICAgICAgbGV0IG5leHRDb21tYW5kID0gY29tbWFuZC5leGVjdXRlLmJpbmQoY29tbWFuZCwgdGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KTtcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihuZXh0Q29tbWFuZCk7XG4gICAgICB9LCBkdW1teVByb21pc2UpO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tbWFuZFJ1bm5lcjsiLCJjbGFzcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVnZXggPSAvXiQvaTtcbiAgfVxuXG4gIG1hdGNoKHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5zZWFyY2godGhpcy5fcmVnZXgpO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcblxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbW1hbmQ7IiwiZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTUHJvcGVydHkodGV4dCkge1xuICByZXR1cm4gdGV4dC50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoJyAnLCAnLScpO1xufVxuXG5sZXQgY3NzVW5pdHMgPSB7XG4gIHBpeGVsOiAncHgnLFxuICBwaXhlbHM6ICdweCcsXG4gIGVtOiAnZW0nLFxuICBlbXM6ICdlbScsXG4gIHBlcmNlbnQ6ICclJ1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHRvQ1NTVmFsdWUodmFsdWUsIHVuaXQpIHtcbiAgaWYgKHVuaXQpIHtcbiAgICByZXR1cm4gdmFsdWUgKyBjc3NVbml0c1t1bml0XTtcbiAgfVxuXG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZyb21DU1NWYWx1ZVRvVGV4dChjc3NWYWx1ZSkge1xuICBsZXQgbWF0Y2hlcyA9IGNzc1ZhbHVlLm1hdGNoKC8oWzAtOS5dKylweC9pKTtcblxuICBpZiAobWF0Y2hlcykge1xuICAgIGxldCBudW1WYWx1ZSA9IG1hdGNoZXNbMV07XG5cbiAgICByZXR1cm4gKG51bVZhbHVlID09PSAxKSA/ICdvbmUgcGl4ZWwnIDogbnVtVmFsdWUgKyAnIHBpeGVscyc7XG4gIH1cblxuICByZXR1cm4gY3NzVmFsdWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuaW1wb3J0IHt0b0NTU1Byb3BlcnR5LCB0b0NTU1ZhbHVlfSBmcm9tICcuLi9oZWxwZXJzL2Nzcy5qcyc7XG5cbmNsYXNzIENTU0NoYW5nZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyhjaGFuZ2V8c2V0KSAoaXRzICk/KFxcdysoIFxcdyspPykgdG8gKFxcdyspID8ocGl4ZWx8cGl4ZWxzfHBlcmNlbnR8ZW18ZW1zKT8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIGxldCBwcm9wZXJ0eSA9IHRvQ1NTUHJvcGVydHkobWF0Y2hlc1szXSk7XG4gICAgICBsZXQgdmFsdWUgPSB0b0NTU1ZhbHVlKG1hdGNoZXNbNV0sIG1hdGNoZXNbNl0pO1xuXG4gICAgICBpZihtYXRjaGVzWzNdID09PSAnaXQnKSB7XG4gICAgICAgIHByb3BlcnR5ID0gY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZSgpO1xuICAgICAgfVxuXG4gICAgICBjb21tYW5kQ29udGV4dC5zZXRDb250ZXh0Q1NTUHJvcGVydHlOYW1lKHByb3BlcnR5KTtcblxuICAgICAgbGV0IGNzcyA9ICc7JyArIHByb3BlcnR5ICsgJzogJyArIHZhbHVlICsgJzsnO1xuICAgICAgcmV0dXJuIHRoaXMuYXBwZW5kVG9TdHlsZXMoY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dE5vZGVJZCgpLCBjc3MsIHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZFRvU3R5bGVzKG5vZGVJZCwgdGV4dCwgdGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnQ1NTQ2hhbmdlQ29tbWFuZCcsIG5vZGVJZCwgdGV4dCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29udGV4dC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5nZXRBdHRyaWJ1dGVzJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkudGhlbigoZGF0YSkgPT4ge1xuICAgICAgbGV0IG9sZFN0eWxlVmFsdWUgPSAnJztcblxuICAgICAgaWYoZGF0YS5hdHRyaWJ1dGVzICYmIGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpICE9PSAtMSkge1xuICAgICAgICBsZXQgaWR4T2ZTdHlsZSA9IGRhdGEuYXR0cmlidXRlcy5pbmRleE9mKCdzdHlsZScpO1xuICAgICAgICBvbGRTdHlsZVZhbHVlID0gZGF0YS5hdHRyaWJ1dGVzW2lkeE9mU3R5bGUgKyAxXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uc2V0QXR0cmlidXRlVmFsdWUnLCB7XG4gICAgICAgIG5vZGVJZCxcbiAgICAgICAgbmFtZTogJ3N0eWxlJyxcbiAgICAgICAgdmFsdWU6IG9sZFN0eWxlVmFsdWUgKyB0ZXh0XG4gICAgICB9KTtcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vZGUgbm90IGZvdW5kLicpO1xuICAgIH0pO1xuICB9XG59XG5cbkNTU0NoYW5nZUNvbW1hbmQuZGVzY3JpcHRpb24gPSBgQ2hhbmdlIENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgYnkgc2F5aW5nIFwiY2hhbmdlIGl0cyB4IHRvIHlcIiBvciBcInNldCBpdHMgeCB0byB5XCIgKHdoZXJlIFwieFwiIGlzIHRoZSBuYW1lIG9mIHRoZSBDU1MgcHJvcGVydHkgYW5kIFwieVwiIGlzIHRoZSBuZXcgdmFsdWUpLmA7XG5cbmV4cG9ydCBkZWZhdWx0IENTU0NoYW5nZUNvbW1hbmQ7IiwiaW1wb3J0IENvbW1hbmQgZnJvbSAnLi4vY29tbWFuZC5qcyc7XG5pbXBvcnQge3RvQ1NTUHJvcGVydHksIGZyb21DU1NWYWx1ZVRvVGV4dH0gZnJvbSAnLi4vaGVscGVycy9jc3MuanMnO1xuXG5jbGFzcyBDU1NHZXRWYWx1ZUNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gLyh3aGF0J3N8d2hhdCBpc3xnZXQpKCBpdHMpPyAoXFx3KyggXFx3Kyk/KS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYobWF0Y2hlcykge1xuICAgICAgbGV0IHByb3BlcnR5ID0gdG9DU1NQcm9wZXJ0eShtYXRjaGVzWzNdKTtcblxuICAgICAgY29tbWFuZENvbnRleHQuc2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZShwcm9wZXJ0eSk7XG4gICAgICByZXR1cm4gdGhpcy5nZXRDb21wdXRlZFZhbHVlKHByb3BlcnR5LCBjb21tYW5kQ29udGV4dC5nZXRDb250ZXh0Tm9kZUlkKCksIHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldENvbXB1dGVkVmFsdWUocHJvcGVydHksIG5vZGVJZCwgdGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnQ1NTR2V0VmFsdWVDb21tYW5kJywgcHJvcGVydHksIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29udGV4dC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0NTUy5nZXRDb21wdXRlZFN0eWxlRm9yTm9kZScsIHtcbiAgICAgIG5vZGVJZFxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIGxldCBpdGVtID0gZGF0YS5jb21wdXRlZFN0eWxlLmZpbmQoKGl0ZW0pID0+IHtcbiAgICAgICAgcmV0dXJuIGl0ZW0ubmFtZSA9PT0gcHJvcGVydHk7XG4gICAgICB9KTtcblxuICAgICAgaWYoaXRlbSkge1xuICAgICAgICByZXR1cm4gcHJvcGVydHkgKyAnIHZhbHVlIGlzICcgKyBmcm9tQ1NTVmFsdWVUb1RleHQoaXRlbS52YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJ1Byb3BlcnR5ICcgKyBwcm9wZXJ0eSArICcgbm90IGZvdW5kLic7XG4gICAgICB9XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5DU1NHZXRWYWx1ZUNvbW1hbmQuZGVzY3JpcHRpb24gPSBgR2V0IGNvbXB1dGVkIENTUyBwcm9wZXJ0eSB2YWx1ZSBvZiBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgYnkgc2F5aW5nIFwiZ2V0IGl0cyB4XCIgb3IgXCJ3aGF0J3MgaXRzIHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIENTUyBwcm9wZXJ0eSkuYDtcblxuZXhwb3J0IGRlZmF1bHQgQ1NTR2V0VmFsdWVDb21tYW5kOyIsImltcG9ydCBDb21tYW5kIGZyb20gJy4uL2NvbW1hbmQuanMnO1xuXG5jbGFzcyBOb2RlRGVsZXRpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oZGVsZXRlfHJlbW92ZSkgaXQvaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlbW92ZU5vZGUoY29tbWFuZENvbnRleHQuZ2V0Q29udGV4dE5vZGVJZCgpLCB0YWJEZWJ1Z2dlcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHJlamVjdCgnVGV4dCBkb2VzblxcJ3QgbWF0Y2ggdGhlIGNvbW1hbmQuJyk7XG4gICAgfSk7XG4gIH1cblxuICByZW1vdmVOb2RlKG5vZGVJZCwgdGFiRGVidWdnZXIpIHtcbiAgICBjb25zb2xlLmxvZygnTm9kZURlbGV0aW9uQ29tbWFuZCcsIG5vZGVJZCk7XG5cbiAgICBpZighbm9kZUlkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29udGV4dC4nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZW1vdmVOb2RlJywge1xuICAgICAgbm9kZUlkXG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb2RlIG5vdCBmb3VuZC4nKTtcbiAgICB9KTtcbiAgfVxufVxuXG5Ob2RlRGVsZXRpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFJlbW92ZSBjdXJyZW50bHkgaW5zcGVjdGVkIG5vZGUgd2l0aCBcInJlbW92ZSBpdFwiIG9yIFwiZGVsZXRlIGl0XCIuYDtcblxuZXhwb3J0IGRlZmF1bHQgTm9kZURlbGV0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY29uc3QgSElHSExJR0hUX0NPTE9SID0ge1xuICByOiAxNTUsXG4gIGc6IDExLFxuICBiOiAyMzksXG4gIGE6IDAuN1xufTtcbmNvbnN0IEhJR0hMSUdIVF9USU1FT1VUID0gMjAwMDtcblxuY2xhc3MgTm9kZUluc3BlY3Rpb25Db21tYW5kIGV4dGVuZHMgQ29tbWFuZCB7XG4gIGNvbnN0cnVjdG9yKGNvbW1hbmRSdW5uZXIpIHtcbiAgICBzdXBlcihjb21tYW5kUnVubmVyKTtcbiAgICB0aGlzLl9yZWdleCA9IC8oc2VsZWN0fGluc3BlY3QpIChcXHcrKS9pO1xuICB9XG5cbiAgZXhlY3V0ZSh0ZXh0LCB0YWJEZWJ1Z2dlciwgY29tbWFuZENvbnRleHQpIHtcbiAgICBsZXQgbWF0Y2hlcyA9IHRleHQubWF0Y2godGhpcy5fcmVnZXgpO1xuXG4gICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnNlbGVjdE5vZGUobWF0Y2hlc1syXSArICcsICMnICsgbWF0Y2hlc1syXSArICcsIC4nICsgbWF0Y2hlc1syXSwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHNlbGVjdE5vZGUoc2VsZWN0b3IsIHRhYkRlYnVnZ2VyLCBjb21tYW5kQ29udGV4dCkge1xuICAgIGNvbnNvbGUubG9nKCdOb2RlSW5zcGVjdGlvbkNvbW1hbmQnLCBzZWxlY3Rvcik7XG5cbiAgICBsZXQgcm9vdE5vZGVJZCA9IGNvbW1hbmRDb250ZXh0LmdldFJvb3ROb2RlSWQoKTtcblxuICAgIHJldHVybiB0YWJEZWJ1Z2dlci5zZW5kQ29tbWFuZCgnRE9NLnF1ZXJ5U2VsZWN0b3InLCB7XG4gICAgICBub2RlSWQ6IHJvb3ROb2RlSWQsXG4gICAgICBzZWxlY3RvclxuICAgIH0pLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIC8vd2hlbiBubyByZXN1bHRzIEFQSSByZXR1cm5zIG5vZGVJZCA9PT0gMFxuICAgICAgaWYoIWRhdGEubm9kZUlkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbW1hbmRDb250ZXh0LnNldENvbnRleHROb2RlSWQoZGF0YS5ub2RlSWQpO1xuICAgICAgY29tbWFuZENvbnRleHQuc2V0Q29udGV4dENTU1Byb3BlcnR5TmFtZShudWxsKTtcblxuICAgICAgcmV0dXJuIHRhYkRlYnVnZ2VyLnNlbmRDb21tYW5kKCdET00uaGlnaGxpZ2h0Tm9kZScsIHtcbiAgICAgICAgaGlnaGxpZ2h0Q29uZmlnOiB7XG4gICAgICAgICAgY29udGVudENvbG9yOiBISUdITElHSFRfQ09MT1IsXG4gICAgICAgICAgc2hvd0luZm86IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgbm9kZUlkOiBkYXRhLm5vZGVJZFxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vc3RvcCBoaWdobGlnaHRpbmcgYWZ0ZXIgY291cGxlIG9mIHNlY29uZHNcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5oaWRlSGlnaGxpZ2h0Jyk7XG4gICAgICAgIH0sIEhJR0hMSUdIVF9USU1FT1VUKTtcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZSBub3QgZm91bmQuJyk7XG4gICAgfSk7XG4gIH1cbn1cblxuTm9kZUluc3BlY3Rpb25Db21tYW5kLmRlc2NyaXB0aW9uID0gYFNlbGVjdCBET00gbm9kZXMgd2l0aCBcInNlbGVjdCB4XCIgb3IgXCJpbnNwZWN0IHhcIiAod2hlcmUgXCJ4XCIgaXMgdGhlIG5hbWUgb2YgdGhlIHRhZywgaWQgb3IgQ1NTIGNsYXNzKS4gSWYgbXVsdGlwbGUgbm9kZXMgbWF0Y2gsIG9ubHkgdGhlIGZpcnN0IG9uZSB3aWxsIGJlIHNlbGVjdGVkLmA7XG5cbmV4cG9ydCBkZWZhdWx0IE5vZGVJbnNwZWN0aW9uQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgUmVkb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3JlZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ1JlZG9Db21tYW5kJyk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS5yZWRvJyk7XG4gIH1cbn1cblxuUmVkb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgUmVkbyBsYXN0IGNvbW1hbmQgd2l0aCBcInJlZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBSZWRvQ29tbWFuZDsiLCJpbXBvcnQgQ29tbWFuZCBmcm9tICcuLi9jb21tYW5kLmpzJztcblxuY2xhc3MgVW5kb0NvbW1hbmQgZXh0ZW5kcyBDb21tYW5kIHtcbiAgY29uc3RydWN0b3IoY29tbWFuZFJ1bm5lcikge1xuICAgIHN1cGVyKGNvbW1hbmRSdW5uZXIpO1xuICAgIHRoaXMuX3JlZ2V4ID0gL3VuZG8vaTtcbiAgfVxuXG4gIGV4ZWN1dGUodGV4dCwgdGFiRGVidWdnZXIsIGNvbW1hbmRDb250ZXh0KSB7XG4gICAgbGV0IG1hdGNoZXMgPSB0ZXh0Lm1hdGNoKHRoaXMuX3JlZ2V4KTtcblxuICAgIGlmKG1hdGNoZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLnVuZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcmVqZWN0KCdUZXh0IGRvZXNuXFwndCBtYXRjaCB0aGUgY29tbWFuZC4nKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVuZG9MYXN0QWN0aW9uKHRhYkRlYnVnZ2VyKSB7XG4gICAgY29uc29sZS5sb2coJ1VuZG9Db21tYW5kJyk7XG5cbiAgICByZXR1cm4gdGFiRGVidWdnZXIuc2VuZENvbW1hbmQoJ0RPTS51bmRvJyk7XG4gIH1cbn1cblxuVW5kb0NvbW1hbmQuZGVzY3JpcHRpb24gPSBgVW5kbyBsYXN0IGNvbW1hbmQgd2l0aCBcInVuZG9cIi5gO1xuXG5leHBvcnQgZGVmYXVsdCBVbmRvQ29tbWFuZDsiLCJleHBvcnQgZnVuY3Rpb24gZ2V0QWN0aXZlVGFiKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS50YWJzLnF1ZXJ5KHthY3RpdmU6IHRydWV9LCAodGFicykgPT4ge1xuICAgICAgaWYgKHRhYnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUodGFic1swXSk7XG4gICAgfSlcbiAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHt9OyIsImNsYXNzIEluamVjdGVkQ29uc29sZSB7XG4gIGNvbnN0cnVjdG9yKHRhYklkKSB7XG4gICAgdGhpcy5fdGFiSWQgPSB0YWJJZDtcblxuICAgIGNocm9tZS50YWJzLmV4ZWN1dGVTY3JpcHQodGFiSWQsIHtcbiAgICAgIGZpbGU6ICdib3dlcl9jb21wb25lbnRzL3RyYWNldXItcnVudGltZS90cmFjZXVyLXJ1bnRpbWUubWluLmpzJ1xuICAgIH0sICgpID0+IHtcbiAgICAgIGNocm9tZS50YWJzLmV4ZWN1dGVTY3JpcHQodGFiSWQsIHtcbiAgICAgICAgZmlsZTogJ2Rpc3QvY29udGVudC1zY3JpcHQuanMnXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGxvZ01lc3NhZ2UodGV4dCkge1xuICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRoaXMuX3RhYklkLCB7XG4gICAgICB0eXBlOiAnbG9nJyxcbiAgICAgIGNvbnRlbnQ6IHRleHRcbiAgICB9KTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UodGhpcy5fdGFiSWQsIHtcbiAgICAgIHR5cGU6ICdkZXN0cm95J1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEluamVjdGVkQ29uc29sZTsiLCJjb25zdCBJRExFID0gMTtcbmNvbnN0IFJFQ09SRElORyA9IDI7XG5cbmNsYXNzIFJlY29yZGluZ0ljb24ge1xuICBjb25zdHJ1Y3QoKSB7XG4gICAgdGhpcy5fc3RhdHVzID0gSURMRTtcbiAgICB0aGlzLl9hbmltYXRpb25JbnRlcnZhbCA9IG51bGw7XG4gIH1cblxuICBzaG93KCkge1xuICAgIHRoaXMuX3N0YXR1cyA9IFJFQ09SRElORztcblxuICAgIGxldCBpID0gMDtcbiAgICBsZXQgYW5pbWF0aW9uID0gJyDCtyc7XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVGcmFtZSgpIHtcbiAgICAgIHZhciBmcmFtZSA9IGFuaW1hdGlvbltpICUgYW5pbWF0aW9uLmxlbmd0aF07XG4gICAgICBpKys7XG5cbiAgICAgIGNocm9tZS5icm93c2VyQWN0aW9uLnNldEJhZGdlVGV4dCh7XG4gICAgICAgIHRleHQ6IGZyYW1lXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB1cGRhdGVGcmFtZSgpO1xuXG4gICAgdGhpcy5fYW5pbWF0aW9uSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh1cGRhdGVGcmFtZSwgMTUwKTtcbiAgfVxuXG4gIGhpZGUoKSB7XG4gICAgdGhpcy5fc3RhdHVzID0gSURMRTtcblxuICAgIGlmICh0aGlzLl9hbmltYXRpb25JbnRlcnZhbCkge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLl9hbmltYXRpb25JbnRlcnZhbCk7XG4gICAgfVxuXG4gICAgY2hyb21lLmJyb3dzZXJBY3Rpb24uc2V0QmFkZ2VUZXh0KHtcbiAgICAgIHRleHQ6ICcnXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUmVjb3JkaW5nSWNvbjsiLCJjbGFzcyBMaXN0ZW5lck1hbmFnZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmxpc3RlbmVycyA9IG5ldyBTZXQoKTtcbiAgfVxuXG4gIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgdGhpcy5saXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdMaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgfVxuXG4gICAgdGhpcy5saXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgfVxuXG4gIG5vdGlmeUxpc3RlbmVycyhkYXRhKSB7XG4gICAgdGhpcy5saXN0ZW5lcnMuZm9yRWFjaCgobGlzdGVuZXIpID0+IHtcbiAgICAgIGxpc3RlbmVyKGRhdGEpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RlbmVyTWFuYWdlcjsiLCJpbXBvcnQgTGlzdGVuZXJNYW5hZ2VyIGZyb20gJy4vbGlzdGVuZXItbWFuYWdlci5qcyc7XG5jb25zdCBBQ1RJVkUgPSAxO1xuY29uc3QgSU5BQ1RJVkUgPSAyO1xuXG5jbGFzcyBTcGVlY2hSZWNvZ25pdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3JlY29nbml0aW9uID0gbnVsbDtcbiAgICB0aGlzLl9zdGF0dXMgPSBJTkFDVElWRTtcblxuICAgIHRoaXMub25SZXN1bHQgPSBuZXcgTGlzdGVuZXJNYW5hZ2VyKCk7XG4gICAgdGhpcy5vbkVuZCA9IG5ldyBMaXN0ZW5lck1hbmFnZXIoKTtcbiAgfVxuXG4gIHN0YXJ0KCkge1xuICAgIHZhciByZWNvZ25pdGlvbiA9IG5ldyB3ZWJraXRTcGVlY2hSZWNvZ25pdGlvbigpO1xuICAgIHJlY29nbml0aW9uLmNvbnRpbnVvdXMgPSB0cnVlO1xuICAgIC8vcmVjb2duaXRpb24uaW50ZXJpbVJlc3VsdHMgPSB0cnVlO1xuXG4gICAgcmVjb2duaXRpb24ub25lbmQgPSAoKSA9PiB7XG4gICAgICB0aGlzLl9zdGF0dXMgPSBJTkFDVElWRTtcbiAgICAgIHRoaXMub25FbmQubm90aWZ5TGlzdGVuZXJzKCk7XG4gICAgfTtcblxuICAgIHJlY29nbml0aW9uLm9ucmVzdWx0ID0gKGV2ZW50KSA9PiB7XG4gICAgICBsZXQgaW50ZXJpbV90cmFuc2NyaXB0ID0gJycsIGZpbmFsX3RyYW5zY3JpcHQgPSAnJztcblxuICAgICAgZm9yIChsZXQgaSA9IGV2ZW50LnJlc3VsdEluZGV4OyBpIDwgZXZlbnQucmVzdWx0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoZXZlbnQucmVzdWx0c1tpXS5pc0ZpbmFsKSB7XG4gICAgICAgICAgZmluYWxfdHJhbnNjcmlwdCArPSBldmVudC5yZXN1bHRzW2ldWzBdLnRyYW5zY3JpcHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW50ZXJpbV90cmFuc2NyaXB0ICs9IGV2ZW50LnJlc3VsdHNbaV1bMF0udHJhbnNjcmlwdDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zb2xlLmxvZygnU3BlZWNoUmVjb2duaXRpb24nLCBmaW5hbF90cmFuc2NyaXB0KTtcbiAgICAgIHRoaXMub25SZXN1bHQubm90aWZ5TGlzdGVuZXJzKGZpbmFsX3RyYW5zY3JpcHQpO1xuICAgIH07XG5cbiAgICByZWNvZ25pdGlvbi5zdGFydCgpO1xuXG4gICAgdGhpcy5fcmVjb2duaXRpb24gPSByZWNvZ25pdGlvbjtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWNvZ25pdGlvbi5vbnN0YXJ0ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBBQ1RJVkU7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH07XG5cbiAgICAgIHJlY29nbml0aW9uLm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5fc3RhdHVzID0gSU5BQ1RJVkU7XG4gICAgICAgIHRoaXMub25FbmQubm90aWZ5TGlzdGVuZXJzKGV2ZW50LmVycm9yKTtcbiAgICAgICAgcmVqZWN0KGV2ZW50LmVycm9yKTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBpc0FjdGl2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSBBQ1RJVkU7XG4gIH1cblxuICBzdG9wKCkge1xuICAgIGlmICh0aGlzLl9yZWNvZ25pdGlvbikge1xuICAgICAgdGhpcy5fcmVjb2duaXRpb24uc3RvcCgpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTcGVlY2hSZWNvZ25pdGlvbjtcbiIsImltcG9ydCBMaXN0ZW5lck1hbmFnZXIgZnJvbSAnLi9saXN0ZW5lci1tYW5hZ2VyLmpzJztcblxuZnVuY3Rpb24gX2F0dGFjaCh0YWJJZCkge1xuICB2YXIgcHJvdG9jb2xWZXJzaW9uID0gJzEuMSc7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUuZGVidWdnZXIuYXR0YWNoKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sIHByb3RvY29sVmVyc2lvbiwgKCkgPT4ge1xuICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmUoKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIF9kZXRhY2godGFiSWQpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjaHJvbWUuZGVidWdnZXIuZGV0YWNoKHtcbiAgICAgIHRhYklkOiB0YWJJZFxuICAgIH0sICgpID0+IHtcbiAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfc2VuZENvbW1hbmQodGFiSWQsIGNvbW1hbmQsIGRhdGEgPSB7fSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNocm9tZS5kZWJ1Z2dlci5zZW5kQ29tbWFuZCh7XG4gICAgICB0YWJJZDogdGFiSWRcbiAgICB9LCBjb21tYW5kLCBkYXRhLCAocmVzcG9uc2UpID0+IHtcbiAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvci5tZXNzYWdlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KHJlc3BvbnNlLmVycm9yKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmNsYXNzIFRhYkRlYnVnZ2VyIHtcbiAgY29uc3RydWN0b3IodGFiSWQpIHtcbiAgICB0aGlzLl90YWJJZCA9IHRhYklkO1xuICAgIHRoaXMuX2F0dGFjaGVkID0gdHJ1ZTtcbiAgICB0aGlzLm9uRGlzY29ubmVjdCA9IG5ldyBMaXN0ZW5lck1hbmFnZXIoKTtcblxuICAgIGNocm9tZS5kZWJ1Z2dlci5vbkRldGFjaC5hZGRMaXN0ZW5lcigoc291cmNlLCByZWFzb24pID0+IHtcbiAgICAgIGlmKHNvdXJjZS50YWJJZCA9PT0gdGhpcy5fdGFiSWQpIHtcbiAgICAgICAgdGhpcy5fYXR0YWNoZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vbkRpc2Nvbm5lY3Qubm90aWZ5TGlzdGVuZXJzKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIHJldHVybiBfYXR0YWNoKHRoaXMuX3RhYklkKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMuX2F0dGFjaGVkID0gdHJ1ZTtcbiAgICB9KTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3QoKXtcbiAgICByZXR1cm4gX2RldGFjaCh0aGlzLl90YWJJZCk7XG4gIH1cblxuICBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5fYXR0YWNoZWQ7XG4gIH1cblxuICBzZW5kQ29tbWFuZChjb21tYW5kLCBkYXRhKSB7XG4gICAgaWYoIXRoaXMuX2F0dGFjaGVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5jb25uZWN0KCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiBfc2VuZENvbW1hbmQodGhpcy5fdGFiSWQsIGNvbW1hbmQsIGRhdGEpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIF9zZW5kQ29tbWFuZCh0aGlzLl90YWJJZCwgY29tbWFuZCwgZGF0YSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgVGFiRGVidWdnZXI7IiwiY2xhc3MgVGV4dFRvU3BlZWNoIHtcbiAgc3BlYWsodGV4dCkge1xuICAgIGxldCBvcHRpb25zID0ge1xuICAgICAgZW5xdWV1ZTogdHJ1ZSxcbiAgICAgIHZvaWNlTmFtZTogbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3ZvaWNlTmFtZScpLy9UT0RPIGRvIG5vdCBxdWVyeSBsb2NhbFN0b3JhZ2UgZXZlcnkgdGltZVxuICAgIH07XG5cbiAgICBjaHJvbWUudHRzLnNwZWFrKHRleHQsIG9wdGlvbnMpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRleHRUb1NwZWVjaDsiLCJpbXBvcnQgU3BlZWNoUmVjb2duaXRpb24gZnJvbSAnLi9saWIvc3BlZWNoLXJlY29nbml0aW9uLmpzJztcbmltcG9ydCBDb21tYW5kUnVubmVyIGZyb20gJy4vbGliL2NvbW1hbmQtcnVubmVyLmpzJztcbmltcG9ydCBUYWJEZWJ1Z2dlciBmcm9tICcuL2xpYi90YWItZGVidWdnZXIuanMnO1xuaW1wb3J0IHtnZXRBY3RpdmVUYWJ9IGZyb20gJy4vbGliL2hlbHBlcnMvdGFicy5qcyc7XG5pbXBvcnQgUmVjb3JkaW5nSWNvbiBmcm9tICcuL2xpYi9yZWNvcmRpbmctaWNvbi5qcyc7XG5pbXBvcnQgVGV4dFRvU3BlZWNoIGZyb20gJy4vbGliL3RleHQtdG8tc3BlZWNoLmpzJztcbmltcG9ydCBJbmplY3RlZENvbnNvbGUgZnJvbSAnLi9saWIvaW5qZWN0ZWQtY29uc29sZS5qcyc7XG5cbmltcG9ydCBOb2RlSW5zcGVjdGlvbkNvbW1hbmQgZnJvbSAnLi9saWIvY29tbWFuZHMvbm9kZS1pbnNwZWN0aW9uLmpzJztcbmltcG9ydCBOb2RlRGVsZXRpb25Db21tYW5kIGZyb20gJy4vbGliL2NvbW1hbmRzL25vZGUtZGVsZXRpb24uanMnO1xuaW1wb3J0IENTU0NoYW5nZUNvbW1hbmQgZnJvbSAnLi9saWIvY29tbWFuZHMvY3NzLWNoYW5nZS5qcyc7XG5pbXBvcnQgQ1NTR2V0VmFsdWVDb21tYW5kIGZyb20gJy4vbGliL2NvbW1hbmRzL2Nzcy1nZXQtdmFsdWUuanMnO1xuaW1wb3J0IFVuZG9Db21tYW5kIGZyb20gJy4vbGliL2NvbW1hbmRzL3VuZG8uanMnO1xuaW1wb3J0IFJlZG9Db21tYW5kIGZyb20gJy4vbGliL2NvbW1hbmRzL3JlZG8uanMnO1xuXG5sZXQgdGV4dFRvU3BlZWNoID0gbmV3IFRleHRUb1NwZWVjaCgpO1xubGV0IHJlY29yZGluZ0ljb24gPSBuZXcgUmVjb3JkaW5nSWNvbigpO1xubGV0IGNvbW1hbmRSdW5uZXIgPSBuZXcgQ29tbWFuZFJ1bm5lcigpO1xuXG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChOb2RlSW5zcGVjdGlvbkNvbW1hbmQpO1xuY29tbWFuZFJ1bm5lci5yZWdpc3RlckNvbW1hbmQoTm9kZURlbGV0aW9uQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChDU1NDaGFuZ2VDb21tYW5kKTtcbmNvbW1hbmRSdW5uZXIucmVnaXN0ZXJDb21tYW5kKENTU0dldFZhbHVlQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChVbmRvQ29tbWFuZCk7XG5jb21tYW5kUnVubmVyLnJlZ2lzdGVyQ29tbWFuZChSZWRvQ29tbWFuZCk7XG5cbmxldCBzcGVlY2hSZWNvZ25pdGlvbiA9IG5ldyBTcGVlY2hSZWNvZ25pdGlvbigpO1xubGV0IHRhYkRlYnVnZ2VyID0gbnVsbDtcbmxldCBpbmplY3RlZENvbnNvbGUgPSBudWxsO1xuXG5zcGVlY2hSZWNvZ25pdGlvbi5vblJlc3VsdC5hZGRMaXN0ZW5lcigodHJhbnNjcmlwdCkgPT4ge1xuICBpbmplY3RlZENvbnNvbGUubG9nTWVzc2FnZShgJiM5ODM0OyBcIiR7dHJhbnNjcmlwdH1cImApO1xuXG4gIGNvbW1hbmRSdW5uZXIucmVjb2duaXplKHRyYW5zY3JpcHQpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgIGlmIChyZXN1bHQgJiYgdHlwZW9mIHJlc3VsdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGluamVjdGVkQ29uc29sZS5sb2dNZXNzYWdlKCcmIzEwMTQ1OyAnICsgcmVzdWx0KTtcbiAgICAgIHRleHRUb1NwZWVjaC5zcGVhayhyZXN1bHQpO1xuICAgIH1cbiAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgaWYgKGVycm9yKSB7XG4gICAgICBpbmplY3RlZENvbnNvbGUubG9nTWVzc2FnZSgnJiM5NzYyOyBFcnJvcjogJyArIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgdGV4dFRvU3BlZWNoLnNwZWFrKGVycm9yLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSk7XG59KTtcblxuc3BlZWNoUmVjb2duaXRpb24ub25FbmQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICBpZiAodGFiRGVidWdnZXIgJiYgdGFiRGVidWdnZXIuaXNDb25uZWN0ZWQoKSkge1xuICAgIHRhYkRlYnVnZ2VyLmRpc2Nvbm5lY3QoKTtcbiAgfVxuICByZWNvcmRpbmdJY29uLmhpZGUoKTtcbiAgaWYoaW5qZWN0ZWRDb25zb2xlKSB7XG4gICAgaW5qZWN0ZWRDb25zb2xlLmRlc3Ryb3koKTtcbiAgfVxufSk7XG5cbmNocm9tZS5icm93c2VyQWN0aW9uLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gIGlmIChzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgc3BlZWNoUmVjb2duaXRpb24uc3RvcCgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHNwZWVjaFJlY29nbml0aW9uXG4gICAgLnN0YXJ0KClcbiAgICAudGhlbihnZXRBY3RpdmVUYWIpXG4gICAgLnRoZW4oKHRhYikgPT4ge1xuICAgICAgdGFiRGVidWdnZXIgPSBuZXcgVGFiRGVidWdnZXIodGFiLmlkKTtcbiAgICAgIHRhYkRlYnVnZ2VyLm9uRGlzY29ubmVjdC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICAgIH0pO1xuXG4gICAgICBpbmplY3RlZENvbnNvbGUgPSBuZXcgSW5qZWN0ZWRDb25zb2xlKHRhYi5pZCk7XG4gICAgICB3aW5kb3cuaWMgPSBpbmplY3RlZENvbnNvbGU7XG5cbiAgICAgIHJldHVybiB0YWJEZWJ1Z2dlci5jb25uZWN0KCk7XG4gICAgfSlcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICByZWNvcmRpbmdJY29uLnNob3coKTtcbiAgICAgIGNvbW1hbmRSdW5uZXIuc2V0VGFiRGVidWdnZXIodGFiRGVidWdnZXIpO1xuICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgaWYgKGVycm9yID09ICdub3QtYWxsb3dlZCcpIHtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub3Blbk9wdGlvbnNQYWdlKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzcGVlY2hSZWNvZ25pdGlvbi5pc0FjdGl2ZSgpKSB7XG4gICAgICAgIHNwZWVjaFJlY29nbml0aW9uLnN0b3AoKTtcbiAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIH0pO1xufSk7Il19
