'use strict';

var app = require('devebot').launchApplication({
  appRootPath: __dirname
}, [
  'app-webserver',
  'app-webweaver',
  '../../index.js'
]);

if (require.main === module) app.server.start();

module.exports = app;
