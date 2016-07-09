var chalk = require('chalk');
var os = require('os');
var _ = require('lodash');

// └┘┼─┴├┤┬┌┐│

function Logger() {
  this.depth = -1;
  this.depthLimit = -1;
  this.level = Logger.prototype.LEVEL.NORMAL;
}

Logger.prototype.LEVEL = {
  NONE: 0,
  NORMAL: 1,
  ALL: 2
};

Logger.prototype.SUCCESS_MESSAGE = chalk.green('✓');
Logger.prototype.ERROR_MESSAGE = chalk.red('✗');

var lastLevel;
Logger.prototype.mute = function mute() {
  lastLevel = this.level;
  this.level = Logger.prototype.LEVEL.NONE;
};

Logger.prototype.unmute = function unmute() {
  this.level = lastLevel || Logger.prototype.LEVEL.NORMAL;
};

Logger.prototype.isMute = function isMute() {
  return this.level === Logger.prototype.LEVEL.NONE;
};

Logger.prototype.setDepthLimit = function setDepthLimit(limit) {
  this.depthLimit = limit;
};

Logger.prototype.header = function header(message) {
  this.depth++;
  this.log(chalk.gray(message), 'header');
};

Logger.prototype.footer = function footer(message) {
  this.log(chalk.gray(message), 'footer');
  this.depth--;
};

Logger.prototype.debug = function debug(message) {
  if (process.env.DEBUG) {
    this.applyEachLine(message, function (line) {
      this.log(chalk.magenta(line), 'debug');
    }.bind(this));
  }
};

Logger.prototype.error = function error(message) {
  this.applyEachLine(message, function (line) {
    this.log(chalk.red(line), 'debug');
  }.bind(this));
};

Logger.prototype.success = function success(message) {
  this.applyEachLine(message, function (line) {
    this.log(chalk.green(line), 'debug');
  }.bind(this));
};

Logger.prototype.warning = function warning(message) {
  this.applyEachLine(message, function (line) {
    this.log(chalk.yellow(line), 'debug');
  }.bind(this));
};

Logger.prototype.log = function log(message, type) {
  type = type || 'log';
  var aboveLimit = this.depthLimit >= 0 && this.depth >= this.depthLimit;
  var enabledLogs = !aboveLimit && this.level > Logger.prototype.LEVEL.NONE;
  if (type === 'debug' || enabledLogs) {
    if (type === 'log') {
      this.applyEachLine(message, function (line) {
        console.log(chalk.gray(this.getPaddingText(type)) + ' ' + line);
      }.bind(this));
    } else { // type !== 'log'
      console.log(chalk.gray(this.getPaddingText(type)) + ' ' + message);
    }
  }
};

Logger.prototype.getPaddingText = function getPaddingText(type) {
  type = type || 'log';
  var patterns = {
    header:   ['┌', '├────┬', '|    '],
    log:      ['|', '|    |', '|    '],
    debug:    ['|', '|    |', '|    '],
    footer:   ['└', '|    └', '|    ']
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
 * Apply a callback on each line of a message composed of newline characters
 * @param message
 * @param cb
 * @returns {*}
 */
Logger.prototype.applyEachLine = function applyEachLine(message, cb) {
  return _(message)
    .split(os.EOL)
    .filter(function (line) {
      return !_.isEmpty(line);
    })
    .forEach(function (line) {
      if (_.isFunction(cb)) {
        cb(line);
      }
    })
    .value();
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
      argsStr += '["' + str + '"], ';
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
