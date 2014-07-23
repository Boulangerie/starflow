# grunt-teads-dev v0.1.0
> Performs a workflow based on the configuration the user gives.

## Install
Add the following line in the `devDependencies` property of the `package.json` file:
```
"grunt-teads-dev": "git+ssh://git@git.teads.tv:front-dev/grunt-teads-dev.git"
```
Add this line to the Gruntfile:
```
grunt.loadNpmTasks 'grunt-teads-dev'
```
Finally, run `npm install` in the terminal.

## Documentation
### Usage
The `grunt-teads-dev` task is a multitask that can be run in a tasks sequence or in the terminal. If you are using JIRA platform, it is **mandatory** to provide the JIRA issue/card as a parameter when you run the task in the terminal. Passing in the card can be achieved by appending ` --c=JIRA_CARD` to the `grunt TASK` command.
#### Examples
Suppose we have the following `Gruntfile.js` file:
```
module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-teads-dev');
  var initConfig = {
    pkg: grunt.file.readJSON('package.json'),
    
    ttdev: {
      options: {
        // shared config with sub-tasks
      },
      // sub-tasks
      create: {
        steps: [
          { 'jira.check.card': { card: '<%= grunt.option("card") %>' } }
        ]
      },
      finish: {
        steps: [
          { 'jira.check.card': { card: '<%= grunt.option("card") %>' } },
          { 'jira.move.card': { status: 'Reviews' } }
        ]
      }
    }
  };
  grunt.initConfig(initConfig);
  grunt.registerTask('new_feat', ['ttdev:create:feature']);
};
```
Now, you can run the task in several ways, but you have to pass in the JIRA card/issue as a paramater if your workflow uses a JIRA card. In a terminal:
```
grunt new_feat --card=MAN-123
```
```
grunt ttdev:create:feature --card=MAN-123
```
```
grunt ttdev:create --type=feature --card=MAN-123
```

The `grunt-teads-dev` task accepts 1 argument:

- **type** ( *optional* ): the type of issue you are dealing with. **Default** value is `feat`. Values can be:
    - `feat|feature|improvement`: for a feature or an improvement. Parsed to `feat` value.
    - `bug|fix`: for a bug fix. Parsed to `fix` value.
    - `chore|task`: for maintenance procedures. Parsed to `chore` value.
    - `test|tests`: when adding tests. Parsed to `test` value.
    - `style`: formatting, missing symbols/semi colons...
    - `docs|doc|documentation`: for the documentation. Parsed to `docs`.
    - `refactor|refacto`: for refactor procedures. Parsed to `refactor`.

 It follows the git commit conventions described in this document: [Git Commit Message Conventions](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit).
    
### Options
#### Shared options
The sub-tasks can share configuration, for that you just need to put it in the `options` property of the `ttdev` task:
```
      // somewhere in the Gruntfile
      ttdev: {
        options: {
          mySharedData: 'shared'
        },
        // sub-tasks config...
      }
```
If you plan on using JIRA or Gitlab APIs in your *workflow*, you have to declare the `host` and the name or ID of the `project` you will be working on:
```
      // somewhere in the Gruntfile
      ttdev: {
        options: {
          gitlab: {
            host: 'https://gitlab.domain.com',
            project: 'My Gitlab Project' // name of the Gitlab project
          },
          jira: {
            host: 'https://jira.domain.com',
            project: 12345 // id of the JIRA project
          }
        },
        // sub-tasks config...
      }
```

#### Sub-task specific information
The power of the `grunt-teads-dev` is to let you define the workflow(s) you will use to work on an issue.

> A **workflow** is a series of steps the developper has to go through in order to work on an issue/feature.

A workflow is defined in the `steps` property of a sub-task. `steps` is an array where each element can be:

- A **string**: a command without any parameter. Example:

 ```
 'gitlab.check.connection'
 ```

- An **object**: a command as the key and a map of parameters as the value. Example:

 ```
 { 'gitlab.assign.merge_request': { assignee: 'test' } }
 ```

#### Available commands
| Command | Parameters | Description |
| - | - | - |
| gitlab.check.connection | *none* | Checks if the Gitlab API is reachable with the user's credentials |
| gitlab.create.merge_request | **ref_branch**: the branch you wish to merge your working branch with (e.g. `master`) | Creates a new merge request on the project given in the `options` of `ttdev` between the branches `{type}-{card}` and `ref_branch` |
| gitlab.assign.merge_request | **assignee**: the username of the user you wish to assign the merge request of the issue related to the card passed in the task (via `--card=MY_CARD`) | Assigns a user to review the merge request |
| jira.check.connection | *none* | Checks if the JIRA API is reachable with the user's credentials |
| jira.check.card | **card**: the issue key / card name you will work on (e.g. `MAN-123`) | Checks if the card name given as argument exists on JIRA or not |
| jira.move.card | **status**: new status name of the JIRA issue (e.g. for the Manager project, `In Progress`, `Review`...) | Moves a card from a column to another
| git.checkout | **branch**: name of the branch where to switch on | Performs a `git checkout branch` command |
| git.create.branch | **with_checkout**: true if you wish to switch to the created branch, false otherwise | Performs a `git branch {type}-{card}` if with_checkout is false, `git checkout -b {type}-{card}` otherwise |
| git.pull | **with_rebase**: true if you wish to make a rebase after merge, false otherwise<br>**repo**: repository name on remote (default is `origin`)<br>**branch**: branch name on remote (default is `master`) | Performs a `git pull origin master` if with_rebase is false, `git pull --rebase origin master` otherwise |
| git.push | **repo**: repository name on remote (default is `origin`)<br>**branch**: branch name on remote (default is `{type}-{card}`) | Performs a `git push origin {type}-{card}` |

You can convert a "string" command into an "object" one:
```
'git.check.connection'
// same as
{ 'git.check.connection': {} }
```


#### Example of workflow
```
      // somewhere in the Gruntfile
      ttdev: {
        options: {
          // shared info
        },
        create: { // sub-task 'create'
          steps: [ // steps of the workflow "create new issue"
            'gitlab.check.connection',
            'jira.check.connection',
            { 'jira.check.card': { card: '<%= grunt.option("card") %>' } },
            { 'git.checkout': { branch: 'master' } },
            { 'git.pull': { with_rebase: true } },
            { 'git.create.branch': { with_checkout: true } }, // branch name is built by the task ({type}-{card})
            'git.push',
            { 'gitlab.create.merge_request': { ref_branch: 'master' } },
            { 'jira.move.card': { status: 'In Progress' } }
          ]
        }
      }
```

# To be continued...


