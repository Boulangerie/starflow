# :star2::rocket::star2: Starflow v0.0.1 :star2::rocket::star2:

## Description
Every time you work on a project, you need to do the same tasks over and over again. Would it not be great if there was some sort of a tool that deals with this for us? Introducing Starflow.

The idea is simple: we all have some boring manual **workflows** we want to automate, such as:

- Start a new feature
- End a feature
- Move to another on-going task
 
But this isn't that easy, right? **Starting a new feature** actually means:
 
- Fetch the last changes from the remote repository
- Go on the master branch
- ...more git stuff...
- Check the corresponding ticket/issue on your agile tool (like *Jira*)
- ...more Jira stuff...

If, like us, you think these tasks are simple but repetitive and a waste of time, then...
 
**Starflow** comes to the rescue!
 
Describe your **workflows** as a succession of steps and Starflow will handle the rest for you. Now you can say it's simple to *Start a new feature*.

This is **Starflow** and you are going love it!

## Install

Starflow is a workflow helper.

- Create a new node project
- Install **Starflow** as a devDependency (or dependency if you make a starflow plugin)
  * `npm install starflow --save-dev` (or `npm install starflow --save`)

**That's all folks! Now you are ready to create your workflows.**

## Basic Example

The following starflow usage will show you how to echo a prompted value.

```javascript
// Filename: echoPromptFlow.js

// 1) Get the starflow module
var starflow = require('starflow');

// Optional) Set how starflow will be verbose or not during its execution
starflow.logger.level = starflow.logger.LEVEL.ALL;

// 2) Get the APIs/services you need for your workflow (public or yours)
var starflowShell = require('starflow-shell');

// 3) Set the configuration of your workflow
var config = {
  args: require('yargs').argv,
  muteDepth: -1,
  prompt: {
    main: {
      properties: {
        title: {
          pattern: /^[a-zA-Z\s\-\!\?]+$/,
          message: 'Title must be only letters, spaces, question/exclamation marks or dashes',
          required: true
        }
      }
    }
  }
};

// 4) Declare your workflow
var echoPromptFlow = [
  {'prompt': 'main'},
  {'$': ['echo', '{{prompt.main.result.title}}']}
];

// 5) Configure starflow then run your workflow!
starflow
  .init(echoPromptFlow, config)
  .register('$', starflowShell.spawn) // use the starflowShell.spawn factory through the '$' text in your workflow
  .register('prompt', starflowShell.prompt)
  .runWorkflow()
  .done();
```

Finally, execute your script with the node command:
```
node echoPromptFlow.js
```

And you should see: 

![My first starflow](https://cloud.githubusercontent.com/assets/7902756/12002432/032a6320-aafe-11e5-9701-84c1af4a0728.gif)

:warning: In this example we use the `yargs` module to parse the arguments passed when running the script, feel free to change it :warning:

## How does it work

### Activity diagram of a workflow

The following diagram represents how Starflow works and you can picture it with the basic example above.
![UML Activity diagram](https://www.lucidchart.com/publicSegments/view/e82a628d-a8ed-413b-bb59-44bbf5cf4634/image.png)

### Class diagram
![UML Class diagram](https://www.lucidchart.com/publicSegments/view/61f3a758-54c7-481a-9c88-000d20ab5648/image.png)

#### Starflow: core
This is our engine which will run the workflow. As you can see in the example, it will gather all the tasks/sequences and configuration then run them sequentially following the order of the workflow.

#### Logger: display
This helper class will allow you to show messages during the Starflow execution. You can configure it and use it in your own Tasks factories.

#### APIs/services
You can create your own services by just implementing the `Executable` interface.
We use the [composite design](https://en.wikipedia.org/wiki/Composite_pattern) pattern for creating complex **workflows** with small blocks represented by **Task** and **Sequence**.

## Implementing your own service

You might not find a service out there that fits your needs, so let's see how we can create one with a simple example.

### The echo service: the minimum
Here is an example of an echo service which simply displays a message with the starflow Logger singleton.
As mentioned above, we need to create a class that implements the `Executable` interface, then let Starflow handle the rest.

```javascript
// echo.js
var starflow = require('starflow');

// This is the main class of our echo service
function Echo() {}

// Implementing the Executable interface just means declaring an exec method on the class
Echo.prototype.exec = function exec(message) {
  starflow.logger.log(message);
};

// Important: export a function that returns an instance of your class (hence, a factory)
module.exports = function () {
  return new Echo();
};
```

**Echo service done!**

If you want to use this task instead of the spawn.echo used in [Basic example](https://github.com/ebuzzing/starflow#basic-example), you have to update the example this way:

```javascript
// echoPromptFlow.js

// 2) Get the APIs/services you need for your workflow (public or yours)
var starflowShell = require('starflow-shell');
var echo = require('./echo');

// ...

// 4) Declare your workflow (we replaced the previous shell echo with our echo implementation)
var echoPromptFlow = [
  {'prompt': 'main'},
  {'echo', '{{prompt.main.result.title}}'}
];

// 5) Configure starflow then run your workflow!
starflow
  .init(echoPromptFlow, config)
  .register('echo', echo)
  .register('prompt', starflowShell.prompt)
  .runWorkflow()
  .done();
```

That's all! Your workflow now uses the service you created.
But we can still improve it...

### The echo service: refactor it with a solid and extensible API architecture

First let's create a folder where you will save all the services with a shared namespace.

For our example, we need to create an `echo` folder.

Inside, there will be a file which will be the entry point to all the services. Let's create this file: name it `lightening-buzz-echo.js` (for example).
The content is the following:

```javascript
// echo/lightening-buzz-echo.js
module.exports = {
  echo: require('./echo')
};
```

Our previous `echo.js` file has to be moved in our freshly created `echo` folder without modification.

Final step (for now), updating the main script:

```javascript
// echoPromptFlow.js
// 2) Get the APIs/services you need for your workflow (public or yours)
var starflowShell = require('starflow-shell');
var lighteningBuzzEcho = require('./echo/lightening-buzz-echo');

// ...

// 5) Configure starflow then run your workflow!
starflow
  .init(echoPromptFlow, config)
  .register('echo', lighteningBuzzEcho.echo)
  .register('prompt', starflowShell.prompt)
  .runWorkflow()
  .done();
```

Now you have a clean namespace you can extend as you wish.
> Wait, displaying a message is cool but what if I want to create a service that interacts with an API like Github? Can I configure it?

Sure! Let's improve our example to make it configurable.

### The echo service: make it configurable

For our example, we want to set a prefix and a suffix for all messages that will be displayed.
By doing this, you can easily extend it to something more complex like configuring a Github API with credentials for example.

Let's go back to our echo API (`echo/lightening-buzz-echo.js`) and make it configurable.

```javascript
// echo/lightening-buzz-echo.js
module.exports = function (prefix, suffix) {
  var configuration = {
    prefix: prefix,
    suffix: suffix
  };

  return {
    echo: require('./echo')(configuration)
  };
};
```

Instead of directly returning the services map, we wrap it into a function which accepts parameters.
Like this, when we will require the echo API, we will be able to configure it.

As you can see, we have changed the way to map our services. Let's update `echo/echo.js`:

```javascript
// echo/echo.js
var starflow = require('starflow');

function Echo(options) {
  this.options = {
    prefix : options.prefix || '',
    suffix : options.suffix || ''
  };
}

Echo.prototype.exec = function exec(message) {
  var fullMessage = [
    this.options.prefix,
    message,
    this.options.suffix
  ].join('');
  starflow.logger.log(fullMessage);
};

// We change the way we expose our service through the factory to accept parameters
module.exports = function (options) {
  return function echoFactory() { 
    return new Echo(options);
  };
};
```

Everything is almost over, we only need to update the main script (`echoPromptFlow.js`):

```javascript
// echoPromptFlow.js
// ...

// 2) Get the APIs/services you need for your workflow (public or yours)
var starflowShell = require('starflow-shell');
var lighteningBuzzEcho = require('./echo/lightening-buzz-echo')('[Buzz]: ', ' (⚡⚡⚡)');

// ...

// 5) Configure starflow then run your workflow!
starflow
  .init(echoPromptFlow, config)
  .register('echo', lighteningBuzzEcho.echo)
  .register('prompt', starflowShell.prompt)
  .runWorkflow()
  .done();
```

This is the end of the echo example. Happy _starflowing_ :star2::rocket::star2:!!!

Bonus: the Starflow execution:

![starflow-tutorial-execution](https://cloud.githubusercontent.com/assets/7902756/12003597/bf8ec71e-ab25-11e5-991f-4618cc299312.gif)

## Integration

As you see, using Starflow is basically binding some words (e.g. `$`, `prompt`, `echo`...) to service factories.
Creating your own factories is not complicated as long as the services implement the `Executable` interface.

### Available services

- Git (starflow-git)
- Github (starflow-github) (Work in progress)
- Jira (starflow-jira) (Work in progress)
- Npm (starflow-npm)
- Shell (starflow-shell)
- Teads (Work in progress - what we love to use at work)

![Starflow services](https://www.lucidchart.com/publicSegments/view/2aea0576-08f3-4e48-934a-287753476f2c/image.png)

### Contributors services

_We hope to fill this section with many links soon..._
