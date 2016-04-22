var _ = require('lodash');

var Storage = {
  data: {},
  get: getValue,
  set: setValue
};

function getValue(path, defaultValue) {
  return _.get(this.data, path, defaultValue);
}

function setValue(path, value) {
  return _.set(this.data, path, value);
}

module.exports = Storage;
