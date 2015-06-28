class ListenerManager {
  constructor() {
    this.listeners = new Set();
  }

  addListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function.');
    }

    this.listeners.add(listener);
  }

  removeListener(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function.');
    }

    this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach((listener) => {
      listener(data);
    });
  }
}

export default ListenerManager;