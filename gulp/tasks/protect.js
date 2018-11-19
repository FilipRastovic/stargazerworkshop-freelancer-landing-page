/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

 const gulp = require('gulp');

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

module.exports = function() {
  return gulp.src(['./index.html',])
      .pipe(gulp.dest('../assets'))
      .pipe(gulp.dest('../assets/img'))
      .pipe(gulp.dest('../assets/css'))
      .pipe(gulp.dest('../assets/js'))
      .pipe(gulp.dest('../assets/fonts'));
};
