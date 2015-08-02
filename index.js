/* jslint node: true */
/* jslint esnext: true */
'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var couchappBuilder = require('./couchapp-builder.js');
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-couchapp';

module.exports.buildDoc = function (opts) {
  opts = opts || {};
  var builder = couchappBuilder();

  function transform(file, enc, cb) {
    if (file.isNull()) {
      cb();
      return;
    }

    if (file.isStream()) {
      throw new PluginError(PLUGIN_NAME, "Streams not supported");
    }

    if (enc !== "utf8") {
      var message = "Unsupported encoding " + enc + " for file " + file.relative;
      gutil.log("ERROR:", message);
      throw new PluginError(PLUGIN_NAME, message);
    }

    var contents = file.contents.toString();
    builder.addFile(file.relative, contents);
    cb();
  }

  function flush(callback) {
    var indentation = opts.prettify ? "  " : "";
    var jsonContent = JSON.stringify(builder.build(), null, indentation);
    var file = new gutil.File({
      path: 'couchappdoc.json',
      contents: new Buffer(jsonContent)
    });
    /* jshint validthis:true */
    this.push(file);
    callback();
  }

  return through.obj(transform, flush);
};
