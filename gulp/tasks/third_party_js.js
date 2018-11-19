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
  return gulp.src(config.javascript.concat.third_party)
      .pipe(concat('third_party.js'))
      .pipe(gulp.dest('.resources/js/concat'));
};
