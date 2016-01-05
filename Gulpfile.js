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

var coverageFile = './coverage/coverage.json';

function makeBuildTarget(name, projectfile) {
  var project = ts.createProject(projectfile, {typescript: typescript});
  gulp.task(name, function () {
    return project.src()
      .pipe(sourcemaps.init())
      .pipe(ts(project))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./server'));
  });
}

function makeFrontendBuildTarget(name, projectfile) {
    var project = ts.createProject(projectfile, {typescript: typescript});
    gulp.task(name, gulp.series(function() {
        return project.src()
          .pipe(sourcemaps.init())
          .pipe(ts(project))
          .pipe(sourcemaps.write())
          .pipe(gulp.dest('./app'));
    }, function() {
        return gulp.src("app/**/*.js")
          .pipe(sourcemaps.init())
          .pipe(webpack({
               entry: "./app/main.js",
               output: {
                   filename: "app.js"
               },
               node: {
                 fs: "empty"
               },
               module: {
                loaders: [
                    { test: /\.json/, loader: "json" },
                ]
            }
          }))
          .pipe(sourcemaps.write())
          .pipe(gulp.dest('./app'));
    }));
}

var testDest = './test/app';
function makeTestBuildTarget(name, projectfile) {
  var project = ts.createProject(projectfile, {typescript: typescript});
  gulp.task(name+"-build", function() {
    return project.src()
      .pipe(sourcemaps.init())
      .pipe(ts(project))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(testDest));
  });
  gulp.task(name+"-instrument", function() {
    return gulp.src(testDest+'/*.js')
      .pipe(istanbul({coverageVariable: '__coverage__'}))
      .pipe(gulp.dest(testDest+'/instrumented')) //instrumented file must differ from original
  });
  gulp.task(name, gulp.series(name+"-build", name+"-instrument"));
}

makeFrontendBuildTarget('build:app', 'app/tsconfig.json');
makeBuildTarget('build:server', 'server/tsconfig.json');
makeTestBuildTarget('build:test:app', 'test/app/tsconfig.json');

gulp.task('build:test', gulp.parallel('build:test:app'/*, 'build:test:server'*/));

gulp.task('build', gulp.parallel('build:app', 'build:server', 'build:test'));

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

gulp.task('verify', gulp.series('build', 'test'));

gulp.task('clean', function(cb) {
  del(['coverage','app/**/*.js$', 'server/**/*.js$', 'test/app/test.js']).then(function(){ cb(); });
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
