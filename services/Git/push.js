module.exports = (function (_, Q, BaseTask, Common) {
  'use strict';

  return _.extend(_.create(BaseTask), {
    fn: function gitPush(flow, remote, branch) {
      remote = remote || 'origin';
      branch = branch || flow.git.lastBranchCreated || 'master';

      var task = {
        name: 'shell',
        args: ['git', ['push', remote, branch]]
      };
      return Common.taskWrapper(task, flow)();
    },

    requires: []
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Common'));