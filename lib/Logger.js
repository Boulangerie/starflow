module.exports = (function (_, chalk) {
  'use strict';
  // Special characters: └┘┼─┴├┤┬┌┐│
  
  function Logger() {
    this.textPadding = '│     ';
    this.enabled = true;
    this.depth = 0;
    this.level = Logger.prototype.LOGS.NORMAL;
  }

  Logger.prototype = {
    LOGS: {
      NONE: 0,
      NORMAL: 1,
      ALL: 2
    },
    header: header,
    footer: footer,
    log: log,
    success: success,
    error: error,
    logArgsStr: logArgsStr,
    setLevel: setLevel,
    canLog: canLog,
    getPadding: getPadding,
    enable: enable,
    disable: disable
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

  /**
   * Build a string to log a task's arguments
   */
  function logArgsStr(args) {
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
  }

  /**
   * Disable logs
   */
  function disable() {
    this.enabled = false;
  }

  /**
   * Enable logs
   */
  function enable() {
    this.enabled = true;
  }

  /**
   * Set the log level
   * @param {number} lvl
   */
  function setLevel(lvl) {
    this.level = lvl;
  }

  function canLog() {
    return this.level > 0 && (this.level === 2 || (this.level === 1 && this.enabled));
  }
  
  /**
   * Compute the necessary padding to display the log
   * @param  {number} units
   * @return {string}
   */
  function getPadding() {
    var str = '';
    for (var i = 0; i < this.depth; i++) {
      str += this.textPadding;
    }
    return str;
  }

  /**
   * Log a message as a header log
   * @param  {array|string} messages Using an array lets us have messages with different colors for each one
   * @example [chalk.red('this'), chalk.blue('is a test')]
   * @param  {string} color
   */
  function header(messages, color) {
    color = color || 'grey';
    if (_.isString(messages)) {
      messages = [chalk[color](messages)];
    }
    messages.unshift(chalk.gray('%s┌ '));
    if (this.canLog()) {
      console.log(messages.join(''), this.getPadding());
    }
  }

  /**
   * Log a message as a footer log
   * @param  {array|string} messages
   * @param  {string} color
   */
  function footer(messages, color) {
    color = color || 'grey';
    if (_.isString(messages)) {
      messages = [chalk[color](messages)];
    }
    messages.unshift(chalk.gray('%s└ '));
    if (this.canLog()) {
      console.log(messages.join(''), this.getPadding());
    }
  }

  /**
   * Log a message as a content/body message
   * @param  {string} message
   * @param  {string} color
   */
  function log(message, color) {
    color = color || 'white';

    var messages = message.split('\n');
    var i = messages.length;
    while (i--) {
      if (messages[i] !== '') {
        if (this.canLog()) {
          console.log(chalk.gray('%s') + chalk[color]('%s'), this.getPadding(), messages[i]);
        }
      }
    }
  }

  /**
   * Log a success message
   * @param  {string} message
   */
  function success(message) {
    if (_.isNumber(message)) {
      this.depth = message;
      message = '';
    }
    this.footer([chalk.green('✓ '), chalk.gray(message)], this.depth);
  }

  /**
   * Log an error message
   * @param  {string} message
   */
  function error(message) {
    if (_.isNumber(message)) {
      this.depth = message;
      message = '';
    }
    this.footer([chalk.red('✗ '), chalk.gray(message)], this.depth);
  }

  return new Logger();
})(require('lodash'), require('chalk'));
