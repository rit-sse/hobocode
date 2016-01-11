var gulp = require('gulp');
var mocha = require('gulp-spawn-mocha');

gulp.task('test:server', function() {
  gulp.src('test/**/*-test.js')
    .pipe(mocha());
});
