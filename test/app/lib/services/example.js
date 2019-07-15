'use strict';

var path = require('path');

var Service = function(params) {
  params = params || {};
  var pluginCfg = params.sandboxConfig;
  var swaggerBuilder = params.swaggerBuilder;

  swaggerBuilder.setApiLayout(require(path.join(__dirname, '../../data/swagger.json')));
  swaggerBuilder.addApiEntries(require(path.join(__dirname, '../../data/api1.json')));
  swaggerBuilder.addApiEntries(require(path.join(__dirname, '../../data/api2.json')));
};

module.exports = Service;

Service.referenceHash = {
  swaggerBuilder: 'swaggerBuilder'
};
