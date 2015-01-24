# grunt-dev-workflow v1.0.0
> Manage your developement workflows with a configuration file.

## TL;DR Manager

Initialize your workflow by using the following command in the terminal:

```
grunt tdw:c:<issue number>
```

Replace `<issue number>` with the JIRA issue number (e.g. 471).

For example, if we have:

- **branchTpl** `{{ issueType }}/{{ issueKey }}/{{ issueSlug }}`
- **terminal command** `grunt tdw:c:471`

Then the branch `new-feature/MAN-471/keepit-test-grunt-dev-workflow` will be created.

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

The `grunt-dev-workflow` task is a multitask that can be run in a tasks sequence or in the terminal. If you are using JIRA platform and you are starting a new dev, it is **mandatory** to provide the JIRA issue number as a parameter when you run the task in the terminal. Else, the JIRA issue key will be found in the dev branch. Parameters can be passed by appending `:param` to the grunt task name (e.g. `grunt tdw:target:param1:param2`).

### Authentication

In order to use the Gitlab or JIRA APIs, the task needs your credentials. For that, you need to add environment variables in your `~/.bash_profile` file:

```
// at the end of the file
export GITLAB_TOKEN="private token"
export JIRA_USERNAME="username"
export JIRA_PASSWORD="password"
```

> **Note:**
> If your password contains `$` characters, make sure to escape it in the `~/.bash_profile` file.
> *Example*: `export JIRA_PASSWORD="test\$bob"`

### Options

#### Shared options

The targets can share configuration, for that all you need is to put it in the `options` property of the `tdw` task:
```
      // somewhere in the Gruntfile
      tdw: {
        options: {
          mySharedData: 'shared'
        },
        // targets config...
      }
```

##### List of shared options

- **branchTpl** ( *string* ): The branch name template. Available variables: `{{ issueType }}`, `{{ issueKey }}` and `{{ issueSlug }}`. Example:

 ```
 branchTpl: "{{ issueType }}/{{ issueKey }}/{{ issueSlug }}"
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
      projectKey: 'MAN'
 }
 ```


#### Target specific information

The goal of the `grunt-dev-workflow` is to let you define the workflow(s) you will use to work on an issue.

> A **workflow** is a series of steps the developer has to go through in order to work on an issue/feature.

A workflow is defined as the value of a target. It's an array where each element can is an object with a single key associated to an array. For example:

 ```
 { 'createBranch': [] },
 { 'gitRebase': ['origin/master', 'master'] }
 ```

### Available commands

**setJiraApiInstance**

*Instantiate an object to communicate with the Jira API.*

Parameters: *none*

> **Note**
> This command is automatically inserted in the workflow when the task detects if the workflow uses the Jira API

**setGitlabApiInstance**

*Instantiate an object to communicate with the Gitlab API.*

Parameters: *none*

> **Note**
> This command is automatically inserted in the workflow when the task detects if the workflow uses the Gitlab API

**setGitApiInstance**

*Instantiate an object to perform git commands.*

Parameters: *none*

> **Note**
> This command is automatically inserted in the workflow when the task detects if the workflow uses Git commands

**getDevBranchName**

*Try to build the dev branch name with the data provided by user and the current branch name. If the workflow uses Jira and if the issue is a subtask, then the issue type put in the dev branch name will be the issue type of the issue parent*

Parameters: *none*

Example:

- Issue type of MAN-123 is `subtask`, then take issue type of its parent (MAN-456), which is for example `improvement`

**findIssueKey**

*Try to find the issue key from the data provided by the user and from the current branch name.*

Parameters: *none*

> **Note**
> This command is automatically inserted in the workflow when the task detects if the workflow uses `getJiraIssue` or `getDevBranchName`

Examples:

- If the user provides `options.jira.projectKey` (MAN) and `123` as a param to the task (`grunt tdw:c:123`), then the issue key will be `MAN-123`
- If the user doesn't provide the project key or the issue number, but the current branch is `improvement/MAN-123/hello-world` and the branch template is `{{issueType}}/{{issueKey}}/{{issueSlug}}`, then the key will be `MAN-123`

**gitCheckout**

*Perform a `git checkout param1`.*

Parameters:

- param1: the branch. If none, fallback to the last branch created, then the dev branch (e.g. new-feature/MAN-123/hello-world), then `master`

**gitFetch**

*Perform a `git fetch param1 param2`.*

Parameters:

- param1: the remote. If none, fallback to `origin`
- param2: the branch. If none, the command fetches all the branches from the remote

**gitRebase**

*Perform a `git rebase param1 param2`.*

Parameters:

- param1: the branch to rebase from. If none, fallback to `origin/master`
- param2: the branch to rebase to. If none, fallback to `master`

**gitPush**

*Perform a `git push param1 param2`.*

Parameters:

- param1: the remote. If none, fallback to `origin`
- param2: the branch. If none, fallback to the last branch created, then the dev branch (e.g. new-feature/MAN-123/hello-world)

**createBranch**

*Perform a `git branch param1`.*

Parameters:

- param1: the branch. If none, fallback to the grunt task param (which is usually the issue number), then the dev branch name (e.g. new-feature/MAN-123/hello-world)

Examples:

- If the task is run with `grunt tdw:c:hello-world`, then the `hello-world` branch will be created
- If the task is run with `grunt tdw:c:471`, then the `new-feature/MAN-471/keepit-test-grunt-dev-workflow` branch will be created

**createBranch**

*Perform a `git branch param1`.*

Parameters:

- param1: the branch. If none, fallback to the grunt task param (which is usually the issue number), then the dev branch name (e.g. new-feature/MAN-123/hello-world)

Examples:

- If the task is run with `grunt tdw:c:hello-world`, then the `hello-world` branch will be created
- If the task is run with `grunt tdw:c:471`, then the `new-feature/MAN-471/keepit-test-grunt-dev-workflow` branch will be created

**getJiraIssue**

*Get the issue object from Jira API related to issue key provided*

Parameters:

- param1: the issue key. If none, use results from `findIssueKey` command

**assignJiraIssue**

*Assign someone to the issue*

Parameters:

- param1: the assignee's username. If none, use the user's username (provided to connect to the API, `JIRA_USERNAME`)

**getJiraIssueStatuses**

*Get the available statuses for a given issue*

Parameters:

- param1: the issue key. If none, use results from `findIssueKey` command

**changeJiraIssueStatus**

*Change the issue status (e.g. from `Ready` to `In Progress`).*

Parameters:

- param1: the issue key. If none, use results from `findIssueKey` command
- param2: the status. It must be an element of the array got with `getJiraIssueStatuses`

**getGitlabProject**

*Get the Gitlab project with the `options.gitlab.projectName` name from Gitlab API.*

Parameters:

- param1: the project's name. If none, use the project name provided in the config

**getMergeRequestBetween**

*Get the Gitlab merge request between 2 branches.*

Parameters:

- param1: the source branch. If none, use the last created branch, then the current branch
- param2: the target branch. If none, use `master`

**getGitlabUser**

*Get the Gitlab user.*

Parameters:

- param1: the username (e.g. bruiz)

**createMergeRequest**

*Create a new merge request on Gitlab.*

Parameters:

- param1: the source branch. If none, use the last created branch, then the current branch
- param2: the target branch. If none, use `master`

**assignMergeRequest**

*Create a new merge request on Gitlab.*

Parameters:

- param1: the username
- param2: the source branch. If none, use the last created branch, then the current branch
- param3: the target branch. If none, use `master`

## Release History

- **v1.0.0** - *2015-01-24*

    - Deep internal mechanism refactoring
    - Changes on the available commands and the config syntax for the workflows

- **v0.3.1** - *2015-01-05*

    - Fix bug when doing *git checkout* on the new working branch

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