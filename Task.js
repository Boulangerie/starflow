var _ = require('lodash');
var mustache = require('mustache');

function Task(instance, args, name, description) {
  this.instance = instance;
  this.args = args || [];
  this.name = name || '';
  this.description = description || '';
}

Task.prototype.instance = null;
Task.prototype.args = null;
Task.prototype.name = '';
Task.prototype.description = '';

Task.prototype.interpolate = function interpolate(context) {

  // parse each argument with Mustache
  this.args = _.map(this.args, function (arg) {
    if (_.isString(arg)) {
      // do not escape HTML special characters like "<", ">" and "/"
      //arg = arg.replace(/\{\{([^&])/g, '{{&\$1');
      arg = mustache.render(arg, context);
    }
    return arg;
  });

};

module.exports = Task;
