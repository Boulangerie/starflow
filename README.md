# :star2::rocket::star2: Starflow v0.0.1 :star2::rocket::star2:

## Description
Because we always do the same boring tasks every day when we code, we have to invent a tool which can simplify our lives. Starflow idea was born.

Idea is simple, we all have some boring manual **workflows** we want to automatize, like:

- Start a new feature
- End a feature
- Quick move to an other current task
 
But this isn't so easy rights, in reality **Start a new feature** means :
 
- Fetch your repo
- Go to master
- ...more git stuff...
- Check corresponding card on your agile tool like *Jira*
- ...more jira stuff...

If like us you think this kind of task are easy but also a waste of time
 
**Starflow** come to your rescue !
 
Describe yours **Workflows** as **Sequences** of **Tasks** and just call them. Now you can say it's simple to *Start a new feature*

This is **Starflow** and you gonna love it !

## Install

Starflow is a workflow helper

- Create a new node/npm project
- Install **Starflow** as dependency or devDependency
  * `npm install starflow --save`
  * `npm install starflow --save-dev`

**That's all folks ! Now you are ready to create your starflows**

## Basic Example

A starflow workflow is a nodejs script where you will tell starflow what you want to do. The following starflow will show you how to echo a prompted value.

```javascript
//Filename: promptEchoFlow.js

//1) Get the starflow module
var starflow = require('starflow');

//Optional) Set how starflow will be verbose or not during is execution
starflow.logger.level = starflow.logger.LEVEL.ALL;

//2) Get all API you needs for your workflow (public or yours)
var starflowShell = require('starflow-shell');

//3) Set the configuration of your workflow
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

//4) Declare your workflow
var promptEchoFlow = [
  {'prompt': 'main'},
  {'$': ['echo', ['{{prompt.main.result.title}}']]}
];

//5) Put all together and run your workflow !
starflow
  .init(promptEchoFlow, config)
  .register(['$', 'shell.spawn'], starflowShell.spawn)
  .register('prompt', starflowShell.prompt)
  .runWorkflow()
  .done();
```

Now you just have to call your starflow with node
```
node echoPromptFlow
```

And you will see 

![My first starflow](https://cloud.githubusercontent.com/assets/7902756/12002432/032a6320-aafe-11e5-9701-84c1af4a0728.gif)

:warning: We use `yargs` package for parsing potential arguments passed to your workflow, feel free to change it :warning:


## How does it work's

### Activity diagram of a starflow

The following diagram represent how a starflow works and you can picture it with the basic example above.
![UML Activity diagram](https://www.lucidchart.com/publicSegments/view/e82a628d-a8ed-413b-bb59-44bbf5cf4634/image.png)

### Class diagram
![UML Class diagram](https://www.lucidchart.com/publicSegments/view/61f3a758-54c7-481a-9c88-000d20ab5648/image.png)

#### Starflow : Core 
This is our engine which will run all logic. As you see in example it will put together all Task/Sequence, configuration and run them sequentially via a Promise chain.
 
#### Logger : Display
This helper class will allow you to show messages during starflow execution. You can configure it and use it in your own Task factories.

#### Task factory : API's
You can create your own Task by just implementing the `Executable` interface. This is the minimum for a Task Factory.
We use the [composite design](https://en.wikipedia.org/wiki/Composite_pattern) pattern for creating complex **starflow** with small blocks represented by **Task** and **Sequence**

## Implement your own Task Factory

Use our Task Factories or Public API is cool, but maybe they don't fit to your needs and you want to implement
your own Task Factories and API's. You can mimic our architecture for build your own if you want. 
So let's start with the most simple example.

### Your echo task factory : The minimum
Here is an example of an echo Task which just display a message with starflow Logger.
As we said above, we have to implement the `Executable` interface and this should do the trick !

```javascript
//echo/echo.js
var starflow = require('starflow');

function Echo() {}

//Implement Executable interface just means declare an exec function here.
Echo.prototype.exec = function exec(message) {
  starflow.logger.log(message);
};

module.exports = function () {
  return new Echo();
};
```
**Task Factory done !**

If you want to use this task instead of the spawn.echo used in [Basic example](https://github.com/ebuzzing/starflow#basic-example)
You have to update the example this way

```javascript
//promptEchoFlow.js

//2) Get all API you needs for your workflow (public or yours)
var starflowShell = require('starflow-shell');
var echo = require('./echo/echo');

//...

//4) Declare your workflow (we replace previous shell echo by our implementation)
var promptEchoFlow = [
  {'prompt': 'main'},
  {'echo', ['{{prompt.main.result.title}}']}
];

//5) Put all together and run your workflow ! (Same work here)
starflow
  .init(promptEchoFlow, config)
  .register('echo', echo)
  .register('prompt', starflowShell.prompt)
  .runWorkflow()
  .done();
```

That all ! Your starflow now use your Task.
But we don't recommand you to use this kind of implementation, you should follow our API structure.

### Your echo task factory : Refactor it with a solid and extensible API architecture

We have a really simple architecture you could use for your own implementation.
First create a folder where you will save all your API files.

For our example, we suppose we create an `echo` folder.

Inside of it we will create a module which will be our access to all our API Task we will define here.
You could namespace it if you want.

We will create `lightening-buzz-echo.js` file which will be our API module.

Inside of it we just create a mapping to our different Task

```javascript
//echo/lightening-buzz-echo.js
module.exports = {
  echo: require('./echo')
};
```

Our previous `echo.js` file have to be moved in our fresh API folder without modification.

Final step for now, we update our starflow with our updates

```javascript
//promptEchoFlow.js
//2) Get all API you needs for your workflow
var starflowShell = require('starflow-shell');
var lighteningBuzzEcho = require('./echo/lightening-buzz-echo');

//...

//5) Put all together and run your workflow !
starflow
  .init(promptEchoFlow, config)
  .register('echo', lighteningBuzzEcho.echo)
  .register('prompt', starflowShell.prompt)
  .runWorkflow()
  .done();
```

Now you have a clean API you can extend as you want.
> Wait, Echo something is good but if I want create an API mapped with an
> other service like Github, Can I configure it ?

Sure let's improve our example to be configurable.

### Your echo task factory : Render our API configurable

For our example, we want to configure a prefix and a suffix for all message we will echo.
By doing this you can easily extend it to something more complex like configuring this Github API with credential for example.
 
So back to our Module API `echo/lightening-buzz-echo.js` and render it configurable

```javascript
//echo/lightening-buzz-echo.js
module.exports = function echoFactory(prefix, suffix) {
  var configuration = {
    prefix: prefix,
    suffix: suffix
  };

  return {
    echo: require('./echo')(configuration)
  };
};
```

Instead of directly return the api, we wrap it into a function which accept parameters.
Like this when we will get our API we can configure it.

As you can see we have changed the way to map our tasks, let's update `echo/echo.js`

```javascript
//echo/echo.js
var starflow = require('starflow');

//We add our task configurable by the API module by defining args and setup a task
//configuration.
function Echo(apiConfig) {
  this.apiConfig = {
    prefix : (apiConfig.prefix || ""),
    suffix : (apiConfig.suffix || "")
  };
}

Echo.prototype.exec = function exec(message) {
  var fullMessage = [
    this.apiConfig.prefix,
    message,
    this.apiConfig.suffix
  ].join("");
  starflow.logger.log(fullMessage);
};

//We change the way we expose our Task Factory for accept the module API
//configuration at the runtime.
module.exports = function (config) {
  return function(){ 
    return new Echo(config);
  };
};
```

Almost all is done, we will update our starflow(`promptEchoFlow.js`) 
for finalize this tutorial.

```javascript
//promptEchoFlow.js
//...

//2) Get all API you needs for your workflow
var starflowShell = require('starflow-shell');
var lighteningBuzzEcho = require('./echo/lightening-buzz-echo')("[Buzz]: ", " (⚡⚡⚡)");

//...

//5) Put all together and run your workflow !
starflow
  .init(promptEchoFlow, config)
  .register('echo', lighteningBuzzEcho.echo)
  .register('prompt', starflowShell.prompt)
  .runWorkflow()
  .done();
```

This is the end of this tutorial, API Starflowing :star2::rocket::star2: !!!
In bonus, the Starflow execution

![starflow-tutorial-execution](https://cloud.githubusercontent.com/assets/7902756/12003597/bf8ec71e-ab25-11e5-991f-4618cc299312.gif)

## Integrations

As you see create a starflow is just a binding of tasks defined in API. 
As explain you can create yours and use ours.
Here we will detail our integration and yours if you choose to put them public :smiley:

### Our Public API

- Git
- Github (Work in progress)
- Jira (Work in progress)
- Npm
- Shell
- Teads (Work in progress - What we love use at work)

And an image for API detail
![Starflow public API](https://www.lucidchart.com/publicSegments/view/2aea0576-08f3-4e48-934a-287753476f2c/image.png)

### Contributors API's

_We hope to fill this field with many API's soon..._
