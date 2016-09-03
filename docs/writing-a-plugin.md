# How to write a Starflow plugin

## What it does

A Starflow plugin provides classes that perform a specific action that is somehow linked to a [step](glossary.md#step).
The most basic form of a plugin looks like this:

```js
// index.js, i.e. the plugin entry point
module.exports = function (starflow) {
  return {
    factories: {
      foo: require('./lib/foo')(starflow)
    }
  };
};

// lib/foo.js
module.exports = function (starflow) {
  function Foo() {
    // 'my-plugin.foo' is the name of the executable
    starflow.BaseExecutable.call(this, 'my-plugin.foo');
  }
  Foo.prototype = Object.create(starflow.BaseExecutable.prototype);
  Foo.prototype.constructor = Foo;
  
  Foo.prototype.exec = function exec() {
    starflow.logger.log('Hello, World!');
  };
  
  // always export a factory
  return function () {
    return new Foo();
  };
};
```

The executable classes you write are used when Starflow processes the steps written by an end-user.
Essentially, a step is transformed into a task that holds a reference to an executable instance.
When the task is processed, it calls the `exec` method of its executable.

The steps transformation and tasks execution mechanics are handled by Starflow, leaving you with writing the executable definitions.

## Writing a simple plugin

A Starflow plugin is basically a function that:
 
- takes a reference to `starflow` as its first parameter
- exports an object which contains the `factories` property that holds a map to the different executable factories provided by the plugin

An executable object must extend its prototype from the one from `starflow.BaseExecutable`. In object-oriented programming terms, an executable class extends `starflow.BaseExecutable`.

### Example

Let's write a plugin that can create a new file based on a [handlebars](https://github.com/wycats/handlebars.js/) template. For example, based on the template `ngService.hbs`, I want to create a new Angular 1.X service with the name `bob` and the dependencies `$q` and `$window`.

#### The main file

The main file is the one required by an user when calling `addPlugin` on its [workflow](glossary.md#workflow).

Make sure the following entry is present in the `package.json`:

```json
{
  "main": "index.js"
}
```

Then create the `index.js` file at the root of the project with:

```js
// index.js
module.exports = function tplProcessorPlugin(starflow) {
  return {
    factories: {
      ngService: require('./lib/ngService')(starflow)
    }
  };
};
```

As you can see, the executable [factories](glossary.md#factory) are stored in the `./lib` directory of the project.

#### The ngService template

```
// templates/ngService.hbs
angular
  .module('{{moduleName}}')
  .service('{{name}}Service', [{{#each dependencies}}'{{this}}', {{/each}}function ({{#each dependencies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}) {
    function {{capitalizedName}}Service() {

    }

    return {{capitalizedName}}Service;
  }]);
```

#### The ngService executable

```js
// lib/ngService.js
module.exports = function (starflow) {
  var fs = require('fs');
  var path = require('path');
  var Handlebars = require('handlebars');

  function NgService() {
    starflow.BaseExecutable.call(this, 'tplProcessor.ngService');
  }
  NgService.prototype = Object.create(starflow.BaseExecutable.prototype);
  NgService.prototype.constructor = NgService;

  NgService.prototype.exec = function exec(moduleName, name, dependencies, location) {
    var source = fs.readFileSync(path.resolve(__dirname, '../templates/ngService.hbs'), 'utf8');
    var template = Handlebars.compile(source);
    var context = {
      moduleName: moduleName,
      name: name,
      capitalizedName: name.charAt(0).toUpperCase() + name.slice(1),
      dependencies: dependencies
    };
    var target = template(context);
    fs.writeFileSync(path.join(location, name + 'Service.js'), target);
  };

  return function () {
    return new NgService();
  };
};
```

Finally, you can use this plugin like this:

```js
// createUserService.js
var starflow = require('starlfow');

var steps = [
  {'tplProcessor.ngService': [
    'my.module',
    'user',
    ['$q', '$window'],
    'path/for/createdFile'
  ]}
];

var workflow = new starflow.Workflow(steps);
return workflow
  .addPlugin(require('starflow-tpl-processor'))
  .run();
```

## Making a plugin configurable

What if the executables of your plugin need to use a web service? You'll probably have to provide some credentials and base URL.
Starflow uses the [rc](https://github.com/dominictarr/rc) package to hold some config values and credentials.

For instance, the starflow-github plugin has a [GithubService](https://github.com/Boulangerie/starflow-github/blob/master/lib/githubService.js) that uses `starflow.config.get('github.TOKEN')` to access the API.
These config values are stored somewhere on the user's machine, for example in its environmental variables or in a `.starflowrc` file at the root of its project.

We recommend storing sensible information as env variables whereas the rest (e.g. `shell.SPAWN_DEPTH_LIMIT`) can be stored in a `.starflowrc` file.

### Example (improving the plugin from above)

Let's pretend the templates are stored somewhere in the _cloud_ (e.g. _The Templates Store_ that exposes an API) and not in the plugin "templates" directory anymore.
We'll need some credentials to authenticate the user in order to get the template.

First, let's create a `.starflowrc` file at the root of our project:

```
{
  "tplProcessor": {
    "URL": "https://templates-store.com"
  }
}
```

Then export the following env variables (e.g. from your `~/.bash_profile`):

```
export starflow_tplProcessor__USERNAME=bob
export starflow_tplProcessor__PASSWORD=abc123
```

> **Note**: it's important to start the env variable names with `starflow_` or else they will be ignored. Please check the [rc](https://github.com/dominictarr/rc) project for more details.

Now, we're going to create a _templatesStoreService_ that will communicate with the API from _The Templates Store_. Furthermore, we'll have to change some parts of our ngService executable to use _templatesStoreService_.

#### The templatesStore service

```js
// templatesStoreService.js (e.g. located in the lib directory of the plugin)

module.exports = function (starflow) {
  // npm i --save request bluebird
  var request = require('request');
  var Promise = require('bluebird');
  
  var url = starflow.config.get('tplProcessor.URL');
  if (!url) {
    throw new Error('TemplatesStore url is required');
  }
  
  var username = starflow.config.get('tplProcessor.USERNAME');
  var password = starflow.config.get('tplProcessor.PASSWORD');
  
  var token = new Buffer(username + ':' + password);
  var templatesStoreService = {
    baseUrl: url,
    headers: {
      'Authorization': 'Basic ' + token.toString('base64')
    },
    getTemplate: function getTemplate(name) {
      return new Promise(function (resolve, reject) {
        request({url: this.baseUrl + '/templates/' + name, headers: this.headers}, function (error, response, body) {
          if (!error && response.statusCode === 200) {
            resolve(body);
          } else {
            // do something to prepare the error message
            reject('There was an error');
          }
        });
      }.bind(this));
    }
  };
  
  return templatesStoreService;
};
```

#### The ngService executable

Let's adapt the executable so it gets the template from the web service and not the local "templates" directory anymore.

```js
// lib/ngService.js
module.exports = function (starflow) {
  // get the templates store service we created
  var templatesStoreService = require('./templatesStoreService')(starflow);
  var fs = require('fs');
  var path = require('path');
  var Handlebars = require('handlebars');

  function NgService() {
    starflow.BaseExecutable.call(this, 'tplProcessor.ngService');
  }
  NgService.prototype = Object.create(starflow.BaseExecutable.prototype);
  NgService.prototype.constructor = NgService;

  NgService.prototype.exec = function exec(moduleName, name, dependencies, location) {
    // get the template from a web service instead of a local file
    return templatesStoreService
      .getTemplate(name)
      .then(function (response) {
        var template = Handlebars.compile(response);
        var context = {
          moduleName: moduleName,
          name: name,
          capitalizedName: name.charAt(0).toUpperCase() + name.slice(1),
          dependencies: dependencies
        };
        var target = template(context);
        fs.writeFileSync(path.join(location, name + 'Service.js'), target);
      });
  };

  return function () {
    return new NgService();
  };
};
```

And that's it!

## Documentation

If you want people to use your plugin, you have to provide a clear and understandable documentation about it.

If someone wants to use your plugin, these are basically the 2 pieces of information he will need:

- Does your plugin require configuration (such as credentials)?
- What are the executables (most important: **their name** and the **args** they need) that are provided and what do they do?

By providing answers to these questions, users won't have to check your source code to know what your plugin actually does.
You can check the [starflow-shell](https://github.com/boulangerie/starflow-shell) README to get ideas on how to write yours. 
