require('./app/gulpfile'); // load app's tasks

var del = require('del');
var gulp = require('gulp'); //Gulp 4.0+
var gls = require('gulp-live-server');

gulp.task('lint', gulp.parallel('lint:app'));
gulp.task('build', gulp.parallel('build:app'));
gulp.task('test', gulp.parallel('test:app'));

gulp.task('verify', gulp.series('build', 'lint', 'test'));

gulp.task('clean', function(cb) {
  del(['coverage','dist', 'server/**/*.js$', 'test/app/test.js']).then(function(){ cb(); });
});

gulp.task('watch', function() {
  var server = gls.new('server/app.js', 3000);
  server.start();
  gulp.watch(['server/**/*.ts', 'app/**/*.ts'], gulp.series('verify'));
  gulp.watch(['server/**/*.js'], gulp.series(function() {
    server.start();
  }));
  gulp.watch(['app/**/*.js'], gulp.series(function() {
    server.notify();
  }));
});

gulp.task('serve', function() {
  var server = gls.new('server/app.js');
  server.start();
});

gulp.task('default', gulp.series('verify', 'watch'));
