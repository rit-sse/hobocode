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

var coverageFile = './coverage/coverage.json';

function makeBuildTarget(name, projectfile) {
  var project = ts.createProject(projectfile, {typescript: typescript});
  gulp.task(name, function () {
    return project.src()
      .pipe(sourcemaps.init())
      .pipe(ts(project))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest());
  });
}

function makeFrontendBuildTarget(name, projectfile) {
    var project = ts.createProject(projectfile, {typescript: typescript});
    gulp.task(name, function() {
        return project.src()
          .pipe(sourcemaps.init())
          .pipe(ts(project))
          .pipe(webpack({
               context: __dirname + "/app",
               entry: "main.js",
               output: {
                   filename: "app.js"
               },
               resolve: {
                   
               }
          }))
          .pipe(gulp.dest());
    });
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
    return gulp.src(testDest+'/test.*.js')
      .pipe(istanbul({coverageVariable: '__coverage__'}))
      .pipe(gulp.dest(testDest+'/instrumented')) //instrumented file must differ from original
  });
  gulp.task(name, gulp.series(name+"-build", name+"-instrument"));
}

makeFrontendBuildTarget('build:app', 'app/tsconfig.json');
makeBuildTarget('build:server', 'server/tsconfig.json');
makeTestBuildTarget('build:test:app', 'test/app/tsconfig.json');

gulp.task('build:test', gulp.parallel('build:test:app', 'build:test:server'));

gulp.task('build', gulp.parallel('build:app', 'build:server', 'build:test'));

gulp.task('test-run', function() {
  return gulp.src('tools/runner.html')
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
  del(['coverage','app/**/*.js', 'server/**/*.js']).then(function(){ cb(); });
});

gulp.task('watch', function() {
    gulp.watch('source/**/*.ts', gulp.series('verify'));
});

gulp.task('default', gulp.series('verify', 'watch'));