var chalk = require('chalk');
var _ = require('lodash');

// └┘┼─┴├┤┬┌┐│

function Logger() {
  this.depth = -1;
  this.level = Logger.prototype.LEVEL.NORMAL;
}

Logger.prototype.LEVEL = {
  NONE: 0,
  NORMAL: 1,
  ALL: 2
};

Logger.prototype.SUCCESS_MESSAGE = chalk.green('✓')
Logger.prototype.ERROR_MESSAGE = chalk.red('✗')

var lastLevel;
Logger.prototype.mute = function mute() {
  console.log('mute');
  lastLevel = this.level;
  this.level = Logger.prototype.LEVEL.NONE;
};

Logger.prototype.unmute = function unmute() {
  console.log('unmute. last level', lastLevel);
  this.level = lastLevel || Logger.prototype.LEVEL.NORMAL;
};

Logger.prototype.isMute = function isMute() {
  return this.level === Logger.prototype.LEVEL.NONE;
}

Logger.prototype.header = function header(message) {
  this.depth++;
  this.log(message, 'header');
};

Logger.prototype.footer = function footer(message) {
  this.log(message, 'footer');
  this.depth--;
};

Logger.prototype.error = function error(message) {
  this.log(chalk.red(message));
};

Logger.prototype.success = function success(message) {
  this.log(chalk.green(message));
};

Logger.prototype.warning = function warning(message) {
  this.log(chalk.yellow(message));
};

Logger.prototype.log = function log(message, type) {
  if (this.level > Logger.prototype.LEVEL.NONE) {
    type = type || 'log';
    if (type !== 'log') {
      message = chalk.gray(message);
    }
    console.log(chalk.gray(this.getPaddingText(type)) + ' ' + message);
  }
};

Logger.prototype.getPaddingText = function getPaddingText(type) {
  type = type || 'log';
  var patterns = {
    header: ['┌', '├────┬', '|    '],
    log:    ['|', '|    |', '|    '],
    footer: ['└', '|    └', '|    ']
  };

  var offset = '';
  if (patterns[type]) {
    if (this.depth) {
      for (var i = 0; i < this.depth; i++) {
        offset += (i === this.depth - 1) ? patterns[type][1] : patterns[type][2];
      }
    } else {
      offset += patterns[type][0];
    }
  }
  return offset;
};

/**
 * Build a string to log a task's arguments
 */
Logger.prototype.logArgsStr = function logArgsStr(args) {
  var argsStr = '';
  _.forEach(args, function (arg) {
    if (_.isArray(arg)) {
      var limitElements = 5;

      var firstElements = _.slice(arg, 0, limitElements);
      var str = firstElements.join(', ');
      str += arg.length > limitElements ? '...' : '';
      argsStr += '[' + str + '], ';
    } else if (_.isObject(arg)) {
      argsStr += _logObjectStr(arg) + ', ';
    } else if (_.isBoolean(arg)) {
      argsStr += arg + ', ';
    } else if (arg === '') {
      argsStr += chalk.underline('empty string') + ', ';
    } else {
      argsStr += '"' + arg + '", ';
    }
  });
  // remove last comma
  argsStr = argsStr.replace(/,\s$/, '');
  return argsStr;
};

/**
 * Build a string to log a Javascript object
 * @param obj
 * @returns {string}
 * @private
 */
function _logObjectStr(obj) {
  var splitStr = [];
  var nthKey;
  for (var i = 0; i < 5; i++) {
    nthKey = _.keys(obj)[i];
    if (!_.isUndefined(nthKey)) {
      if (_.isObject(obj[nthKey])) {
        splitStr.push(nthKey + ': {...}');
      } else {
        var quotes = _.isString(obj[nthKey]) ? '"' : '';
        splitStr.push(nthKey + ': ' + quotes + obj[nthKey] + quotes);
      }
    }
  }
  return '{ ' + splitStr.join(', ') + ' }';
}

module.exports = Logger;
