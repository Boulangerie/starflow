module.exports = (function (_, Q, BaseTask, Common) {
  'use strict';

  return _.extend(_.create(BaseTask), {
    fn: function gitRebase(flow, remote, baseBranch, headBranch) {
      remote = remote || 'origin';
      baseBranch = baseBranch || 'master';
      headBranch = headBranch || 'master';

      var remoteBaseBranch = remote + '/' + baseBranch;

      var task = {
        name: 'shell',
        args: ['git', ['rebase', remoteBaseBranch, headBranch]]
      };
      return Common.taskWrapper(task, flow)();
    },

    requires: []
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Common'));