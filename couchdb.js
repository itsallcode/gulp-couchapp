/* jslint node: true */
/* jslint esnext: true */
'use strict';
var gutil = require('gulp-util');
var assert = require('assert');
var nanoConnect = require('nano');
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-couchapp';

module.exports = function (opts) {
  if (!opts || !opts.url) {
    throw new PluginError(PLUGIN_NAME,
      "CouchDb options with key 'url' missing");
  }
  var db = nanoConnect(opts);

  function ensureDbExists(callback) {
    var nanoNoDb = nanoConnect(db.config.url);
    var dbName = db.config.db;
    nanoNoDb.db.get(dbName, function (err, body) {
      if (err && err.reason === "no_db_file") {
        gutil.log("DB", dbName, "does not exist: create it");
        nanoNoDb.db.create(dbName, function (err, body) {
          assert.ifError(err);
          gutil.log("DB", dbName, "created successfully");
          callback();
        });
        return;
      }
      assert.ifError(err);
      callback();
    });
  }

  function insert(doc, callback) {
    db.insert(doc, function (err, body) {
      if (err) {
        console.log(err);
        throw new PluginError(PLUGIN_NAME, "Error inserting document: " +
          err.toString());
      }
      gutil.log("Document", body.id, "inserted successfully with rev",
        body.rev);
      callback();
    });
  }

  function insertOrUpdate(docName, doc, callback) {
    db.head(docName, function (err, _, head) {
      if (err && err.statusCode === 404) {
        gutil.log("Document", docName, "does not exist: create it");
        insert(doc, callback);
        return;
      }
      assert.ifError(err);
      var rev = head.etag;
      gutil.log("Document", docName, "already exists with rev ", rev);
      doc._rev = rev.replace(/"/g, "");
      insert(doc, callback);
    });
  }

  function uploadApp(docName, doc, callback) {

    var dbName = db.config.db;
    gutil.log("Uploading to ", db.config.url, "/ db", dbName);
    ensureDbExists(function () {
      insertOrUpdate(docName, doc, function () {
        callback();
      });
    });
  }

  return {
    uploadApp: uploadApp
  };
};
