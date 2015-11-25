(function (starflow) {

  var args = process.argv.splice(2);

  var tasks = [
    //{ 'git.checkout': 'master' },
    //{ 'git.pull': ['origin', 'master'] },
    //{ 'git.rebase': ['origin', 'master', 'master'] },
    // { 'shell': ['ls'] },
    'npm.list',
    { 'npm.dependencies': 'format' },
    'teads.npmVersionToBranchName'
    // { 'jira.getIssue': '{{args.0}}' },
    // { 'Get the issue on the JIRA web service': '{{args.0}}' },
    // { 'teads.buildDevBranchName': ['{{jira.issue.fields.issuetype.name}}', '{{jira.issue.key}}', '{{jira.issue.fields.summary}}'] },
    // { 'git.createBranch': '{{custom.devBranchName}}' },
    // { 'git.checkout': '{{custom.devBranchName}}' },
    // { 'git.push': ['ruizb', '{{custom.devBranchName}}'] },
    // { 'jira.assignIssue': ['benoit.ruiz', '{{args.0}}'] },
    // { 'jira.changeIssueStatus': ['In  Progress', '{{args.0}}'] },
    // { 'github.createPullRequest': ['ruizb', 'test', 'This is the PR title', '{{custom.devBranchName}}', 'master'] }
  ];

  var flow = {
    args: args,
    github: {
      token: process.env.GITHUB_TOKEN
    },
    jira: {
      protocol: 'https',
      host: 'jira.teads.net',
      user: process.env.JIRA_USERNAME,
      pass: process.env.JIRA_PASSWORD
    }
  };

  starflow
    .init(tasks, __dirname, flow, require('./mapTaskCallback.json'))
    .run();

})(require('./starflow'));
