# Starflow API

Starflow doesn't do much on its own, it relies on several services to work. For a much detailed view of these services, feel free to read the [internals] page.
Starflow exposes 2 services and 6 classes:

- [logger](#logger)
- [config](#config)
- [Workflow](#workflow)
- [Task](#task)
- [Sequence](#sequence)
- [Concurrency](#concurrency)
- [BaseExecutable](#baseexecutable)
- [Storage](#storage)

## logger

```js
require('starflow').logger
```

This helper is used to display messages within [Executable](writing-a-plugin.md#Executable) methods.
For more details on this service, please check out the [Logger section](internals.md#logger) of the Starflow internals page.

### Example

#### Input

Assuming **waterfall** is a step that takes another step as the first parameter and **noOp** a step that does nothing. 

```js
// my-workflow.js

var starflow = require('starflow');

var steps = [
  {'waterfall': [
    {'waterfall': [
      {'waterfall': [
        'noOp'
      ]}
    ]}
  ]}
];

var workflow = new starflow.Workflow(steps);
return workflow
  .register('waterfall', require('path/to/waterfall-factory'))
  .register('noOp', require('path-to-noOp-factory'))
  .run();
```

#### Output

```sh
node my-workflow.js
```

<img width="360px" src="https://cloud.githubusercontent.com/assets/5022023/16178444/275d3a8a-3648-11e6-8013-4dbb32227cba.png" alt="Example of output with logger" />

As you can see, `require('starflow').logger.log(<message>)` was used to display these messages. If `console.log(<message>)` was used instead, the messages would start at the beginning of the line, breaking the output structure.

### Methods

- **setDepthLimit(limit: number): void** - set the depth limit. Above this limit, no message will be displayed
- **debug(message: string): void** - display a purple message only if the env variable `DEBUG` is truthy
- **error(message: string): void** - display a red message
- **success(message: string): void** - display a green message
- **warning(message: string): void** - display a yellow message
- **log(message: string[, type: string]): void** - display a message

## config

```js
require('starflow').config
```

This service holds a config object accessible to anyone. It can be used to store credentials (e.g. for Github, Jenkins...).
It uses [rc](https://github.com/dominictarr/rc) to get the config from `.starflowrc` files, environment variables which names start with `starflow_`, etc.

For example, if the following `.starflowrc` file is present at the root of your project:

```json
{
  "JENKINS_URL": "https://my-team.jenkins.net"
}
```

and the `starflow_JIRA_URL=https://my-team.jira.net` env variable is exported, then:

```js
var assert = require('assert');
var config = require('starflow').config;
// true
assert(config.get('JENKINS_URL') === 'https://my-team.jenkins.net');
// true
assert(config.get('JIRA_URL') === 'https://my-team.jira.net');
```

### Methods

- **get(path: string[, defaultValue: any]): any** - get the value at the given `path`, or get `defaultValue` if undefined

## Workflow

Given a list of [steps](glossary.md#step) and (optionally) an initial [workspace](glossary.md#workspace), a Workflow will process each step one after the other, using its workspace if necessary.
In order for a workflow to work, it needs to know the mapping between a step name and the related [factory](glossary.md#factory), hence the `register` method.

### Example

```js
var starflow = require('starflow');

var initialWorkspace = {
  myList: ['a', 'b']
};
var steps = [
  {'echo': '/::myList'}
];

var workflow = new starflow.Workflow(steps, initialWorkspace);
return workflow
  .register('echo', require('path/to/echoFactory'))
  .run();
```

### Methods

- **constructor(steps: Array<any>[, initialWorkspace: any])**
- **addPlugin(starflowPlugin): Workflow** - register a Starflow plugin in the workflow
- **addAliases(names: string|Array\<string\>, executableName: string): Workflow** - register several aliases for a given executable of the workflow
- **register(names: string|Array\<string\>, factory: () => Executable): Workflow** - save a map between a name/multiple names and a factory
- **unregister(names: string|Array\<string\>): Workflow** - remove a map between a name/multiple names and a factory
- **getFactory(name: string): () => Executable** - given a `name`, get the associated factory
- **run(): Promise** - process the steps one after the other
- **stepToTask(step: any): Task** - transform a `step` into an instance of Task
- **processStep(step: any): Promise** - transform a `step` into a task then run it

## Task

A task is a more elaborated version of a step. It has all the information to make an executable work.

### Attributes

- **name: string** - the name of the step
- **description: string** - (optional) the description visible in the header in the output
- **args: Array\<any\>** - a list of parameters (same as the ones from the step)
- **instance: Executable** - an instance of the [Executable](glossary.md#executable) got from the factory associated to the step's name

### Methods

- **constructor(instance: Executable[, args: Array\<any\>[, name: string[, description: string]]])**
- **interpolate([storage: Storage]): void** - process each of the parameters to replace `{{foo}}` and `::bar` statements with their appropriate values. Automatically called by run()
- **run(): Promise** - call the `exec` method of the executable with the step parameters

## Sequence

A sequence is an object holding [items](glossary.md#item). When the `run` method is called, the sequence will run each of its items *synchronously*.

### Attributes

- **items: Array\<Item\>** - list of items

### Methods

- **constructor(items: Array\<Item\>)**
- **run(): Promise** - run each item, synchronously

## Concurrency

A concurrency is an object holding [items](glossary.md#item). When the `run` method is called, the concurrency will run each of its items *asynchronously*.

### Attributes

- **items: Array\<Item\>** - list of items

### Methods

- **constructor(items: Array\<Item\>)**
- **run(): Promise** - run each item, asynchronously

## BaseExecutable

Every executable must inherit from this class to work properly.

### Attributes

- **name: string** - the name of the executable
- **storage: Storage** - the storage where the executable data (and its children's) is stored
- **initiator: Workflow** - a reference to the workflow that built the executable. `null` for the executable that are built in other executables

### Methods

- **constructor(name: string)**
- **addChild(executable: Executable)** - add a new child to the executable storage object
- **createExecutable(factory: () => Executable, factoryArgs: Array<any>): Executable** - helper to create a new exectuable and add it as a new child to the storage
- **exec(...args: any): Promise** - must be implemented in any inherited class. This method is called when running a Task

## Storage

A storage is a place where an executable can store data. In addition, when an executable creates new executables, its children storages are stored in the executable's storage.

### Path format

To get or set data to a storage, you need to provide a path.
You can get data from the current storage or its children and their children (and so on), but you can't go up (from a child to its parent(s)).

```js
// Let's assume simplifiedStorage and the children elements are instances of Storage
// Here we represent them as simple object for better readability

var storage = {
  workspace: {
    user: {
      name: 'Bob'
    }
  },
  children: {
    child: [
      {
        workspace: {
          user: {
            name: 'Henri'
          }
        },
        children: {
          grandChild: [
            {
              workspace: {
                user: {
                  name: 'Robert'
                }
              },
              children: []
            },
            {
              workspace: {
                user: {
                  name: 'Jean'
                }
              },
              children: []
            }
          ]
        }
      }
    ]
  }
};

var childUserName = storage.get('child/user.name'); // Henri

var firstGrandChildUserName = storage.get('child/grandChild/user.name'); // Robert
// same as
firstGrandChildUserName = storage.get('child/grandChild/0.user.name'); // Robert

var secondGrandChildUserName = storage.get('child/grandChild/1.user.name'); // Jean
// here, same as
secondGrandChildUserName = storage.get('child/grandChild/$last.user.name'); // Jean
```

Finally, if a child (or child's child, etc.) wants to get a value from the top storage (the `root`), it can prefix the path with a `/`:

```js
// in the first grandChild storage
var rootUserName = firstGrandChild.get('/user.name'); // Bob

// careful though as it's not the same as
var currentUserName = firstGrandChild.get('user.name'); // Jean
```

### Attributes

- **name: string** - name of the storage, the same name as the executable that owns the storage
- **workspace: any** - object where the executable data is stored
- **children: Array\<any\>** - map of `executableName => Array<Storage>` holding the children storages
- **root: Storage** - reference to the root storage (or `null` for the root storage instance)

### Methods

- **constructor(name: string[, initialWorkspace: any])**
- **addChild(name: string, storage: Storage): void** - add a child storage
- **get(path: string[, defaultValue: any): any** - get the data at the `path` location, or `defaultValue` if undefined is found
- **getChildAt(name: string, index: number): Storage** - get the child storage at the given `index`
- **set(path: string, value: any): any** - set the data at the `path` location
- **extractPath(path: string): any** - parse a path and extract information out of it

[internals]: internals.md
