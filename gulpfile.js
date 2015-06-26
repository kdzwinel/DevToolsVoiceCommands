var gulp = require('gulp');
var traceur = require('gulp-traceur-cmdline');
var watch = require('gulp-watch');

gulp.task('default', function () {
  return gulp.src(['scripts/background.js', 'scripts/options.js'])
    .pipe(watch('scripts/**/*.js'))
    .pipe(traceur({
      'source-maps': 'inline',
      modules: 'inline'
    }))
    .pipe(gulp.dest('dist'));
});