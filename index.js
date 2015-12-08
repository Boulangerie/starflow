var starflow = require('./starflow');

var start = [
  'git.stash',
  {'$': ['git', ['checkout', 'master']]},
  {'$': ['git', ['fetch', 'origin', 'master']]},
  {'$': ['git', ['origin/master', 'master']]}, // rebase master onto origin/master
  {'$': ['git', ['stash', 'pop']]},
  {'jira.getIssue': '{{args.card}}'},
  {'teads.buildBranchName': ['{{jira.issue.fields.issuetype.name}}', '{{args.card}}', '{{args.slug}}']},
  {'$': ['git', ['checkout', '-b', '{{&teads.branchName}}']]},
  {'teads.linkDependencies': '{{&args.deps}}'} // "big" task
  // {'jira.assignIssue': '{{args.card}}'} // assign the issue to the current user (with Jira credentials)
];

var workflow = [
  'git.stash'
  // {'git.checkout': 'master'},
  // {'git.fetch': ['origin', 'master']},
  // {'$': ['git', ['rebase', 'origin/master', 'refactor-6']]},
  ,{ 'git.stash': 'pop' }
  ,'npm.dependencies'
  // 'git.getCurrentBranch',
  // {'jira.getIssue': '{{args.card}}'},
  // {'prompt': 'main'},
  // {'teads.buildBranchName': ['{{jira.issue.fields.issuetype.name}}', '{{args.card}}', '{{prompt.main.result.title}}']}
  // 'teads.linkDependencies'
  // {'git.createBranch': ['{{teads.branchName}}', true]}
];
var argv = require('yargs').argv;
var flow = {
  args: argv,
  muteDepth: Number(argv['mute-depth']) || 0,
  prompt: {
    main: {
      properties: {
        title: {
          pattern: /^[a-zA-Z\s\-]+$/,
          message: 'Title must be only letters, spaces, or dashes',
          required: true
        }
      }
    }
  }
};
starflow.logger.level = starflow.logger.LEVEL.ALL;

var starflowShell = require('./shell/starflow-shell');
var starflowNpm = require('./npm/starflow-npm');
var starflowGit = require('./git/starflow-git');
var starflowJira = require('./jira/starflow-jira')(
  'https',
  'jira.teads.net',
  null,
  process.env.JIRA_USERNAME,
  process.env.JIRA_PASSWORD
);
var starflowTeads = require('./custom/starflow-teads');

starflow
  .init(workflow, flow)
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
  .register('teads.buildBranchName', starflowTeads.buildBranchName)
  .register('teads.linkDependencies', starflowTeads.linkDependencies)
  .runWorkflow()
  .done();
