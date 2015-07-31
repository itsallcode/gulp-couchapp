/* jshint node: true */
///* global describe, it */
'use strict';
var gulp = require('gulp');
var should = require('should');
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var through = require('through2');

var couchapp = require('../index');

describe('couchapp()', function() {
    it('should build couchapp document from app', function(done) {
      gulp.task('testCouchAppTask', function(cb) {
        gulp.src(['./test/fixtures/test-couchapp/**'])
          .pipe(couchapp())
          .pipe(through.obj(function(file, enc, cb) {
            console.log("file: ", file);
            done();
            cb();
          }));
      });
      gulp.tasks.testCouchAppTask.fn();
    });
});
