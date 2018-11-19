/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

const config       = require('../config.json');
const scsslint     = require('gulp-scss-lint');
const scssReporter = require('gulp-scss-lint-stylish');
const gulp         = require('gulp');

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

var customCSS = [
    /* Custom Sass & CSS */
    'build/baseline/*.scss',
    'build/mixins/**/*.scss',
    'build/pages/**/*.scss',
    'build/css/**/**/*.css',
    'build/sass/modules/**/*.scss'
];

module.exports = function() {
  return gulp.src(customCSS)
      .pipe(scsslint({'config': 'sass_lint.yml', customReport: scssReporter}))
      .pipe(scsslint.failReporter());
};
