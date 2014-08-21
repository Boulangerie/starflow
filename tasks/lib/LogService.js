var LogService = function () {
  this.gruntRef = null;
};
LogService.prototype.constructor = LogService;

LogService.prototype.init = function (grunt) {
  this.gruntRef = grunt;
  return this;
};

/**
 * Display a normal message in the output
 * @param message {string}
 */
LogService.prototype.message = function (message) {
  var self = this;

  self.gruntRef.log.writeln(message);
};

/**
 * Display a success message
 * @param message {string}
 */
LogService.prototype.success = function (message) {
  var self = this;

  self.gruntRef.log.success(message);
};

/**
 * Display an error message
 * @param message {string}
 */
LogService.prototype.error = function (message) {
  var self = this;

  self.gruntRef.log.error(message);
};

/**
 * Display a debug message if flag --debug
 * @param message {string}
 */
LogService.prototype.debug = function () {
  var self = this;

  self.gruntRef.log.debug.apply(self, arguments);
};

module.exports = new LogService();