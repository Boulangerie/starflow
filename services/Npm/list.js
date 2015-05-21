module.exports = (function (_, Q, fs, BaseTask, Logger, Common) {
  'use strict';

  var availableLocations = ['local', 'global'];
  var availableDependencies = ['prod', 'dev'];

  return _.extend(_.create(BaseTask), {
    fn: function npmList(flow, specificLocation, specificDependencies) {

      specificLocation = _.contains(availableLocations, specificLocation) ? specificLocation : false;
      specificDependencies = _.contains(availableDependencies, specificDependencies) ? specificDependencies : false;

      var local = !specificLocation || (specificLocation === 'local');
      var global = !specificLocation || (specificLocation === 'global');

      var packages = {
        local: [],
        global: []
      };

      //var args = ['list', '--depth=0', '--json'];
      //var task = {
      //  name: 'shell',
      //  args: ['npm', args, {}, false]
      //};

      //var promises = [];
      var sequence = [];
      if (local) {
        //promises.push(Common.taskWrapper(_.cloneDeep(task), flow)());
        sequence.push({'shell': ['npm', ['ls', '--depth=0', '--json'], false, null, true]});
      }
      if (global) {
        //args.push('--global');
        //promises.push(Common.taskWrapper(task, flow)());

        sequence.push({'shell': ['npm', ['ls', '--depth=0', '--global', '--json'], false, null, true]});
      }

      return Common.runSequence(sequence, flow);
      /*
      //return Q.all(promises)
        .then(function (res) {
          Logger.log(JSON.stringify(res));
          if (local) {
            //packages.local = _.keys(_.result(res, '0.dependencies'));
          }
          if (global) {
            //packages.global = _.keys(_.result(res, '1.dependencies'));
          }

          return Q(_.merge(flow, {
            npm: {
              packages: packages
            }
          }));
        });
        */

    },

    requires: []
  });
})(require('lodash'), require('q'), require('fs'), rootRequire('services/Core/task'), libRequire('Logger'), libRequire('Common'));
