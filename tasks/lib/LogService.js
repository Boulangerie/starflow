var LogService = function () {
  this.messages = [];
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
LogService.prototype.write = function (message) {
  var self = this;

  self.gruntRef.log.writeln(message);

  self.messages.push({
    message: message,
    type: 'writeln',
    date: new Date()
  });
};

/**
 * Display a success message
 * @param message {string}
 */
LogService.prototype.success = function (message) {
  var self = this;

  self.gruntRef.log.success(message);

  self.messages.push({
    message: message,
    type: 'success',
    date: new Date()
  });
};

/**
 * Display an error message
 * @param message {string}
 */
LogService.prototype.error = function (message) {
  var self = this;

  self.gruntRef.log.error(message);

  self.messages.push({
    message: message,
    type: 'error',
    date: new Date()
  });
};

/**
 * Display a debug message if flag --debug
 * @param message {string}
 */
LogService.prototype.debug = function () {
  var self = this;

  self.gruntRef.log.debug.apply(self, arguments);
};

/**
 * Display all registered messages
 */
LogService.prototype.displayAllMessages = function () {
  var self = this,
      activeMessage;

  for (var i = 0; i < self.messages.length; i++) {
    activeMessage = self.messages[i];
    self[activeMessage.type](activeMessage.message);
  }

  return self.messages.length;
};

module.exports = new LogService();