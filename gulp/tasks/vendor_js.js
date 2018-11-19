/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

 const config      = require('../config.json');
 const concat      = require('gulp-concat');
 const gulp        = require('gulp');

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

module.exports = function() {
  return gulp.src(config.javascript.concat.vendor)
      .pipe(concat('vendor.js'))
      .pipe(gulp.dest('.resources/js/concat'));
};
