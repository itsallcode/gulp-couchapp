/* jslint node: true */
/* jslint esnext: true */
'use strict';
var gutil = require('gulp-util');
var path = require('path');
var base64 = require('hi-base64');
var md5 = require('md5');
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-couchapp';

module.exports = function () {
  var app = {
    vendor: {},
    language: undefined,
    views: {},
    lists: {},
    _attachments: {},
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
    if (filePath.indexOf('_attachments/') > -1) {
      addAttachment(filePath, content);
      return;
    }
    if (filePath.indexOf('views/') > -1) {
      addView(filePath, content);
      return;
    }
    if (/vendor\/.*\/metadata\.json/.test(filePath)) {
      addVendorMetadata(filePath, content);
      return;
    }
    switch (filePath) {
    case "language":
      app.language = content.trim();
      return;
    case "_id":
      app._id = content.trim();
      return;
    case "README.md":
      app.README = content.trim();
      return;
    case "couchapp.json":
      var couchapp_json = JSON.parse(content);
      app.couchapp.name = couchapp_json.name;
      app.couchapp.description = couchapp_json.description;
      return;
    default:
      gutil.log("WARN: unhandled path", filePath);
    }
  }

  function addVendorMetadata(filePath, content) {
    var vendorName = filePath.replace(/vendor\//, '').replace(
      /\/metadata\.json/, '');
    app.vendor[vendorName] = {
      metadata: JSON.parse(content)
    };
  }

  function addView(filePath, content) {
    filePath = filePath.replace(/views\//, '');
    var dirs = path.dirname(filePath).split(path.sep);
    var name = path.basename(filePath, path.extname(filePath));
    var insertionPoint = app.views;
    for (var dirname of dirs) {
      insertionPoint[dirname] = {};
      insertionPoint = insertionPoint[dirname];
    }
    insertionPoint[name] = content;
  }

  function addAttachment(filePath, content) {
    var name = filePath.replace(/_attachments\//, '');
    app._attachments[name] = {
      data: base64.encode(content),
      content_type: getContentType(filePath)
    };
    app.couchapp.signatures[name] = md5(content);
  }

  function getContentType(filePath) {
    var ext = path.extname(filePath);
    switch (ext) {
    case ".html":
      return "text/html";
    case ".js":
      return "application/javascript";
    case ".css":
      return "text/css";
    default:
      throw new PluginError(PLUGIN_NAME, "Unknown extension '" + ext +
        "' for path '" + filePath + "'");
    }
  }

  function build() {
    gutil.log("Building CouchApp document...");
    buildManifests();
    return app;
  }

  function buildManifests() {
    app.couchapp.manifest = ["couchapp.json",
      "language",
      "lists/",
      "README.md",
      "shows/",
      "updates/"
    ];
    app.couchapp.manifest = app.couchapp.manifest.concat(getVendorManifest());
    app.couchapp.manifest = app.couchapp.manifest.concat(getViewsManifest());
  }

  function getVendorManifest() {
    var list = ["vendor/"];
    for (var vendorName of Object.keys(app.vendor)) {
      list.push("vendor/" + vendorName + "/");
      list.push("vendor/" + vendorName + "/metadata.json");
    }
    return list;
  }

  function getViewsManifest() {
    var list = ["views/"];
    for (var dirName of Object.keys(app.views)) {
      list.push("views/" + dirName + "/");
      for (var file of Object.keys(app.views[dirName])) {
        list.push("views/" + dirName + "/" + file + ".js");
      }
    }
    return list;
  }

  return {
    addFile: addFile,
    build: build
  };
};
