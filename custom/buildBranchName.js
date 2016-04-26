var _ = require('lodash');
var slugify = require('slugify');
var starflow = require('../starflow');
var BaseExecutable = require('../BaseExecutable');

function BuildBranchName(parentNamespace) {
  BaseExecutable.call(this, 'teads.buildBranchName', parentNamespace);
}
BuildBranchName.prototype = Object.create(BaseExecutable.prototype);
BuildBranchName.prototype.constructor = BuildBranchName;

BuildBranchName.prototype.exec = function (type, key, slug) {
  type = type.toLowerCase() === 'bug' ? 'fix' : 'feature';
  var branchName = type + '/' + key;
  if (!_.isEmpty(slug)) {
    branchName += '_' + slugify(slug.toLowerCase());
  }
  starflow.logger.log('Branch name built: ' + branchName);
  this.storage.set('branchName', branchName);
};

module.exports = function (parentNamespace) {
  return new BuildBranchName(parentNamespace);
};
