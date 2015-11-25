module.exports = (function (_, Q, BaseTask, Common) {
  'use strict';

  return _.extend(_.create(BaseTask), {
    fn: function gitPull(flow, remote, branch) {
      remote = remote || 'origin';
      branch = branch || 'master';

      var task = {
        name: 'shell',
        args: ['git', ['pull', remote, branch]]
      };
      return Common.taskWrapper(task, flow)();
    },

    requires: []
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Common'));