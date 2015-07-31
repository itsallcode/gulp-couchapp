/* jslint node: true */
/* jslint esnext: true */
'use strict';
var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var base64 = require('hi-base64');
var md5 = require('md5');
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-couchapp';

module.exports = function() {
  var app = {
    attachments: []
  };
  var appDoc = {
    vendor: {},
    language: undefined,
    views: {},
    lists: {},
    _attachments : {},
    updates: {},
    README: undefined,
    _id: undefined,
    shows: {},
    couchapp: {
      manifest: [],
      signatures: {},
      name: undefined,
      objects: {},
      description: undefined
    }
  };

  function addFile(filePath, content) {
    filePath = filePath.replace(/\\/g, '/');
    gutil.log("Processing file", filePath);
    if(filePath.indexOf('_attachments/') > -1) {
      addAttachment(filePath, content);
      return;
    }
    switch (filePath) {
      case "language":
        appDoc.language = content.trim();
        return;
      case "_id":
        appDoc._id = content.trim();
        return;
      case "README.md":
        appDoc.README = content.trim();
        return;
      case "couchapp.json":
        gutil.log("Found couchapp.json: ", content);
        var couchapp_json = JSON.parse(content);
        appDoc.couchapp.name = couchapp_json.name;
        appDoc.couchapp.description = couchapp_json.description;
        return;
      default:

    }
  }

  function addAttachment(filePath, content) {
    var name = filePath.replace(/_attachments\//, '');
    app.attachments.push({
      name: name,
      content: content,
      base64content: base64.encode(content),
      md5: md5(content),
      contentType: getContentType(filePath)
    });
  }

  function getContentType(filePath) {
    var ext = path.extname(filePath);
    switch(ext) {
      case ".html":
        return "text/html";
      case ".js":
        return "application/javascript";
      case ".css":
        return "text/css";
      default:
        throw new PluginError(PLUGIN_NAME, "Unknown extension '" + ext + "' for path '" + filePath + "'");
    }
  }

  function buildCouchAppDocument() {
    gutil.log("Building CouchApp document...");
    buildAttachments();
    gutil.log("Result: ", appDoc);
    return appDoc;
  }

  function buildAttachments() {
    for (var attachment of app.attachments) {
      gutil.log("Adding attachment ", attachment.name);
      appDoc._attachments[attachment.name] = {
        data: attachment.base64content,
        content_type: attachment.contentType
      };
      appDoc.couchapp.signatures[attachment.name] = attachment.md5;
    }
  }

  function transform(file, enc, cb) {
    if (file.isNull()) {
      return cb(null);
    }

    if (file.isStream()) {
      throw new PluginError(PLUGIN_NAME, 'Streams not supported');
    }

    addFile(file.relative, file.contents.toString());
    cb();
  }

  function flush(callback) {
    var file = new gutil.File({
      base: path.join(__dirname, './'),
      cwd: __dirname,
      path: path.join(__dirname, './test.txt'),
      contents: new Buffer(JSON.stringify(buildCouchAppDocument(), null, "  "))
    });
    /* jshint validthis:true */
    this.push(file);
    callback();
  }

  return through.obj(transform, flush);
};
