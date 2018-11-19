/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

const gulp     = require('gulp');
const sequence = require('run-sequence').use(gulp);

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

module.exports = function() {
  return sequence('sass_imports', ['copy_fonts', 'build_js', 'compile_sass']);
};
