var _ = require('lodash');
var Promise = require('bluebird');
var prompt = require('prompt');
var chalk = require('chalk');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function Prompt(name, parentNamespace) {
  BaseExecutable.call(this, name, parentNamespace);
}
Prompt.prototype = Object.create(BaseExecutable.prototype);
Prompt.prototype.constructor = Prompt;

Prompt.prototype.exec = function (schemaName) {
  var self = this;
  return new Promise(function (resolve, reject) {
    prompt.message = chalk.gray(starflow.logger.getPaddingText()) + ' ?';
    prompt.delimiter = ' ';

    prompt.start();

    var schema = _.get(starflow.config, 'prompt.' + schemaName);
    if (!schema) {
      reject(new Error('Schema "' + schemaName + '" form prompt not found'));
    }

    prompt.get(schema, function (err, result) {
      if (err) {
        reject(err);
      }
      self.storage.set(schemaName + '.result', result);
      resolve();
    });
  });
};

module.exports = function (parentNamespace) {
  return new Prompt('prompt', parentNamespace);
};
