var path = require('path');
var del = require('del');
var webpack = require('gulp-webpack');
var ts = require('gulp-typescript');
var typescript = require('typescript');
var sourcemaps = require('gulp-sourcemaps');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var istanbul = require('gulp-istanbul');
var istanbulReport = require('gulp-istanbul-report');
var gulpFilter = require('gulp-filter');
var lint = require('gulp-tslint');
var gutil = require('gulp-util');
var tslint = require('tslint');

// joins paths to represent a file relative to the current directory
var _localFile = function(file) {
  return path.join(__dirname, file);
}
module.exports = function(gulp) {
  gulp.task('build:robot-api', gulp.series(function() {
    var project = ts.createProject(_localFile('robot-api/tsconfig.json'), {typescript: typescript});

    return project.src()
      .pipe(sourcemaps.init())
      .pipe(ts(project))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(_localFile('tmp'))); // Write every JS file to tmp/
  }, function() {
    return gulp.src(_localFile('tmp/**/*.js'))
      .pipe(sourcemaps.init())
      .pipe(webpack({
        entry: _localFile('tmp/robot-api/main.js'),
        output: {
          filename: 'robot-api.js'
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
    del(_localFile('robot-api-tmp')).then(function() { cb(); });
  }
  ));

  gulp.task('build:app', gulp.series('build:robot-api', function() {
    var project = ts.createProject(_localFile('tsconfig.json'), {typescript: typescript});

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
      del(_localFile('tmp')).then(function() { cb(); });
    }, function() {
      return gulp.src(_localFile('*.html'))
        .pipe(gulp.dest(_localFile('dist')));
    }
  ));

  gulp.task('lint:app', function() {
    var project = ts.createProject(_localFile('tsconfig.json'), {typescript: typescript});

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

  gulp.task('test:app:build', function() {
    var project = ts.createProject('app/test/tsconfig.json', {typescript: typescript});
    return project.src()
      .pipe(sourcemaps.init())
      .pipe(ts(project))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(_localFile('test')));
  });

  gulp.task('test:app:instrument', function() {
    return gulp.src(_localFile('test') +'/*.js')
      .pipe(istanbul({coverageVariable: '__coverage__'}))
      .pipe(gulp.dest(_localFile('test')+'/instrumented')) //instrumented file must differ from original
  });

  gulp.task('test:app:run', function() {
    return gulp.src('app/test/runner.html')
    .pipe(mochaPhantomJS({
      reporter: 'spec',
      phantomjs: {
        hooks: 'mocha-phantomjs-istanbul',
        coverageFile: _localFile('test') + '/coverage/coverage.json'
      }
    }));
  });

  gulp.task('test:app:coverage-report', function() {
    return gulp.src(_localFile('test') + '/coverage/coverage.json')
      .pipe(istanbulReport({
        reporters: ['text-summary', 'html']
      }));
  });


  gulp.task('test:app', gulp.series('test:app:build', 'test:app:instrument',
    'test:app:run', 'test:app:coverage-report'));
};
