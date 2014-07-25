# grunt-teads-dev v0.1.0
> Automate your workflows simply by describing them in a config file.

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

## TTdev task
*Run this task with the `grunt ttdev` command.*
Task targets and options may be specified according to the grunt [Configuration tasks](http://gruntjs.com/configuring-tasks) guide.
### Usage
The `grunt-teads-dev` task is a multitask that can be run in a tasks sequence or in the terminal. If you are using JIRA platform, it is **mandatory** to provide the JIRA issue/card as a parameter when you run the task in the terminal. Passing in the card can be achieved by appending ` --card=JIRA_CARD` to the `grunt TASK` command.
#### Examples
Suppose we have the following `Gruntfile.js` file:
```
module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-teads-dev');
  var initConfig = {
    pkg: grunt.file.readJSON('package.json'),
    
    ttdev: {
      options: {
        // shared config with targets
      },
      // targets
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

### Authentication
In order to use the Gitlab or JIRA APIs, the task needs your credentials. For that, you need to create a `credentials.js` file in the `tasks` folder of the task:
```
// in the tasks/ directory, next to 'ttdev.js' file, create a 'credentials.js' file with this content:
module.exports = {
  gitlab: {
    token: 'GITLAB_PRIVATE_TOKEN'
  },
  jira: {
    user: 'JIRA_USERNAME',
    password: 'JIRA_PASSWORD'
  }
};
```
Make sure to **add this file** to the `.gitignore` file of your project.

### Options
#### Shared options
The targets can share configuration, for that you just need to put it in the `options` property of the `ttdev` task:
```
      // somewhere in the Gruntfile
      ttdev: {
        options: {
          mySharedData: 'shared'
        },
        // targets config...
      }
```
If you plan on using JIRA or Gitlab APIs in your *workflow*, you have to declare the path to the file where your credentials are, the `host` and the name (or ID) of the `project` you will be working on:
```
      // somewhere in the Gruntfile
      ttdev: {
        options: {
          credentials_file: __dirname + '/path/to/credentials.js',
          gitlab: {
            host: 'https://gitlab.domain.com',
            project: 'My Gitlab Project' // name of the Gitlab project
          },
          jira: {
            host: 'https://jira.domain.com',
            project: 12345 // id of the JIRA project
          }
        },
        // targets config...
      }
```

##### List of shared options
- **credentials_file** ( *string* ): the full name of the file used to store the user's credentials. The value of `__dirname` is the full path to the `Gruntfile.js`. So, `__dirname + '/path/to/credentials.js'` is evaluated as `/path/to/Gruntfile/path/to/credentials.js`
- **gitlab** ( *object* ): config object for accessing Gitlab API.

 ```
 {
      host: 'http://host.com',
      project: 'SERVICE Manager' // could be the ID instead of the name
 }
 ```

- **jira** ( *object* ): config object for accessing JIRA API.

 ```
 {
      host: 'http://host.com',
      project: 'Manager' // could be the ID instead of the name
 }
 ```


#### Target specific information
The goal of the `grunt-teads-dev` is to let you define the workflow(s) you will use to work on an issue.

> A **workflow** is a series of steps the developper has to go through in order to work on an issue/feature.

A workflow is defined in the `steps` property of a target. `steps` is an array where each element can be:

- A **string**: a command without any parameter. Example:

 ```
 'gitlab.check.connection'
 ```

- Or an **object**: a command as the key and a map of parameters as the value. Example:

 ```
 { 'gitlab.assign.merge_request': { assignee: 'test' } }
 ```

#### Available commands
| Command                     | Parameters                                                                                                                                                                                            | Description                                                                                                                        |
|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| gitlab.create.merge_request | **ref_branch**: the branch you wish to merge your working branch with (e.g. `master`)                                                                                                                 | Creates a new merge request on the project given in the `options` of `ttdev` between the branches `{type}-{card}` and `ref_branch` |
| gitlab.assign.merge_request | **assignee**: the username of the user you wish to assign the merge request of the issue related to the card passed in the task (via `--card=MY_CARD`)                                                | Assigns a user to the merge request related to the JIRA card                                                                       |
| jira.check.card             | **card**: the issue key / card name you will work on (e.g. `MAN-123`)                                                                                                                                 | Checks if the card name given as argument exists on JIRA or not                                                                    |
| jira.move.card              | **status**: new status name of the JIRA issue (e.g. for the Manager project, `In Progress`, `Review`...)                                                                                              | Moves a card from a column to another                                                                                              |
| git.checkout                | **branch**: name of the branch where to switch on                                                                                                                                                     | Performs a `git checkout branch` command                                                                                           |
| git.create.branch           | **with_checkout**: true if you wish to switch to the created branch, false otherwise                                                                                                                  | Performs a `git branch {type}-{card}` if with_checkout is false, `git checkout -b {type}-{card}` otherwise                         |
| git.pull                    | **with_rebase**: true if you wish to make a rebase after merge, false otherwise / **repo**: repository name on remote (default is `origin`) / **branch**: branch name on remote (default is `master`) | Performs a `git pull origin master` if with_rebase is false, `git pull --rebase origin master` otherwise                           |
| git.push                    | **repo**: repository name on remote (default is `origin`) / **branch**: branch name on remote (default is `{type}-{card}`)                                                                            | Performs a `git push origin {type}-{card}`                                                                                         |


You can convert a "string" command into an "object" one:
```
'git.check.connection'
// same as
{ 'git.check.connection': {} }
```


### Usage examples
```
module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-teads-dev');
  var initConfig = {
    pkg: grunt.file.readJSON('package.json'),
    
    ttdev: {
      options: {
        credentials_path: __dirname + '/path/to/credentials.js',
        gitlab: {
          host: 'https://gitlab.domain.com',
          project: 'My Gitlab Project' // name of the Gitlab project
        },
        jira: {
          host: 'https://jira.domain.com',
          project: 'My JIRA Project' // name of the JIRA project
        }
      },
      create: { // target 'create'
        steps: [ // steps of the workflow "create new issue"
          { 'jira.check.card': { card: '<%= grunt.option("card") %>' } },
          { 'git.checkout': { branch: 'master' } },
          { 'git.pull': { with_rebase: true } },
          { 'git.create.branch': { with_checkout: true } }, // branch name is built by the task ({type}-{card})
          'git.push',
          { 'gitlab.create.merge_request': { ref_branch: 'master' } },
          { 'jira.move.card': { status: 'In Progress' } }
        ]
      },
      finish: { // target 'finish'
        steps: [
          { 'jira.check.card': { card: '<%= grunt.option("card") %>' } },
          { 'gitlab.assign.merge_request': { assignee: 'test' } },
          { 'jira.move.card': { status: 'Review' } }
        ]
      }
    }
  };
  grunt.initConfig(initConfig);
  
  grunt.registerTask('new_feat', ['ttdev:create:feature']);
  grunt.registerTask('end_feat', ['ttdev:finish:feature']);
};
```

