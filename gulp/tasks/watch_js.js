/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

const config      = require('../config.json');
const gulp        = require('gulp');
const sequence    = require('run-sequence').use(gulp);

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

module.exports = function() {
  sequence(['build_js']);
};
