# grunt-dev-workflow v0.3.0
> Manage your developement workflows with a configuration file.

## TL;DR Manager

Initialize your workflow by using the following command in the terminal:

```
grunt tdw:c:<issue number>[:<small description for the branch>]
```

Replace `<issue number>` with the JIRA issue number (e.g. 471). If you wish, you can specify a small description for the branch name, but it's not mandatory.

For example, if we have:

- **branchTpl** `{{ tdw_issueType }}/{{ tdw_issueKey }}/{{ tdw_issueDesc }}`
- **terminal command** `grunt tdw:c:471:devWorkflowTests`

Then the branch `feat/MAN-471/devWorkflowTests` will be created.

To end the workflow, just type in the following command in your terminal (in the **working branch**!):

```
grunt tdw:f
```

## Install

Add the following line in the `devDependencies` property of the `package.json` file:
```
"grunt-dev-workflow": "git+ssh://git@git.teads.tv:front-dev/grunt-dev-workflow.git"
```
Add this line to the Gruntfile:
```
grunt.loadNpmTasks 'grunt-dev-workflow'
```
Finally, run `npm install` in the terminal.

## TDW task

*Run this task with the `grunt tdw` command.*

Task targets and options may be specified according to the grunt [Configuration tasks](http://gruntjs.com/configuring-tasks) guide.

### Usage

The `grunt-dev-workflow` task is a multitask that can be run in a tasks sequence or in the terminal. If you are using JIRA platform, it is **mandatory** to provide the JIRA issue number as a parameter when you run the task in the terminal. Parameters can be passed by appending `:param` to the grunt task name (e.g. `grunt tdw:target:param1:param2`).

### Authentication

In order to use the Gitlab or JIRA APIs, the task needs your credentials. For that, you need to add environment variables in your `~/.bash_profile` file:

```
// at the end of the file
export GITLAB_PRIVATE_TOKEN="token"
export JIRA_USERNAME="username"
export JIRA_PASSWORD="password"
```

> **Note:**
> If your password contains `$` characters, make sure to escape it in the `~/.bash_profile` file.
> *Example:*
> `export JIRA_PASSWORD="test\$bob"`

### Options

#### Shared options

The targets can share configuration, for that you just need to put it in the `options` property of the `tdw` task:
```
      // somewhere in the Gruntfile
      tsw: {
        options: {
          mySharedData: 'shared'
        },
        // targets config...
      }
```

##### List of shared options

- **branchTpl** ( *string* ): The branch name template. Available variables: `{{ issueType }}`, `{{ issueKey }}` and `{{ issueDesc }}`. Example:

 ```
 branchTpl: "{{ issueType }}/{{ issueKey }}/{{ issueDesc }}"
 ```

- **gitlab** ( *object* ): config object for accessing Gitlab API.

 ```
 {
     protocol: 'https',
     host: 'git.teads.tv',
     projectName: 'SERVICE Manager'
 }
 ```

- **jira** ( *object* ): config object for accessing JIRA API.

 ```
 {
      protocol: 'https',
      host: 'jira.teads.tv',
      projectKey: 'MAN',
      issueTypesMatching: {
        feat: 'New Feature',
        fix: 'Bug',
        task: 'Task',
        subtask: 'Sub-task',
        epic: 'Epic',
        improv: 'Improvement',
        story: 'Story',
        techtask: 'Technical Task'
      }
 }
 ```


#### Target specific information

The goal of the `grunt-dev-workflow` is to let you define the workflow(s) you will use to work on an issue.

> A **workflow** is a series of steps the developer has to go through in order to work on an issue/feature.

A workflow is defined in the `steps` property of a target. `steps` is an array where each element can be:

- A **string**: a command without any parameter. Example:

 ```
 'jira.assignIssue'
 ```

- Or an **object**: a command as the key and a map of parameters as the value. Example:

 ```
 { 'git.checkout': { branch: 'master' } }
 ```

### Available commands

#### Git

**git.checkout**

- Description: performs a `git checkout <branch>`
- Parameters:
 - branch ( *String* ) [default: `master`] The branch you wish to checkout out to


**git.pull**

- Description: performs a `git pull <options> <remote> <branch>`
- Parameters:
 - withRebase ( *Boolean* ) [default: `false`] Add the option --rebase if true, no option otherwise
 - remote ( *String *) [default: `origin`] Repository where to pull from
 - branch ( *String* ) [default: `master`] Branch to pull

**git.push**

- Description: performs a `git push <remote> <branch>`
- Parameters:
 - remote ( *String *) [default: `origin`] Repository where to push to
 - branch ( *String* ) [default: `master`] Remote branch to push to

**git.createBranch**

- Description: performs a `git branch <branch>`
- Parameters:
 - withCheckout ( *Boolean* ) [default: `false`] Performs a `git checkout -b <branch>` instead
 - Comment: the branch name is built from the params given to the task and the `branchTpl` option

#### Gitlab


**gitlab.createMergeRequest**

- Description: creates a merge request on Gitlab between the working branch and the <refBranch>
- Parameters:
 - refBranch ( *String *) [default: `master`] Branch to merge the working branch with

**gitlab.assignMergeRequest**

- Description: assigns <assignee> to the merge request between the working branch and the ref branch
- Parameters:
 - assignee ( *String *) Assignee username to assign the merge request to

#### Jira

**jira.assignIssue**

- Description: assigns a Jira issue to <assignee>
- Parameters:
 - assignee ( *String *) Assignee username (firstname.lastname) to assign the issue to

**jira.changeIssueStatus**

- Description: changes the status of the issue linked to the workflow
- Parameters:
 - status ( *String *) Status to assign to the issue

## Trello board

Due to internal migration, the Trello board is currently unavailable. Please contact me if you have any feedback: [benoit.ruiz@teads.tv](mailto:benoit.ruiz@teads.tv).

## Technical documentation

### Add a command to an existing service

In the `tasks/libs/ServiceManager.js` file, you will find the `_setters` namespace. In order to add a new feature, you need to register a command to the appropriate service. For instance, in the `_setters.git` namespace, you will find configuration about the git service and a list of `registerCommand` calls:

```
servicesManager.services[SERVICE]
  .registerCommand('CMD_1', function (args) {})
  .registerCommand('CMD_2', function (args) {});
```

To add a new command, you need to register a new one:

```
servicesManager.services[SERVICE]
  .registerCommand('CMD_1', function (args) {})
  .registerCommand('CMD_2', function (args) {})
  .registerCommand('newCommand', function (args) {
    // Command code...
  });
```

**Important** Each command *must* return a Q.Promise instance ([q module doc](https://github.com/kriskowal/q)).

### Add a new service

Adding a new service is done by specifying a new namespace inside the `_setters` namespace. A service is an instance of the `Service` class (`tasks/libs/Service.js`). In order to work, a service needs:

- A name (unique)
- A reference to a ServiceManager
- An API (node module that does *all* the work)

For example, adding a Github service:

```
  // at the end of _setters
  {
    github: function (servicesManager) {
      var config = servicesManager.config;
      var Q = require('q');
      var Service = require('./Service');
      var self = servicesManager;
      var api = require('node-github');
      servicesManager.services['github'] = new Service('github', servicesManager, api);
      // set commands...
    }
  }
```

## Release History

- **v0.3.0** - *2014-12-08*

     - Refactor architecture (again). For Manager users: run `grunt tdw:c:XXX` to start workflow and `grunt tdw:f` to end it

- **v0.2.2** - *2014-09-16*

     - Quick fix on Gitlab.getMergeRequest , per_page is now fixed to the max (100)

- **v0.2.1** - *2014-08-26*

     - The user can now specify one or more labels to each kind of development (*feat*, *fix*...) in the Gruntfile (see [shared options](#shared-options)) for the Gitlab configuration

- **v0.2.0** - *2014-08-22*

 - Refactor architecture. The grunt task is now composed of:
 
     - `ttdev.js` the main file
     - `lib/LogService.js` the class to display messages to the output
     - `lib/Util.js` the class to handle the workflow steps
     - `lib/Index.js` the class to find and get the available commands (Git, Gitlab, Jira)
     - `lib/Git` the class to run the commands related to git
     - `lib/Gitlab` the class to run the commands related to Gitlab
     - `lib/Jira`the class to run the commands related to Jira

- **v0.1.2** - *2014-08-18*

 - Fix `git checkout branch` process when running the command on the same branch
 - Fix assigning a JIRA issue to the developer (was assigning at each JIRA card check)
 - Changed the merge request title. Its pattern is: `type(JIRA issue): JIRA issue summary`

- **v0.1.1** - *2014-08-18*
 - Fix JIRA issue transitions from one column to another

- **v0.1.0** - *2014-07-28*
 - First release