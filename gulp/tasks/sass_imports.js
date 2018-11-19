/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

const config      = require('../config.json');
const importify   = require('gulp-importify');
const gulp        = require('gulp');

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

module.exports = function() {
  return gulp.src(config.sass.concat, {base: '.resources/sass'})
    .pipe(importify('.resources/sass/build.scss', {
      cssPreproc: 'scss'
    }))
    .pipe(gulp.dest('.'));
};
