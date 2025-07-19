if (process.env.NODE_ENV === "localhost") {
  require("dotenv").config();
}
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var brandRouter = require('./src/brand/brand.route');
var vehicleRouter = require('./src/vehicles/vehicles.route');
var chatRouter = require('./routes/chat');

var uploadRouter = require('./src/upload/upload.route');
var adminRouter = require('./src/admin/admin.route');
var locationRouter = require('./src/location/location.route');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/brand', brandRouter);
app.use('/vehicle', vehicleRouter);
app.use('/chat', chatRouter);
app.use('/admin', adminRouter);
app.use('/upload', uploadRouter);
app.use('/location', locationRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(200).json({
      code: 413,
      status: 'error',
      message: 'File too large. Max size is 2MB.',
      result: []
    });
  }
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
