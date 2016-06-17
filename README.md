<h1 align="center">Starflow</h1>
<p align="center">Automate repetitive tasks easily</p>

## What is Starflow?

Starflow provides some tools to automate the repetitive tasks you have to endure in your development workflow.
These tasks can be as complex as you like as long as you can write them as javascript modules. 

## Documentation

Want to start using Starflow? Want to create plugins? Want to know how Starflow works internally? Have a question about the project? Then check out our [Documentation page](docs/README.md)!

## Example

Let's assume you want to automate the following tasks:

- go to main git branch and update it
- create a new branch and check out to it

Then the following file would do it for you:

```js
// startDev.js

var starflow = require('starflow');

var args = process.argv.slice(2);
var steps = [
  {'git.checkout':     'master'},
  {'git.fetch':        ['origin', 'master']},
  {'git.rebase':       ['origin/master', 'master']},
  {'git.createBranch': args[0]},
  {'git.checkout':     args[0]}
];

var workflow = new starflow.Workflow(steps);
return workflow
  .addPlugin(require('starflow-git'))
  .run();
```

Then simply run `node startDev.js my-feature-branch` in your terminal.

## Want to contribute?

Anyone can help us improve this project. Feel free to read our [Contributing guide](CONTRIBUTING.md)!
