module.exports = (function (_, Q, slugify, BaseTask, Logger) {
  'use strict';

  function _checkValues(type, key) {
    if(_.isEmpty(type) || _.isEmpty(key)) {
      throw new Error('The type and key are mandatory to build the dev branch name (got "' + type + '" and "' + key + '")');
    }
  }

  return _.extend(_.create(BaseTask), {
    fn: function customBuildDevBranchName(flow, type, key, slug) {
      _checkValues(type, key);
      var type = type.toLowerCase() === 'bug' ? 'fix' : 'feature';
      var branchName = slugify(type) + '/' + key;
      if (!_.isEmpty(slug)) {
        branchName += '_' + slugify(slug.toLowerCase());
      }
      Logger.log('Branch name built: ' + branchName, flow.logDepth);
      return Q(_.merge(flow, {
        custom: {
          devBranchName: branchName
        }
      }));
    },

    requires: []
  });
})(require('lodash'), require('q'), require('slugify'), rootRequire('services/Core/task'), libRequire('Logger'));
