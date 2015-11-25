module.exports = (function (_, Q, fs, BaseTask, Logger) {
  'use strict';

  var packageFileName = 'package.json';
  var availableDependencies = ['prod', 'dev'];

  return _.extend(_.create(BaseTask), {
    fn: function npmDependencies(flow, pattern, specificDependencies) {
      specificDependencies = _.contains(availableDependencies, specificDependencies) ? specificDependencies : false;

      var readDependencies = {};
      var packageFile = JSON.parse(fs.readFileSync(packageFileName, 'utf8'));

      if (!specificDependencies || (specificDependencies === 'prod')) {
        _.extend(readDependencies, packageFile.dependencies);
      }

      if (!specificDependencies || (specificDependencies === 'dev')) {
        _.extend(readDependencies, packageFile.devDependencies);
      }


      if (_.isEmpty(pattern)) {
        Logger.log(_.size(readDependencies) + ' dependencies were extracted successfully from ' + packageFileName);
      } else {
        var regex = new RegExp(pattern);
        readDependencies = _.pick(readDependencies, function (v, dependencyName) {
          return regex.test(dependencyName);
        });

        Logger.log('Dependencies extracted successfully from ' + packageFileName + ':');
        _.forEach(readDependencies, function (version, name) {
          Logger.log(' - ' + name + ' (' + version + ')');
        });
      }

      return Q(_.merge(flow, {
        npm: {
          dependencies: readDependencies
        }
      }));
    },

    requires: []
  });
})(require('lodash'), require('q'), require('fs'), rootRequire('services/Core/task'), libRequire('Logger'));
