
// ES6 support
require('babel-core/register');

var express = require('express');
var path = require('path');

express()
  //.get('/', require('./render'))
  .use(express.static(path.resolve(__dirname, '..')))
  .listen(3000);
