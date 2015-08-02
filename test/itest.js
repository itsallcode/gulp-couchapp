/* jshint node: true */
'use strict';
var gulp = require('gulp');
var should = require('should');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');

var couchapp = require('../index');


function getFile(filePath) {
  return new gutil.File({
    path: filePath,
    cwd: __dirname,
    base: path.dirname(filePath),
    contents: fs.readFileSync(filePath)
  });
}

function getExpected(filePath) {
  return getFile(path.join('test', 'expected', filePath));
}

function compareJsonContent(expectedFile, actualFile) {
  var expected = JSON.parse(String(expectedFile.contents))
  var actual = JSON.parse(String(actualFile.contents))
  assert.deepEqual(actual, expected);
}

function verifyGeneratedDocument(srcGlob, opts, fileCallback) {
  gulp.task('testCouchAppTask', function (cb) {
    gulp.src([srcGlob])
      .pipe(couchapp.buildDoc(opts))
      .pipe(through.obj(function (file, enc, cb) {
        cb();
        fileCallback(file);
      }));
  });
  gulp.tasks.testCouchAppTask.fn();
}

describe('couchapp.buildDoc()', function () {
  it('should build couchapp document from app', function (done) {
    verifyGeneratedDocument('./test/fixtures/test-couchapp/**',
      undefined,
      function (file) {
        compareJsonContent(getExpected(
          'test-couchapp-raw.json'), file);
        assert.equal(file.contents.length, 60021);
        assert.equal(file.path, "couchappdoc.json");
        done();
      });
  });
  it('should build couchapp document from app (prettify)', function (done) {
    verifyGeneratedDocument('./test/fixtures/test-couchapp/**', {
        prettify: true
      },
      function (file) {
        compareJsonContent(getExpected(
          'test-couchapp-raw.json'), file);
        assert.equal(file.contents.length, 60623);
        assert.equal(file.path, "couchappdoc.json");
        done();
      });
  });
});
