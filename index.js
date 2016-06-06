var starflow = require('./starflow');
//var start = [
//  'git.stash',
//  {'$': ['git', ['checkout', 'master']]},
//  {'$': ['git', ['fetch', 'origin', 'master']]},
//  {'$': ['git', ['origin/master', 'master']]}, // rebase master onto origin/master
//  {'$': ['git', ['stash', 'pop']]},
//  {'jira.getIssue': '{{args.card}}'},
//  {'teads.buildBranchName': ['{{jira.issue.fields.issuetype.name}}', '{{args.card}}', '{{args.slug}}']},
//  {'$': ['git', ['checkout', '-b', '{{&teads.branchName}}']]},
//  {'teads.linkDependencies': '{{&args.deps}}'} // "big" task
//   {'jira.assignIssue': '{{args.card}}'} // assign the issue to the current user (with Jira credentials)
//];

//var workflow = [
//  {'$': ['npm', 'install', 'teads-player']},
//  {'teads.linkDependencies': ['teads-player/teads-vpaid-video/teads-vpaid']},
//  {'teads.unlinkDependencies': ['teads-player/teads-vpaid-video/teads-vpaid', 'teads-player/teads-vpaid-video', 'teads-player']}
  // 'git.stash',
  // {'git.checkout': 'feature/GH14_rename-flow-config'},
  // {'git.fetch': ['origin', 'feature/GH14_rename-flow-config']},
  // {'$': ['git', ['rebase', 'origin/feature/GH14_rename-flow-config', 'feature/GH14_rename-flow-config']]},
  // { 'git.stash': 'pop' },
  // 'npm.dependencies',
  // 'git.getCurrentBranch',
  // {'jira.getIssue': '{{args.card}}'},
  // {'prompt': 'main'},
  // {'teads.buildBranchName': ['{{jira.issue.fields.issuetype.name}}', '{{args.card}}', '{{prompt.main.result.title}}']},
  // 'teads.linkDependencies'
  // {'git.createBranch': ['{{teads.branchName}}', true]}
//];
//var argv = require('yargs').argv;
//var config = {
//  args: argv,
//  muteDepth: Number(argv['mute-depth']) || 2,
//  prompt: {
//    main: {
//      properties: {
//        title: {
//          pattern: /^[a-zA-Z\s\-]+$/,
//          message: 'Title must be only letters, spaces, or dashes',
//          required: true
//        }
//      }
//    }
//  }
//};

// var workflow = [
//   {'teads.linkDependencies': ['teads-player/teads-vpaid-ui']},
//   {'teads.checkoutDependencies': ['master', ['teads-player', 'teads-player/teads-vpaid-ui']]}
// ];

starflow.logger.level = starflow.logger.LEVEL.ALL;
// starflow.logger.setDepthLimit(1);

var starflowTaskTester = [
  {'jenkins.buildJob': 'lib-front-utils_master'}
  // 'noop',
  // {'jira.getIssue': 'TT-3618'},
  // {'jira.getIssue': 'TT-4497'}
  //{'jira.getIssueStatuses': 'TT-3618'}
  //{'jira.assignIssue': ['TT-3618', 'unassigned']}
  //{'jira.changeIssueStatus': ['TT-3618', 'Open']},
  // {'teads.linkDependencies': ['teads-player']},
  // {'jira.getIssue': 'TT-3618'},
  // {'teads.buildBranchName': ['{{jira.issue.fields.issuetype.name}}', 'TT-3618', 'starflow-test']},
  // {'teads.createPullRequests': ['TT-3618', '{{teads.branchName}}', ['teads-player']]}
  //{'github.getProject': ['ebuzzing', 'starflow']},
  //{'github.getPRBetween': ['ebuzzing', 'starflow', 'master', 'feat/test-branch-for-pr-task']},
  //{'github.createPR': ['ebuzzing', 'starflow', 'master', 'feat/test-branch-for-pr-task', 'Automatopé']},
  //{'github.assignPR': ['ebuzzing', 'starflow', 'ruizb', '{{github.pr["ebuzzing/starflow master:feat/test-branch-for-pr-task"].number}}']}
];

var workflow = new starflow.Workflow(starflowTaskTester);
return workflow
  .register(['$', 'shell.spawn'], require('./shell/spawn'))
  .register('jenkins.buildJob', require('./jenkins/buildJob'))
  .register('prompt', require('./shell/prompt'))
  .register('npm.dependencies', require('./npm/dependencies'))
  .register(['git.getCurrentBranch', 'Get the current Git branch name'], require('./git/currentBranch'))
  .register('git.createBranch', require('./git/createBranch'))
  .register('git.checkout', require('./git/checkout'))
  .register('git.fetch', require('./git/fetch'))
  .register('git.push', require('./git/push'))
  .register('git.stash', require('./git/stash'))
  .register('jira.getIssue', require('./jira/getIssue'))
  .register('jira.getIssueStatuses', require('./jira/getIssueStatuses'))
  .register('jira.assignIssue', require('./jira/assignIssue'))
  .register('jira.changeIssueStatus', require('./jira/changeIssueStatus'))
  .register('github.createPR', require('./github/createPR'))
  .register('github.assignPR', require('./github/assignPR'))
  .register('github.getProject', require('./github/getProject'))
  .register('github.getPRBetween', require('./github/getPRBetween'))
  .register('noop', require('./custom/noOp'))
  .register('teads.buildBranchName', require('./custom/buildBranchName'))
  .register('teads.createPullRequest', require('./custom/createPullRequest'))
  .register('teads.linkDependency', require('./custom/linkDependency'))
  .register('teads.unlinkDependency', require('./custom/unlinkDependency'))
  .register('teads.checkoutDependency', require('./custom/checkoutDependency'))
  .run();
