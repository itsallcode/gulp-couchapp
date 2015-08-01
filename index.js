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
    filePath = path.normalize(filePath).replace(/\\/g, '/');
    gutil.log("Processing file", filePath);
    if(filePath.indexOf('_attachments/') > -1) {
      addAttachment(filePath, content);
      return;
    }
    if(filePath.indexOf('views/') > -1) {
      addView(filePath, content);
      return;
    }
    if(/vendor\/.*\/metadata\.json/.test(filePath)) {
      addVendorMetadata(filePath, content);
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
        var couchapp_json = JSON.parse(content);
        appDoc.couchapp.name = couchapp_json.name;
        appDoc.couchapp.description = couchapp_json.description;
        return;
      default:
        gutil.log("WARN: unhandled path", filePath);
    }
  }

  function addVendorMetadata(filePath, content) {
    var vendorName = filePath.replace(/vendor\//, '').replace(/\/metadata\.json/, '');
    appDoc.vendor[vendorName] = {
      metadata: JSON.parse(content)
    };
  }

  function addView(filePath, content) {
    filePath = filePath.replace(/views\//, '');
    var dirs = path.dirname(filePath).split(path.sep);
    var name = path.basename(filePath, path.extname(filePath));
    var insertionPoint = appDoc.views;
    for (var dirname of dirs) {
      insertionPoint[dirname] = {};
      insertionPoint = insertionPoint[dirname];
    }
    insertionPoint[name] = content;
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
    buildManifests();
    return appDoc;
  }

  function buildManifests() {
    appDoc.couchapp.manifest = ["couchapp.json",
          "language",
          "lists/",
          "README.md",
          "shows/",
          "updates/"];
    appDoc.couchapp.manifest = appDoc.couchapp.manifest.concat(getVendorManifest());
    appDoc.couchapp.manifest = appDoc.couchapp.manifest.concat(getViewsManifest());
  }

  function getVendorManifest() {
    var list = ["vendor/"];
    for (var vendorName of Object.keys(appDoc.vendor)) {
      list.push("vendor/" + vendorName + "/");
      list.push("vendor/" + vendorName + "/metadata.json");
    }
    return list;
  }

  function getViewsManifest() {
      var list = ["views/"];
      for (var dirName of Object.keys(appDoc.views)) {
        list.push("views/" + dirName + "/");
        for (var file of Object.keys(appDoc.views[dirName])) {
          list.push("views/" + dirName + "/" + file + ".js");
        }
      }
      return list;
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
    if(file.isNull()) {
      cb();
      return;
    }

    if(file.isStream()) {
      throw new PluginError(PLUGIN_NAME, "Streams not supported");
    }

    if(enc !== "utf8") {
      var message = "Unsupported encoding " + enc + " for file " + file.relative;
      gutil.log("ERROR:", message);
      throw new PluginError(PLUGIN_NAME, message);
    }

    var contents = file.contents.toString();
    addFile(file.relative, contents);
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
