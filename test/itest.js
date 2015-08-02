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
  return JSON.parse(getFile(path.join('test', 'expected', filePath)).contents);
}

function verifyGeneratedDocument(srcGlob, fileCallback) {
  gulp.task('testCouchAppTask', function (cb) {
    gulp.src([srcGlob])
      .pipe(couchapp.buildDoc())
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
      function (doc) {
        assert.deepEqual(doc, getExpected('test-couchapp-raw.json'));
        done();
      });
  });
});
