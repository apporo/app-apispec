'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

function Service(params = {}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const pluginCfg = params.sandboxConfig;
  const contextPath = pluginCfg.contextPath || '/apispec';

  const { swaggerBuilder, webweaverService } = params;
  const express = webweaverService.express;

  this.buildSwaggerUiRouter = function(express, router) {
    router = router || express.Router();
    router.use('/', swaggerUi.serve);
    router.get('/', swaggerUi.setup(swaggerBuilder.getApiDocs({ freezed: true })));
    return router;
  }

  this.getSwaggerUiExpress = function(branches) {
    return {
      name: 'app-apispec-swagger-ui-express',
      path: path.join(contextPath, '/apispec/express'),
      middleware: this.buildSwaggerUiRouter(express),
      branches: branches
    }
  }
};

Service.referenceHash = {
  swaggerBuilder: 'swaggerBuilder',
  webweaverService: 'app-webweaver/webweaverService'
};

module.exports = Service;
