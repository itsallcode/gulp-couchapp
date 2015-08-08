/* jshint node: true */
'use strict';
var should = require('should');
var assert = require('assert');

var couchdbConnect = require('../couchdb.js');
var nanoConnect = require('nano');

var conne

describe('couchdb.uploadApp()', function () {
  var doc;
  var docName;
  var dbName;
  var dbUrl;
  var nano;

  beforeEach(function setup() {
    docName = 'docName';
    doc = {
      _id: docName,
      int: 42,
      string: 'value',
      bool: true
    };
    dbName = 'test-db-name'
    dbUrl = 'http://localhost:5984/' + dbName;
    nano = nanoConnect(dbUrl);
  });

  afterEach(function cleanup(done) {
    console.log('Destroying database', dbName, '...');
    nanoConnect('http://localhost:5984').db.destroy(dbName, function (
      err, body) {
      assert.ifError(err);
      console.log('Database', dbName, 'destroyed:', body);
      done();
    });
  });

  function uploadApp(callback) {
    var couchdb = couchdbConnect({
      url: dbUrl
    });
    couchdb.uploadApp(docName, doc, function () {
      callback();
    });
  }

  function createEmptyDb(callback) {
    console.log('Creating database', dbName, '...');
    nanoConnect('http://localhost:5984').db.create(dbName, function (
      err, body) {
      assert.ifError(err);
      console.log('Database', dbName, 'created:', body);
      callback();
    });
  }

  function assertDoc(actualDoc, expectedRevision) {
    assert(actualDoc._rev);
    var revisionRegex = new RegExp(expectedRevision + '-.*');
    assert(revisionRegex.test(actualDoc._rev));
    doc._rev = actualDoc._rev;
    assert.deepEqual(actualDoc, doc);
  }

  function getAndAssrtDoc(expectedRevision, done) {
    nano.get(docName, function (err, body) {
      assert.ifError(err);
      assertDoc(body, expectedRevision)
      done();
    });
  }

  it('should create db if it does not exist yet', function (done) {
    uploadApp(function () {
      getAndAssrtDoc(1, done);
    });
  });

  it('should use existing db if it already exists', function (done) {
    createEmptyDb(function () {
      uploadApp(function () {
        getAndAssrtDoc(1, done);
      });
    });
  });

  it('should update existing document with new revision', function (done) {
    uploadApp(function () {
      getAndAssrtDoc(1, function () {});
      uploadApp(function () {
        getAndAssrtDoc(2, done);
      })
    });
  });
});
