'use strict';

var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var chores = Devebot.require('chores');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('pinbug')('app-apispec:service');

var path = require('path');
var syncblock = require('syncblock');
var swaggerTools = require('swagger-tools');

var Service = function(params) {
  debugx.enabled && debugx(' + constructor begin ...');

  params = params || {};
  var self = this;

  var LX = params.loggingFactory.getLogger();
  var LT = params.loggingFactory.getTracer();
  var packageName = params.packageName || 'app-apispec';
  var blockRef = chores.getBlockRef(__filename, packageName);

  var pluginCfg = params.sandboxConfig;
  var contextPath = pluginCfg.contextPath || '/apispec';

  var webweaverService = params['webweaverService'];
  var express = webweaverService.express;

  var swaggerApiSpec = require(pluginCfg.specificationFile || '../../data/swagger/apispec.json');

  self.getApiSpecDocument = function() {
    return swaggerApiSpec;
  };

  self.buildRestRouter = function(express, app) {
    app = app || new express();

    app.set('views', __dirname + '/../../data/swagger-ui');
    app.set('view engine', 'ejs');

    app.get(['/docs', '/docs/index.html'], function(req, res, next) {
      res.setHeader('Swagger-API-Docs-URL', contextPath + '/apispec/api-docs');
      res.render('index', {
        apiUi: {
          title: pluginCfg.ui.title || 'swagger',
          isButtonExploreEnabled: pluginCfg.ui.isButtonExploreEnabled,
          url: contextPath + '/apispec/docs'
        },
        apiTokenName: pluginCfg.apiTokenName || 'api_token',
        authenticationUrl: pluginCfg.authenticationUrl || '/tokenify/auth',
        prefixBaseUrl: pluginCfg.prefixBaseUrl,
        loginForm: pluginCfg.loginForm
      });
    });

    // swaggerRouter configuration
    var swaggerOpts = {
      useStubs: pluginCfg.mockMode || (process.env.NODE_ENV === 'development')
    };
    if (pluginCfg.controllersDir) {
      swaggerOpts['controllers'] = pluginCfg.controllersDir;
    }

    // Initialize the Swagger middleware
    syncblock.begin(function(ticket) {
      swaggerTools.initializeMiddleware(swaggerApiSpec, function (middleware) {
        debugx.enabled && debugx(' - Interpret Swagger resources and attach metadata to request (#1)');
        app.use(middleware.swaggerMetadata());

        debugx.enabled && debugx(' - Validate Swagger requests (#2)');
        app.use(middleware.swaggerValidator());

        debugx.enabled && debugx(' - Route validated requests to appropriate controller (#3)');
        app.use(middleware.swaggerRouter(swaggerOpts));

        debugx.enabled && debugx(' - Serve the Swagger documents and Swagger UI (#4)');
        app.use(middleware.swaggerUi());

        ticket.end();
      });
    });

    return app;
  }

  self.getSwaggerUiLayer = function(branches) {
    return {
      name: 'app-apispec-swaggerui',
      path: contextPath + '/apispec/docs',
      middleware: express.static(path.join(__dirname, '../../data/swagger-ui/public')),
      branches: branches
    }
  }

  self.getApidocsLayer = function(branches) {
    return {
      name: 'app-apispec-apidocs',
      path: contextPath + '/apispec',
      middleware: self.buildRestRouter(express),
      branches: branches
    }
  }

  self.getOverrideStaticDirLayer = function(branches) {
    var layer = {
      name: 'app-apispec-customize',
      path: contextPath + '/apispec/docs',
      branches: branches,
      skipped: true
    };
    if (pluginCfg.overrideStaticDir) {
      layer.skipped = false;
      layer.middleware = express.static(pluginCfg.overrideStaticDir);
    }
    return layer;
  }

  var childRack = null;
  if (pluginCfg.autowired !== false) {
    childRack = childRack || {
      name: 'app-apispec-branches',
      middleware: express()
    };
    webweaverService.push([
      webweaverService.getDefaultRedirectLayer(),
      self.getOverrideStaticDirLayer(),
      self.getSwaggerUiLayer(),
      webweaverService.getSessionLayer([
        self.getApidocsLayer(),
        childRack
      ], contextPath)
    ], pluginCfg.priority);
  }

  debugx.enabled && debugx(' - constructor end!');
};

Service.referenceList = [ 'webweaverService' ];

module.exports = Service;
