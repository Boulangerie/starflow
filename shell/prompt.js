var _ = require('lodash');
var Promise = require('bluebird');
var prompt = require('prompt');
var chalk = require('chalk');
var starflow = require('../starflow');
var BaseExecutable = require('../Executable');

function Prompt() {
  BaseExecutable.call(this, 'prompt');
}
Prompt.prototype = Object.create(BaseExecutable.prototype);
Prompt.prototype.constructor = Prompt;

Prompt.prototype.exec = function (name, schema) {
  var self = this;

  if (!name) {
    reject(new Error('The name parameter is mandatory'));
  }

  if (!schema) {
    reject(new Error('The schema parameter is mandatory'));
  }

  return new Promise(function (resolve, reject) {
    prompt.message = chalk.gray(starflow.logger.getPaddingText()) + ' ?';
    prompt.delimiter = ' ';

    prompt.start();

    prompt.get(schema, function (err, result) {
      if (err) {
        reject(err);
      }
      self.storage.set('result.' + name, result);
      resolve();
    });
  });
};

module.exports = function () {
  return new Prompt();
};
