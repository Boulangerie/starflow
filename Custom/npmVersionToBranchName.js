module.exports = (function (_, Q, BaseTask, Logger) {
  'use strict';

  var templateMapping = {
    '0.0.0-TYPE-tt-JIRA_KEY-SLUG': {
      branchTpl: 'TYPE/TT-JIRA_KEY_SLUG',
      order: [1, 0, 2] // 'TYPE' relates to patternRegex[1] regex, 'JIRA_KEY' to patternRegex[0], etc.
    },
    '0.0.0-TYPE-SLUG': {
      branchTpl: 'TYPE/SLUG',
      order: [1, 2]
    }
  };

  var patternRegex = {
    JIRA_KEY: '\\d+',
    TYPE: 'feature|feat|fix|hotfix',
    SLUG: '(?:\\w+-?)+'
  };

  function convertNpmVersionToBranchName(npmVersion) {
    var branchName = '';
    _.forEach(templateMapping, function (model, npmTpl) {
      // build the full string regex
      var formattedPattern = npmTpl;
      _.forEach(patternRegex, function (regexStr, key) {
        formattedPattern = formattedPattern.replace(key, '(' + regexStr + ')');
      });

      // extract data from npm version
      var matches = npmVersion.match(new RegExp(formattedPattern)); // order = order from NPM
      if (matches) {
        // build branch name with extracted data
        matches = _.drop(matches); // remove the first useless element
        var patternKeys = _.keys(patternRegex);
        branchName = model.branchTpl;
        _.forEach(model.order, function (mappedIndex, index) {
          branchName = branchName.replace(patternKeys[mappedIndex], matches[index]);
        });
        return false;
      }
    });
    return branchName;
  }

  function _checkValues(npmVersion, extractedNpmDependencies) {
    if(_.isEmpty(npmVersion) && _.isEmpty(extractedNpmDependencies)) {
      throw new Error('The NPM version name is mandatory to build the branch name (got "' + npmVersion + '")');
    }
  }

  return _.extend(_.create(BaseTask), {
    fn: function customNpmVersionToBranchName(flow, npmVersion) {
      var extractedNpmDependencies = flow.npm.dependencies;
      _checkValues(npmVersion, extractedNpmDependencies);

      var npmVersionNames = [];
      if (npmVersion) {
        npmVersionNames.push(npmVersion);
      } else { // no NPM version provided, get those from flow.npm.dependencies
        _.forEach(extractedNpmDependencies, function (version, name) {
          npmVersionNames.push(version);
        });
      }

      var branchNames = {};
      _.forEach(npmVersionNames, function (version) {
        branchNames[version] = convertNpmVersionToBranchName(version);
        if (!branchNames[version]) {
          Logger.log('Could not build a branch name from NPM version "' + version + '"', 'yellow');
        } else {
          Logger.log('Branch name built: ' + branchNames[version], flow.logDepth);
        }
      });
      return Q(_.merge(flow, {
        custom: {
          npmBranchMap: branchNames
        }
      }));
    },

    requires: []
  });
})(require('lodash'), require('q'), rootRequire('services/Core/task'), libRequire('Logger'));
