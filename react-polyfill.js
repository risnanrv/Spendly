const React = require('C:/Products/Spendly/node_modules/react');

if (!React.useSyncExternalStore) {
  React.useSyncExternalStore = (subscribe, getSnapshot, getServerSnapshot) => {
    if (getServerSnapshot) {
      return getServerSnapshot();
    }
    return getSnapshot();
  };
}

module.exports = React;
