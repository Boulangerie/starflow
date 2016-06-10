var _ = require('lodash');
var Promise = require('bluebird');
var getBuildFactory = require('./getBuild');
var starflow = require('../starflow');
var BaseExecutable = require('../Executable');
var Task = require('../Task');

function WaitBuild() {
  BaseExecutable.call(this, 'jenkins.waitBuild');
  this.retries = 0;
  this.intervalId = null;
  this.timeoutId = null;
}

WaitBuild.DEFAULT_DELAY_IN_SECONDS = 30;
WaitBuild.MAX_RETRIES = 10;
WaitBuild.MAX_TIMEOUT = 18000000;

WaitBuild.prototype = Object.create(BaseExecutable.prototype);
WaitBuild.prototype.constructor = WaitBuild;

WaitBuild.prototype.startMaxTimer = function startMaxTimer() {
  this.timeoutId = setTimeout(function () {
    this.stopTimer();
  }.bind(this), WaitBuild.MAX_TIMEOUT);
};

WaitBuild.prototype.stopTimer = function stopTimer() {
  if (!_.isNull(this.intervalId)) {
    clearTimeout(this.intervalId);
    this.intervalId = null;
  }
  if (!_.isNull(this.timeoutId)) {
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }
};

WaitBuild.prototype.retry = function retry(buildNumber, reason, reject) {
  this.retries++;
  if (this.retries >= WaitBuild.MAX_RETRIES) {
    this.stopTimer();
    reject();
    starflow.logger.error('Could not get status of build #' + buildNumber + ': ' + reason);
  } else {
    starflow.logger.debug('Number of retries for build #' + buildNumber + ': ' + this.retries);
  }
};

WaitBuild.prototype.iteration = function iteration(jobName, buildNumber, delayInSeconds, resolve, reject) {
  var getBuildFactoryExec = this.createExecutable(getBuildFactory);
  var task = new Task(getBuildFactoryExec, [jobName, buildNumber]);
  task.run()
    .then(function () {
      var build = getBuildFactoryExec.storage.get('build');
      if (_.isUndefined(build)) {
        this.intervalId = setTimeout(this.iteration.bind(this), delayInSeconds * 1000);
        this.retry(buildNumber, 'Build not saved in the storage', reject);
      }
      else if (!_.isNull(build.result)) {
        this.stopTimer();
        this.storage.set('build', build);
        starflow.logger.success('Build #' + buildNumber + ' ended with status "' + build.result + '"');
        resolve();
      }
      else {
        this.intervalId = setTimeout(this.iteration.bind(this), delayInSeconds * 1000);
      }
    }.bind(this))
    .catch(function (err) {
      this.intervalId = setTimeout(this.iteration.bind(this), delayInSeconds * 1000);
      this.retry(buildNumber, err, reject);
    }.bind(this));
};

WaitBuild.prototype.exec = function exec(jobName, buildNumber, delayInSeconds) {
  if (!_.isNumber(delayInSeconds)) {
    delayInSeconds = WaitBuild.DEFAULT_DELAY_IN_SECONDS;
  }
  this.retries = 0;
  this.startMaxTimer();
  return new Promise(function (resolve, reject) {
    this.iteration(jobName, buildNumber, delayInSeconds, resolve, reject);
  }.bind(this));
};

module.exports = function () {
  return new WaitBuild();
};
