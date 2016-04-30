var _ = require('lodash');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function Echo() {
  BaseExecutable.call(this, 'echo');
}
Echo.prototype = Object.create(BaseExecutable.prototype);
Echo.prototype.constructor = Echo;

Echo.prototype.exec = function exec(message/*, fromStarflowConfig*/) {
  var formattedMessage = message;
  // fromStarflowConfig = !_.isUndefined(fromStarflowConfig);
  // if (fromStarflowConfig) {
  //   formattedMessage = JSON.stringify(this.storage.get(message), ' ', 2);
  // }
  starflow.logger.log(formattedMessage);
};

module.exports = function () {
  return new Echo();
};
