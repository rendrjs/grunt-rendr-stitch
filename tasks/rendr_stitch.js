/*
 * grunt-rendr-stitch
 *
 *
 * Copyright (c) 2013 Spike Brehm
 * Licensed under the MIT license.
 */

'use strict';

var stitch = require('stitch');

// Require CoffeeScript for ability to package CS files.
require('coffee-script');

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('rendr_stitch', 'Your task description goes here.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      dependencies: [],
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
    this.files.forEach(function(f) {

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
            tmpDest;
        if (matches) {
          // If the file is in an aliased directory, then copy it to the
          // tmp directory with the alias as a prefix.
          tmpDest = filepath.replace(matches[0], tmpDir + '/' + aliasMap[matches[0]]);
        } else {
          // Otherwise, just copy to the tmp directory.
          tmpDest = tmpDir + '/' + filepath;
        }
        return [filepath, tmpDest];
      });

      // Clean the tmp dir, to prevent picking up old files.
      if (grunt.file.exists(tmpDir)) {
        grunt.file.delete(tmpDir);
      }

      // Copy everything to the tmp directory, which will be the
      // base path for the Stitch bundle.
      pathMaps.forEach(function(pathMap) {
        grunt.file.copy(pathMap[0], pathMap[1]);
      });

      // Create the Stitch package.
      stitch.createPackage({
        paths: [tmpDir],
        dependencies: dependencies
      }).compile(function(err, source) {
        if (err) { return done(err); }
        grunt.file.write(f.dest, source);
        grunt.log.writeln('File "' + f.dest + '" created.');
        done();
      });
    });
  });

};
