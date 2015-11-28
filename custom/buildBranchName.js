var _ = require('lodash');
var Q = require('q');
var slugify = require('slugify');

function BuildBranchName(starflow) {
  this.starflow = starflow;
}

BuildBranchName.prototype.exec = function (type, key, slug) {
  var starflow = this.starflow;

  var type = type.toLowerCase() === 'bug' ? 'fix' : 'feature';
  var branchName = type + '/' + key;
  if (!_.isEmpty(slug)) {
    branchName += '_' + slugify(slug.toLowerCase());
  }
  starflow.logger.log('Branch name built: ' + branchName);
  _.set(starflow.flow, 'teads.branchName', branchName);
  return starflow.flow;
};

module.exports = function buildBranchNameFactory(starflow) {
  return new BuildBranchName(starflow);
};
