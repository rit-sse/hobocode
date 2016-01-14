var mocha = require('gulp-spawn-mocha');
var path = require('path');

module.exports = function(gulp) {
  gulp.task('test:server', function() {
    return gulp.src(path.join(__dirname, 'test', '*.js'))
      .pipe(mocha());
  });
};
