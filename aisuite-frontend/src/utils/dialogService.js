let _handler = null;

export const registerDialogHandler = (fn) => {
  _handler = fn;
};

export const confirm = (message) => {
  if (_handler) {
    return new Promise((resolve) => {
      _handler({ type: 'confirm', message, resolve });
    });
  }
  // Fallback to native
  return Promise.resolve(window.confirm(message));
};

export const alert = (message) => {
  if (_handler) {
    return new Promise((resolve) => {
      _handler({ type: 'alert', message, resolve });
    });
  }
  window.alert(message);
  return Promise.resolve();
};

export const prompt = (message, defaultValue = '') => {
  if (_handler) {
    return new Promise((resolve) => {
      _handler({ type: 'prompt', message, defaultValue, resolve });
    });
  }
  const res = window.prompt(message, defaultValue);
  return Promise.resolve(res);
};

export default { registerDialogHandler, confirm, alert };
