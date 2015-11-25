module.exports = (function (_, Q, BaseTask, Logger, Common) {
  'use strict';

  return _.extend(_.create(BaseTask), {
    fn: function gitCheckout(flow, branch) {
      var task = {
        name: 'shell',
        args: ['git', ['checkout', branch], {}, false]
      };
      return Common.taskWrapper(task, flow)()
        .then(function (res) {
          Logger.log('Checked out to the branch "' + branch + '"');
          return Q(res);
        });
    },

    requires: []
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'), libRequire('Common'));