/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

 const config      = require('../config.json');
 const plumber     = require('gulp-plumber');
 const uglify      = require('gulp-uglify');
 const concat      = require('gulp-concat');
 const gulpif      = require('gulp-if');
 const rename      = require('gulp-rename');
 const sequence    = require('run-sequence');
 const argv        = require('yargs').argv;
 const gulp        = require('gulp');

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

module.exports = function() {
  return sequence(['custom_js', 'vendor_js', 'third_party_js'], function(){
    return gulp.src(config.javascript.dependencies)
      .pipe(plumber())
      .pipe(concat('custom.js'))
      .pipe(gulpif(argv.production, uglify()))
      .pipe(rename('custom.min.js'))
      .pipe(gulp.dest('../assets/js/'));
  });
};
