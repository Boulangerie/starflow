# How to use Starflow

Starflow itself doesn't do much apart from providing services and classes to build [executables](glossary.md#executable).
To let Starflow handle your workflow, you have to follow these few steps:

1. write and provide your workflow as a list of [steps](glossary.md#step)
2. create a new [Workflow](glossary.md#workflow) instance and give it the steps
3. register Starflow plugins to the workflow (and specify some aliases if necessary)
4. run the workflow

### Example

```js
var starflow = require('starflow');

// step 1
var steps = [
  'git.stash',
  { 'git.checkout': 'master' },
  { 'git.fetch': ['origin', 'master'] },
  { '$': ['git', 'rebase', 'origin/master', 'master'] },
  { 'git.stash': true }
];

// step 2
var workflow = new starflow.Workflow(steps);
return workflow
  // step 3
  .addPlugin(require('starflow-git'))
  .addPlugin(require('starflow-shell'))
  .addAliases('$', 'shell.spawn')
  // step 4
  .run();
```
