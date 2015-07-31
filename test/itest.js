/* jshint node: true */
///* global describe, it */
'use strict';
var gulp = require('gulp');
var should = require('should');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');
var deep = require('deep-diff');

var couchapp = require('../index');


function getFile(filePath) {
    console.log(__dirname);
    return new gutil.File({
        path:     filePath,
        cwd:      __dirname,
        base:     path.dirname(filePath),
        contents: fs.readFileSync(filePath)
    });
}

function getExpected(filePath) {
    return getFile(path.join('test', 'expected', filePath));
}

function compareJsonContent(expectedFile, actualFile) {
  var expectedString = String(expectedFile.contents)
  var actualString = String(actualFile.contents)
  //var differences = deep.diff(JSON.parse(actualString), JSON.parse(expectedString));
  //console.log("Differences: ", JSON.stringify(differences, null, "  "));
  assert.deepEqual(JSON.parse(actualString), JSON.parse(expectedString));
}

describe('couchapp()', function() {
    it('should build couchapp document from app', function(done) {
      gulp.task('testCouchAppTask', function(cb) {
        gulp.src(['./test/fixtures/test-couchapp/**'])
          .pipe(couchapp())
          .pipe(through.obj(function(file, enc, cb) {
            compareJsonContent(getExpected('test-couchapp-raw.json'), file);
            done();
            cb();
          }));
      });
      gulp.tasks.testCouchAppTask.fn();
    });
});
