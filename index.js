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
starflow.logger.level = starflow.logger.LEVEL.ALL;

var starflowShell = require('./shell/starflow-shell');
var starflowNpm = require('./npm/starflow-npm');
var starflowGit = require('./git/starflow-git');
var starflowGithub = require('./github/starflow-github')(process.env.GITHUB_TOKEN);
var starflowTeads = require('./custom/starflow-teads');
var starflowJira = require('./jira/starflow-jira')(
  'https',
  'jira.teads.net',
  null,
  process.env.JIRA_USERNAME,
  process.env.JIRA_PASSWORD
);

var starflowTaskTester = [
  //{'jira.getIssue': 'TT-3618'}
  //{'jira.getIssueStatuses': 'TT-3618'}
  //{'jira.assignIssue': ['TT-3618', 'unassigned']}
  //{'jira.changeIssueStatus': ['TT-3618', 'Open']},

  //{'github.getProject': ['ebuzzing', 'starflow']},
  //{'github.getPRBetween': ['ebuzzing', 'starflow', 'master', 'feat/test-branch-for-pr-task']},
  //{'github.createPR': ['ebuzzing', 'starflow', 'master', 'feat/test-branch-for-pr-task', 'Automatopé']},
  //{'github.assignPR': ['ebuzzing', 'starflow', 'julien-vidal', '{{github.createPR.number}}']}
];

starflow
  .init(starflowTaskTester, {})
  .register(['$', 'shell.spawn'], starflowShell.spawn)
  .register('prompt', starflowShell.prompt)
  .register('npm.dependencies', starflowNpm.dependencies)
  .register(['git.getCurrentBranch', 'Get the current Git branch name'], starflowGit.currentBranch)
  .register('git.createBranch', starflowGit.createBranch)
  .register('git.checkout', starflowGit.checkout)
  .register('git.fetch', starflowGit.fetch)
  .register('git.push', starflowGit.push)
  .register('git.stash', starflowGit.stash)
  .register('jira.getIssue', starflowJira.getIssue)
  .register('jira.getIssueStatuses', starflowJira.getIssueStatuses)
  .register('jira.assignIssue', starflowJira.assignIssue)
  .register('jira.changeIssueStatus', starflowJira.changeIssueStatus)
  .register('github.createPR', starflowGithub.createPR)
  .register('github.assignPR', starflowGithub.assignPR)
  .register('github.getProject', starflowGithub.getProject)
  .register('github.getPRBetween', starflowGithub.getPRBetween)
  .register('teads.buildBranchName', starflowTeads.buildBranchName)
  .register('teads.linkDependencies', starflowTeads.linkDependencies)
  .register('teads.unlinkDependencies', starflowTeads.unlinkDependencies)
  .runWorkflow()
  .done();
