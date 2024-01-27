# gulp-couchapp
Gulp plugin for uploading a couchapp to couchdb

# ⚠️ This project is deprecated and not maintained any more ⚠️

## Usage

As long as gulp-couchapp is not published, clone and link it:

```shell
git clone https://github.com/hamstercommunity/gulp-couchapp.git
cd my-project
npm link ../gulp-couchapp/
```

Then, add it to your `gulpfile.js`:

```javascript
var couchapp = require('gulp-couchapp');

gulp.task('default', function(cb) {
  gulp.src(['./**'])
    .pipe(couchapp())
    .pipe(gulp.dest('build'));
});
```
