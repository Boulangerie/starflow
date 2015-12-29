var _ = require('lodash');
var starflow = require('../starflow');

function Echo() {

}

//Implement Executable interface just means declare an exec function here.
Echo.prototype.exec = function exec(message, fromStarflowConfig) {
  var formattedMessage = message;
  fromStarflowConfig = !_.isUndefined(fromStarflowConfig);
  if(fromStarflowConfig){
    formattedMessage = JSON.stringify(_.get(starflow.config, message), ' ', 2);
  }
  starflow.logger.log(formattedMessage);
};

module.exports = function () {
  return new Echo();
};
