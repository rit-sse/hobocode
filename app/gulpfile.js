var path = require('path');
var del = require('del');
var gulp = require('gulp'); //Gulp 4.0+
var webpack = require('gulp-webpack');
var ts = require('gulp-typescript');
var typescript = require('typescript');
var sourcemaps = require('gulp-sourcemaps');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var istanbul = require('gulp-istanbul');
var istanbulReport = require('gulp-istanbul-report');
var gls = require('gulp-live-server');
var gulpFilter = require('gulp-filter');
var lint = require('gulp-tslint');
var gutil = require('gulp-util');
var tslint = require('tslint');

// joins paths to represent a file relative to the current directory
var _localFile = function(file) {
  return path.join(__dirname, file);
}

var project = ts.createProject(_localFile('tsconfig.json'), {typescript: typescript});

gulp.task('build:app', gulp.series(function() {
  return project.src()
    .pipe(sourcemaps.init())
    .pipe(ts(project))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(_localFile('tmp'))); // Write every JS file to tmp/
}, function() {
  return gulp.src(_localFile('tmp/**/*.js'))
    .pipe(sourcemaps.init())
    .pipe(webpack({
      entry: _localFile('tmp/main.js'),
      output: {
        filename: 'app.js'
      },
      node: {
        fs: 'empty'
      },
      module: {
        loaders: [
          { test: /\.json/, loader: 'json' },
        ]
      }
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(_localFile('dist'))); // webpack everything to dist/app.js
  }, function(cb) {
    del('tmp').then(function() { cb(); });
  }, function() {
    return gulp.src(_localFile('app/**.html'))
      .pipe(gulp.dest(_localFile('dist')));
  }
));

gulp.task('lint:app', function() {
  var lintConfig = require(_localFile('tslint.json'));
  var lintReporter = function(output, file, options) {
    output.forEach(function(failure) {
      gutil.log(failure.name+"["+failure.startPosition.line+", "+failure.startPosition.character+"] ("+failure.ruleName+"): "+failure.failure);
    });
  };

  var tsFiles = gulpFilter(['**/*.ts', '!**/*.d.ts']);
  return project.src()
    .pipe(tsFiles)
    .pipe(lint({configuration: lintConfig, tslint: tslint}))
    .pipe(lint.report(lintReporter, {emitError: false}));
});
