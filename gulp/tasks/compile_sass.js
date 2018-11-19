/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

const config      = require('../config.json');
const sass        = require('gulp-sass');
const gulpif      = require('gulp-if');
const argv        = require('yargs').argv;
const rename      = require('gulp-rename');
const cssmin      = require('gulp-cssmin');
const sourcemaps  = require('gulp-sourcemaps');
const gulp        = require('gulp');

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

module.exports = function() {
  return gulp.src('.resources/sass/*.scss')
  .pipe(gulpif(argv.sourcemaps, sourcemaps.init()))
  .pipe(sass().on('error', sass.logError))
  .pipe(rename('custom.min.css'))
  .pipe(gulpif(argv.production, cssmin({ keepSpecialComments: false })))
  .pipe(gulpif(argv.sourcemaps, sourcemaps.write()))
  .pipe(gulp.dest('../assets/css/'));
};
