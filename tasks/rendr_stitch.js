/*
 * grunt-rendr-stitch
 *
 *
 * Copyright (c) 2013 Spike Brehm
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path'),
    stitch = require('stitch'),
    async = require('async');

// Require CoffeeScript for ability to package CS files.
require('coffee-script');

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('rendr_stitch', 'Create a Stitch bundle for use with Rendr.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      dependencies: [],
      npmDependencies: {},
      aliases: []
    });

    var done = this.async(),
        tmpDir = __dirname + '/../tmp/bundle',
        dependencies = grunt.file.expand(options.dependencies),
        aliases = options.aliases,
        aliasMap,
        aliasRe;

    // Get aliases in the form of
    // { from: to, from: to }
    aliasMap = grunt.util._.inject(aliases, function(memo, value, index) {
      memo[value.from] = value.to;
      return memo;
    }, {});

    // Used to see if a filepath matches any alias.
    aliasRe = new RegExp('^(' + grunt.util._.pluck(aliases, 'from').join('|') + ')');

    // Iterate over all specified file groups.
    async.series(
      this.files.map(function(f) {
        // transform each file group into a callback for async.series
        return function(cb) {
          var pathMaps = f.src.filter(function(filepath) {
            // Warn on and remove invalid source files (if nonull was set).
            if (!grunt.file.exists(filepath)) {
              grunt.log.warn('Source file "' + filepath + '" not found.');
              return false;
            } else {
              return true;
            }
          }).map(function(filepath) {
            var matches = aliases.length && filepath.match(aliasRe),
            dest;
            if (matches) {
              // If the file is in an aliased directory, then copy it to the
              // tmp directory with the alias as a prefix.
              dest = filepath.replace(matches[0], aliasMap[matches[0]]);
            } else {
              // Otherwise, just copy to the tmp directory.
              dest =  filepath;
            }
            return [filepath, dest];
          });

          // Copy over any NPM dependencies, so they can be `require`d in a sexy way.
          pathMaps = pathMaps.concat(grunt.util._.map(options.npmDependencies, function(src, module) {
            var filepath = path.normalize('node_modules/' + module + '/' + src);
            return [filepath, module + '.js'];
          }));

          // Clean the tmp dir, to prevent picking up old files.
          if (grunt.file.exists(tmpDir)) {
            grunt.file.delete(tmpDir);
          }

          // Copy everything to the tmp directory, which will be the
          // base path for the Stitch bundle.
          pathMaps.forEach(function(pathMap) {
            grunt.file.copy(pathMap[0], tmpDir + '/' + pathMap[1]);
          });

          assertFiles(pathMaps.length, tmpDir, function() {
            // Create the Stitch package.
            stitch.createPackage({
              paths: [tmpDir],
              dependencies: dependencies
            }).compile(function(err, source) {
              if (err) { return done(err); }
              grunt.file.write(f.dest, source);
              grunt.log.writeln('File "' + f.dest + '" created.');
              // move on to next file group
              cb(null, f.dest);
            });
          });
        };
      }),
      // async.series completion callback to signal grunt task complete
      function() {
        done();
      });
  });

  /**
   * Sometimes, the Stitch compliation appears to happen before all files are copied over to
   * the `tmpDir`.  We simply wait until they are.
   */
  function assertFiles(expectedNumFiles, tmpDir, callback) {
    function countFiles() {
      var numFiles = 0;
      grunt.file.recurse(tmpDir, function(abspath, rootdir, subdir, filename) {
        numFiles++;
      });
      return numFiles === expectedNumFiles;
    }

    var interval = setInterval(function() {
      if (countFiles()) {
        clearInterval(interval);
        callback();
      }
    }, 100);
  }

};
