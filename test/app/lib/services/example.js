'use strict';

var path = require('path');

var Service = function(params) {
  params = params || {};
  var pluginCfg = params.sandboxConfig;
  var swaggerBuilder = params.swaggerBuilder;

  swaggerBuilder.setApiDocs(require(path.join(__dirname, '../../data/swagger.json')));
};

module.exports = Service;

Service.referenceHash = {
  swaggerBuilder: 'swaggerBuilder'
};
