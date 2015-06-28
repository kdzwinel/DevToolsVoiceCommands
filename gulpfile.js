var gulp = require('gulp');
var traceur = require('gulp-traceur-cmdline');
var watch = require('gulp-watch');

gulp.task('default', function () {
  return gulp.src('scripts/*.js')
    .pipe(watch('scripts/**/*.js'))
    .pipe(traceur({
      'source-maps': 'inline',
      modules: 'inline'
    }))
    .pipe(gulp.dest('dist'));
});