/**
 * ------------------------------------------------------------------------
 * Tasks
 *
 * Loads all tasks from the task folder
 * ------------------------------------------------------------------------
 */

// Load gulp
const gulp = require('gulp');

// Set stats with config object
require('gulp-stats')(gulp);

// Load all tasks
require('gulp-load-tasks')();
