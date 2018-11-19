/**
 * ------------------------------------------------------------------------
 * Task Dependencies
 * ------------------------------------------------------------------------
 */

const config      = require('../config.json');
const gulp        = require('gulp');
const browserSync = require('browser-sync').create();
const ENV         = require('../env.js');

/**
 * ------------------------------------------------------------------------
 * Task Configuration
 * ------------------------------------------------------------------------
 */

module.exports = function() {

  /* Watch JS Files */
  gulp.watch('build/js/modules/**/*.js', ['watch_js']);

  /* Watch Sass & CSS Files */
  gulp.watch(
      // Source Files
      ['build/sass/**/**/*.scss', 'build/css/**/**/*.css'],
      // Tasks
      ['css_watch']
    );

  /* Check if Live Reload is enabled */
  if (ENV.liveReload === true) {
    /* Browsersync Configuration */
    browserSync.init({
        port: ENV.port,
        proxy: ENV.siteUrl,
    });

    /* Browsersync Watch */
    gulp.watch(
      [ENV.templatePath, ENV.assetsPath]
    ).on('change', browserSync.reload);
  }
};
