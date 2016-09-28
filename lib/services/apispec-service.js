'use strict';

var events = require('events');
var util = require('util');

var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('appApispec:service');

var swaggerTools = require('swagger-tools');

var Service = function(params) {
  debuglog.isEnabled && debuglog(' + constructor begin ...');

  params = params || {};

  var self = this;

  self.logger = params.loggingFactory.getLogger();

  self.getSandboxName = function() {
    return params.sandboxName;
  };

  var pluginCfg = lodash.get(params, ['sandboxConfig', 'plugins', 'appApispec'], {});
  var contextPath = pluginCfg.contextPath || '/apispec';

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
    var done = false;
    swaggerTools.initializeMiddleware(swaggerApiSpec, function (middleware) {
      debuglog.isEnabled && debuglog(' - Interpret Swagger resources and attach metadata to request (#1)');
      app.use(middleware.swaggerMetadata());

      debuglog.isEnabled && debuglog(' - Validate Swagger requests (#2)');
      app.use(middleware.swaggerValidator());

      debuglog.isEnabled && debuglog(' - Route validated requests to appropriate controller (#3)');
      app.use(middleware.swaggerRouter(swaggerOpts));

      debuglog.isEnabled && debuglog(' - Serve the Swagger documents and Swagger UI (#4)');
      app.use(middleware.swaggerUi());

      done = true;
    });

    require('deasync').loopWhile(function(){return !done;});

    return app;
  }

  self.getServiceInfo = function() {
    return {};
  };

  self.getServiceHelp = function() {
    return {};
  };

  debuglog.isEnabled && debuglog(' - constructor end!');
};

Service.argumentSchema = {
  "id": "apispecService",
  "type": "object",
  "properties": {
    "sandboxName": {
      "type": "string"
    },
    "sandboxConfig": {
      "type": "object"
    },
    "profileConfig": {
      "type": "object"
    },
    "generalConfig": {
      "type": "object"
    },
    "loggingFactory": {
      "type": "object"
    }
  }
};

module.exports = Service;
