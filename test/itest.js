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

describe('couchapp()', function () {
  it('should build couchapp document from app', function (done) {
    gulp.task('testCouchAppTask', function (cb) {
      gulp.src(['./test/fixtures/test-couchapp/**'])
        .pipe(couchapp())
        .pipe(through.obj(function (file, enc, cb) {
          compareJsonContent(getExpected(
            'test-couchapp-raw.json'), file);
          done();
          cb();
        }));
    });
    gulp.tasks.testCouchAppTask.fn();
  });
});
