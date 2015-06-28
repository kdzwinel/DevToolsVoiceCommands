class CommandContext {
  constructor() {
    this._rootNodeId = null;
    this._contextNodeId = null;
    this._contextCSSPropertyName = null;
  }

  getContextNodeId() {
    return this._contextNodeId;
  }

  setContextNodeId(id) {
    this._contextNodeId = id;
  }

  setRootNodeId(id) {
    this._rootNodeId = id;
  }

  getRootNodeId() {
    return this._rootNodeId;
  }

  setContextCSSPropertyName(name) {
    this._contextCSSPropertyName = name;
  }

  getContextCSSPropertyName() {
    return this._contextCSSPropertyName;
  }
}

export default CommandContext;