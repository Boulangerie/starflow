var _ = require('lodash');
var Promise = require('bluebird');
var spawn = require('child_process').spawn;
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function Spawn() {
  BaseExecutable.call(this, 'spawn');
}
Spawn.prototype = Object.create(BaseExecutable.prototype);
Spawn.prototype.constructor = Spawn;

Spawn.prototype.exec = function exec(cmd) {
  var args, muteErrors, options;

  if ((arguments.length === 1) && _.isObject(cmd)) {
    args = cmd.args || [];
    muteErrors = cmd.muteErrors || false;
    options = cmd.options || {};
    cmd = cmd.cmd;
  } else {
    args = _.rest(arguments);
    muteErrors = false;
    options = {};
  }

  var self = this;
  return new Promise(function (resolve, reject) {
    var stdout = [];
    var stderr = [];
    var s = spawn(cmd, args, _.extend({ stdio: 'pipe' }, options));
    s.stdout.setEncoding('utf8');
    s.stderr.setEncoding('utf8');

    s.stdout.on('data', function (data) {
      stdout.push(data);
    });

    s.stderr.on('data', function (data) {
      stderr.push(data);
    });

    s.once('error', function (err) {
      starflow.logger.error('Are you sure "' + cmd + '" is a valid command?');
      reject(err);
    });

    s.on('close', function (code) {
      if (code === 0 || muteErrors) {
        if (starflow.logger.level > starflow.logger.LEVEL.NORMAL) {
          var messages = String(stdout).split('\n');
          _.forEach(messages, function (message) {
            if (message) {
              starflow.logger.log(message);
            }
          });
        } else {
          starflow.logger.warning('STDOUT muted (set starflow.logger.level property to starflow.logger.LEVEL.ALL to see these logs)');
        }
        if (code !== 0) {
          starflow.logger.warning('Errors detected but muted by the task parameters');
        }
        self.storage.set('output', String(stdout));
        resolve();
      } else {
        reject(new Error(stderr));
      }
    });
  });
};

module.exports = function () {
  return new Spawn();
};
