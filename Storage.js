var _ = require('lodash');

var Storage =  {
  data: {},
  get: getValue,
  set: setValue
};

function getValue(path) {
  return _.get(this.data, path);
}

function setValue(path, value) {
  _.set(this.data, path, value);
}

module.exports = Storage;
