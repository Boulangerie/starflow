var _ = require('lodash');
var slugify = require('slugify');
var starflow = require('../starflow');

function BuildBranchName() {}

BuildBranchName.prototype.exec = function (type, key, slug) {
  var type = type.toLowerCase() === 'bug' ? 'fix' : 'feature';
  var branchName = type + '/' + key;
  if (!_.isEmpty(slug)) {
    branchName += '_' + slugify(slug.toLowerCase());
  }
  starflow.logger.log('Branch name built: ' + branchName);
  _.set(starflow.config, 'teads.branchName', branchName);
};

module.exports = function () {
  return new BuildBranchName();
};
