var mocha = require('gulp-spawn-mocha');
var path = require('path');
var gulpFilter = require('gulp-filter');

module.exports = function(gulp) {
  gulp.task('test:server', function() {
    var filter = gulpFilter((f) => !/test\/support/.test(f.path));
    return gulp.src(path.join(__dirname, 'test', '**', '*.js'))
      .pipe(filter)
      .pipe(mocha({
        env: {
          NODE_ENV: 'test'
        }
      }));
  });
};
