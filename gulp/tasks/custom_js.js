/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

const config      = require('../config.json');
const plumber     = require('gulp-plumber');
const jshint      = require('gulp-jshint');
const concat      = require('gulp-concat');
const jsReporter  = require('jshint-stylish');
const wrapper     = require('gulp-wrapper')
const gulp        = require('gulp');

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

module.exports = function(){

  return gulp.src('build/js/modules/**/*.js')
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter(jsReporter))
    .pipe(jshint.reporter('fail'))
    .pipe(concat('custom.js'))
    .pipe(wrapper({
      header : 'jQuery(document).ready(function($){',
      footer : '});'
    }))
    .pipe(gulp.dest('.resources/js/concat'));

};
