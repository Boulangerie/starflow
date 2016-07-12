# Glossary

You don't know what a term means and its description is not present here? Feel free to create an issue on this project and we'll add it!

### Step

A step is a raw version of a task. It's composed of a name and (optionally) parameters.
You can write a step in 3 different forms:

```js
// without any parameter
var form1 = 'myStepName'; // same as {'myStepName': []}

// with only 1 parameter
var form2 = {'myStepName': 'myParam'};

// with more than 1 parameter
var form3 = {'myStepName': ['myParam1', 'myParam2']};
```

If you need to get a value from a storage, you can use one of these statements:

- `'{{path/to/resource}}'`. Value interpreted as a string. Can be included in a text value, such as: `'Hello {{user.name}}!'`
- `'::path/to/resource'`. Value interpreted as is. This is how you can get an object or an array value

For example:

```js
var starflow = require('starflow');

var initialWorkspace = {
  jiraIssueKey: 'FOO-123'
};
var steps = [
  {'jira.getIssue': '{{/jiraIssueKey}}'}, // 'FOO-123'
  {'custom.doSomethingWithIssue': '::/jira.getIssue/issue'} // issue object retrieved at the previous step
  {'github.createPR': [
    'my-org',
    'project-name',
    'master',
    'my-feature-branch',
    '{{/jira.getIssue/issue.key}} - {{/jira.getIssue/issue.fields.summary}}' // e.g. 'FOO-123 - My issue summary'
  ]}
];

var workflow = new starflow.Workflow(steps, initialWorkspace);
return workflow
  // the starflow-jira plugin holds the jira.getIssue executable
  .addPlugin(require('starflow-jira'))
  // the starflow-github plugin holds the github.createPR executable
  .addPlugin(require('starflow-github'))
  // the (local) starflow-custom plugin holds the custom.doSomethingWithIssue executable
  .addPlugin(require('./custom/starflow-custom'))
  .run();
```

A list of steps is provided to a Workflow (class provided by Starflow) to process it.

### Workflow

A workflow is an object that takes a list of steps and (optionally) an initial workspace.
Its purpose is to transform the steps of the user's workflow into tasks then run them in the correct order.

The constructor is accessible via `require('starflow').Workflow`.

```js
// Example
var starflow = require('starflow');

var initialWorkspace = {
  name: 'Bob'
};
var steps = [
  { 'echo': 'Hello {{/name}}!' }
];

var workflow = new starflow.Workflow(steps, initialWorkspace);
return workflow
  .addPlugin(require('path/to/starflowPluginWithEcho'))
  .run();
```

### Item

An item is an interface that implements the `run` method. Task, Sequence and Concurrency are items.

### Task

A task is an executable wrapper that Starflow understands.

To get a task, you can either transform a step via `Workflow.prototype.stepToTask` or instantiate one using the `starflow.Task` constructor. Using this constructor implies providing the following information:

- a reference to an executable instance (created using a [factory](#factory))
- an array of values used as arguments for the executable `exec` method
- optionally a title (for logging purposes)
- optionally a description (for logging purposes)

```js
var starflow = require('starflow');

// first way: using a workflow
var step = {'custom.echo': ['hello', 'world']};
var workflow = new starflow.Workflow(steps);
workflow.addPlugin(require('path/to/customEchoPlugin'));
var myTask = workflow.stepToTask(step);

// second way: using the Task constructor
var echoFactory = require('path/to/customEchoPlugin').factories.echo;
var myTask = new starflow.Task(echoFactory(), ['hello', 'world']);
```

### Executable

An executable is a class that implements the `exec` method.
This method is eventually executed when running the workflow.


So, when a user writes a step in its workflow, the step name has to be linked to an executable factory.
This way, the workflow object that runs the user's steps knows which executable to use for the step being processed.

The name of an executable is important as it is used when accessing a resource using a [Storage].

Starflow plugins are actually executable bundles. Learn more about writing a Starflow plugin [through our guide](writing-a-plugin.md).

```js
// Example

module.exports = function (starflow) {
  function Echo() {
    // the name is 'foo.echo'
    starflow.BaseExecutable.call(this, 'foo.echo');
  }
  Echo.prototype = Object.create(starflow.BaseExecutable.prototype);
  Echo.prototype.constructor = Echo;
  
  Echo.prototype.exec = function exec(message) {
    starflow.logger.log(message);
  };
  
  // exporting a factory is required
  return function echoFactory() {
    return new Echo();
  };
};
```

### Workspace

A workspace is a part of a [Storage] where data is stored.

### Storage

A storage is used to store data for an executable and its children (i.e. executables used inside the executable).
It is composed of 2 parts:

- A workspace, where the data is stored
- A map of `executable name => list of storages`

Please check [the Storage section](API.md#storage) of our API page for more information.

### Factory

A factory, in the Starflow environment, is a function that returns an instance of an [Executable].
Every executable file should export a factory.

[Storage]: #storage
[Executable]: #executable
