/* jslint node: true */
/* jslint esnext: true */
'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var couchappBuilder = require('./couchapp-builder.js');
var couchdbConnect = require('./couchdb.js');
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-couchapp';

module.exports.buildDoc = function () {
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
    /* jshint validthis:true */
    this.push(builder.build());
    callback();
  }

  return through.obj(transform, flush);
};

module.exports.push = function (opts) {
  return through.obj(function (doc, enc, cb) {

    var couchdb = couchdbConnect(opts);
    couchdb.uploadApp(doc._id, doc, function () {
      cb();
    });
  });
};
