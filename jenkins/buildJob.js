var jenkinsService = require('./jenkinsService');
var starflow = require('../starflow');
var BaseExecutable = require('../Executable');

function BuildJob() {
  BaseExecutable.call(this, 'jenkins.buildJob');
}

BuildJob.prototype = Object.create(BaseExecutable.prototype);
BuildJob.prototype.constructor = BuildJob;

BuildJob.prototype.exec = function exec(jobName, params) {
  return jenkinsService.job.build({
      name: jobName,
      parameters: params
    })
    .then(function (buildId) {
      starflow.logger.success('Job built successfully: ' + buildId);
      this.storage.set('build.id', buildId);
    }.bind(this), function (err) {
      starflow.logger.error('Could not build the job' + err);
    });

};

module.exports = function () {
  return new BuildJob();
};
