const gulp = require('gulp');
const htmlValidator = require('gulp-w3c-html-validator');
const plumber = require('gulp-plumber');
const scss = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const argv = require('yargs').argv;
const gulpif = require('gulp-if');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const eslint = require('gulp-eslint');
const del = require('del');
const server = require('browser-sync').create();


function html() {
  return gulp.src('dev/*.html')
    .pipe(plumber())
    .pipe(plumber.stop())
    .pipe(gulpif(argv.prod, htmlValidator()))
    .pipe(gulp.dest('dist'))
};


function styles() {
  return gulp.src('dev/styles/styles.scss')
    .pipe(plumber())
    .pipe(gulpif(!argv.prod, sourcemaps.init()))
    .pipe(scss())
    .pipe(autoprefixer({
      overrideBrowserslist:  [ "last 4 version" ],
      cascade: false
    }))
    .pipe(gulpif(argv.prod, cleanCSS({
      debug: true,
      compatibility: '*'
    }, details => {
      console.log(`${details.name}: Original size:${details.stats.originalSize} - Minified size: ${details.stats.minifiedSize}`)
    })))
    .pipe(gulpif(!argv.prod, sourcemaps.write()))
    .pipe(gulp.dest('dist/css'))
};

function script() {
  return gulp.src('dev/js/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(gulpif(argv.prod, uglify()))
    .pipe(gulp.dest('dist/js/'));
};

function serve(cb) {
  server.init({
    server: 'dist',
    notify: false,
    open: true,
    cors: true
  });
	gulp.watch('dev/*.html', gulp.series(html)).on('change', server.reload);
  gulp.watch('dev/styles/**/*.scss', gulp.series(styles)).on('change', server.reload);
  gulp.watch('dev/js/**/*.js', gulp.series(script)).on('change', server.reload);

  return cb()
};

function clean(cb) {
  return del('dist').then(() => {
    cb()
  })
};

const dev = gulp.parallel(html, styles, script);
exports.default = gulp.series(
  clean,
  dev,
  serve
);
