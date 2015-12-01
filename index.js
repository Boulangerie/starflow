var Starflow = require('./starflow');
var start = [
  'git.stash',
  {'$': ['git', ['checkout', 'master']]},
  {'$': ['git', ['fetch', 'origin', 'master']]},
  {'$': ['git', ['origin/master', 'master']]}, // rebase master onto origin/master
  {'$': ['git', ['stash', 'pop']]},
  {'jira.getIssue': '{{args.card}}'},
  {'teads.buildBranchName': ['{{jira.issue.fields.issuetype.name}}', '{{args.card}}', '{{args.slug}}']},
  {'$': ['git', ['checkout', '-b', '{{teads.branchName}}']]},
  {'teads.linkDependencies': '{{args.deps}}'}, // "big" task
  {'jira.assignIssue': '{{args.card}}'} // assign the issue to the current user (with Jira credentials)
];

var sequence = [
  'git.stash',
  {'git.checkout': 'refactor-5'},
  {'git.fetch': ['origin', 'refactor-5']},
  {'$': ['git', ['rebase', 'origin/refactor-5', 'refactor-5']]},
  { 'git.stash': 'pop' },
  'npm.dependencies',
  'git.getCurrentBranch',
  {'jira.getIssue': '{{args.card}}'},
  {'prompt': 'main'},
  {'teads.buildBranchName': ['{{jira.issue.fields.issuetype.name}}', '{{args.card}}', '{{prompt.main.result.title}}']},
  'teads.linkDependencies'
  // {'git.createBranch': ['{{teads.branchName}}', true]}
];
var flow = {
  args: require('yargs').argv,
  muteDepth: -1,
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
var sf = new Starflow(sequence, flow);
sf.logger.level = sf.logger.__proto__.LEVEL.ALL;

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

sf
  .register(['$', 'shell.spawn'], starflowShell.spawn)
  .register('npm.dependencies', starflowNpm.dependencies)
  .register('prompt', starflowShell.prompt)
  .register(['git.getCurrentBranch', 'Get the current Git branch name'], starflowGit.currentBranch)
  .register('git.createBranch', starflowGit.createBranch)
  .register('git.checkout', starflowGit.checkout)
  .register('git.fetch', starflowGit.fetch)
  .register('git.push', starflowGit.push)
  .register('git.stash', starflowGit.stash)
  .register('jira.getIssue', starflowJira.getIssue)
  .register('teads.buildBranchName', starflowTeads.buildBranchName)
  .register('teads.linkDependencies', starflowTeads.linkDependencies)
  .run()
  .done();
