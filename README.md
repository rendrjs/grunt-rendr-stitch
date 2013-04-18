# grunt-rendr-stitch

> Use Stitch to package up your modules for use with Rendr (github.com/airbnb/rendr).

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-rendr-stitch --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-rendr-stitch');
```

## The "rendr_stitch" task

### Overview
In your project's Gruntfile, add a section named `rendr_stitch` to the data object passed into `grunt.initConfig()`.

In this example, you can see how to use `options.dependencies` and `options.aliases`.

```js
grunt.initConfig({
  rendr_stitch: {
    options: {
      dependencies: [
    	'assets/vendor/**/*.js'
      ],
      aliases: [
      	{from: 'node_modules/rendr/shared', to: 'rendr/shared'},
      	{from: 'node_modules/rendr/client', to: 'rendr/client'}
      ]
    },
    files: {
      dest: 'public/bundle.js',
      src: [
      	'app/**/*.js',
      	'node_modules/rendr/shared/**/*.coffee',
      	'node_modules/rendr/client/**/*.coffee'
      ]
    }
  }
});
```

We can then use Stitch in the browser to require any of the source files.

```js
var UserShowView = require('app/views/user_show_view');
```

Aliases allow us to use the the same paths for requiring NPM modules in both Node.js and in the browser. For example:

```js
var BaseView = require('rendr/shared/base/view');
```

In Node.js, this path will tell the module loader to look into the NPM module named `rendr` to find the specified module. In the browser, we can do the same thing because we've bundled `node_modules/rendr/shared/**/*.coffee` and set up an alias to `rendr/shared`.

### Options

#### options.dependencies
Type: `Array`
Default value: `[]`

An array of file glob patterns to pass as dependencies to `stitch.createPackage()`. These files are prepended to the bundled JavaScript package as-is, without being wrapped as a Stitch module. This is useful for third-party client-side only files, such as jQuery, that aren't wrapped in a CommonJS module.

#### options.aliases
Type: `Array`
Default value: `[]`

Aliases provide a way to do fancy bundling of Stitch packages in order to replicate something like NPM module paths from Node. Each element in the array is an object with `from` and `to` properties. For example:

```js
dependencies: [
  {from: 'some/path/on/disk', to: 'fancy/path/in/client'}
]
```

Suppose the `some/path/on/disk` directory looks like this:

    |- util.js
    |- lib/something.js

Then, in the client-side you can require the module using the aliased path:

```js
var something = require('fancy/path/in/client/lib/something');
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

### 0.0.3
Clean `tmp` dir on every run, to prevent picking up old files.

### 0.0.1
Initial release.
