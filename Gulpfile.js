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

var lintConfig = require('./tslint.json');
var lintReporter = function(output, file, options) {
  output.forEach(function(failure) {
    gutil.log(failure.name+"["+failure.startPosition.line+", "+failure.startPosition.character+"] ("+failure.ruleName+"): "+failure.failure);
  });
};

var coverageFile = './coverage/coverage.json';

function makeFrontendBuildTarget(name, projectfile) {
  var project = ts.createProject(projectfile, {typescript: typescript});
  gulp.task(name, gulp.series(function() {
    return project.src()
      .pipe(sourcemaps.init())
      .pipe(ts(project))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./tmp')); // Write every JS file to tmp/
  }, function() {
    return gulp.src('./tmp/**/*.js')
      .pipe(sourcemaps.init())
      .pipe(webpack({
        entry: './tmp/main.js',
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
      .pipe(gulp.dest('./dist')); // webpack everything to dist/app.js
    }, function(cb) {
      del('tmp').then(function() { cb(); });
    }, function() {
      return gulp.src('./app/index.html')
        .pipe(gulp.dest('./dist'));
    }));
    gulp.task('lint:'+name, function() {
      var tsFiles = gulpFilter(['**/*.ts', '!**/*.d.ts']);
      return project.src()
        .pipe(tsFiles)
        .pipe(lint({configuration: lintConfig, tslint: tslint}))
        .pipe(lint.report(lintReporter, {emitError: false}));
    });
}

var testDest = './test/app';
function makeTestBuildTarget(name, projectfile) {
  var project = ts.createProject(projectfile, {typescript: typescript});
  gulp.task(name+'-build', function() {
    return project.src()
      .pipe(sourcemaps.init())
      .pipe(ts(project))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(testDest));
  });
  gulp.task(name+'-instrument', function() {
    return gulp.src(testDest+'/*.js')
      .pipe(istanbul({coverageVariable: '__coverage__'}))
      .pipe(gulp.dest(testDest+'/instrumented')) //instrumented file must differ from original
  });
  gulp.task(name, gulp.series(name+'-build', name+'-instrument'));
  gulp.task('lint:'+name, function() {
    var tsFiles = gulpFilter(['**/*.ts', '!**/*.d.ts']);
    return project.src()
      .pipe(tsFiles)
      .pipe(lint({configuration: lintConfig, tslint: tslint}))
      .pipe(lint.report(lintReporter, {emitError: false}));
  });
}

makeFrontendBuildTarget('build:app', 'app/tsconfig.json');
makeTestBuildTarget('build:test:app', 'test/app/tsconfig.json');

gulp.task('lint', gulp.parallel('lint:build:app', 'lint:build:test:app'));

gulp.task('build:test', gulp.parallel('build:test:app'));

gulp.task('build', gulp.parallel('build:app', 'build:test'));

gulp.task('test-run', function() {
  return gulp.src('test/app/runner.html')
  .pipe(mochaPhantomJS({
    reporter: 'spec',
    phantomjs: {
      hooks: 'mocha-phantomjs-istanbul',
      coverageFile: coverageFile
    }
  }));
});

gulp.task('test-coverage-report', function() {
  return gulp.src(coverageFile)
    .pipe(istanbulReport({
      reporters: ['text-summary', 'html']
    }));
});

gulp.task('test', gulp.series('test-run', 'test-coverage-report'));

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
