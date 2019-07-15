'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const path = require('path');
const swaggerTools = require('swagger-tools');
const syncblock = require('syncblock');

function Service(params = {}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const pluginCfg = params.sandboxConfig;
  const contextPath = pluginCfg.contextPath || '/apispec';

  const { swaggerBuilder, webweaverService } = params;
  const express = webweaverService.express;

  let swaggerApiSpec = require(pluginCfg.specificationFile || '../../data/swagger/apispec.json');
  let swaggerMiddleware = null;

  this.getApiSpecDocument = function() {
    return swaggerApiSpec;
  };

  this.getSwaggerMiddleware = function() {
    return (swaggerMiddleware = swaggerMiddleware || new express());
  }

  this.initializeSwagger = function() {
    const self = this;
    // swaggerRouter configuration
    let swaggerOpts = {
      useStubs: pluginCfg.mockMode || (process.env.NODE_ENV === 'development')
    };
    if (pluginCfg.controllersDir) {
      swaggerOpts['controllers'] = pluginCfg.controllersDir;
    }
    // Initialize the Swagger middleware
    return new Promise(function(onResolved, onRejected) {
      let swaggerApiSpec = self.getApiSpecDocument();
      swaggerTools.initializeMiddleware(swaggerApiSpec, function (middleware) {
        let mw = self.getSwaggerMiddleware();

        L.has('silly') && L.log('silly', T.toMessage({
          text: ' - Interpret Swagger resources and attach metadata to request (#1)'
        }));
        mw.use(middleware.swaggerMetadata());

        L.has('silly') && L.log('silly', T.toMessage({
          text: ' - Validate Swagger requests (#2)'
        }));
        mw.use(middleware.swaggerValidator());

        L.has('silly') && L.log('silly', T.toMessage({
          text: ' - Route validated requests to appropriate controller (#3)'
        }));
        mw.use(middleware.swaggerRouter(swaggerOpts));

        L.has('silly') && L.log('silly', T.toMessage({
          text: ' - Serve the Swagger documents and Swagger UI (#4)'
        }));
        mw.use(middleware.swaggerUi());

        onResolved();
      });
    });
  }

  this.buildRestRouter = function(express, app) {
    const self = this;
    app = app || new express();

    app.set('views', path.join(__dirname, '/../../data/swagger-ui'));
    app.set('view engine', 'ejs');

    app.get(['/docs', '/docs/index.html'], function(req, res, next) {
      res.setHeader('Swagger-API-Docs-URL', path.join(contextPath, '/apispec/api-docs'));
      res.render('index', {
        apiUi: {
          title: pluginCfg.ui.title || 'swagger',
          isButtonExploreEnabled: pluginCfg.ui.isButtonExploreEnabled,
          url: path.join(contextPath, '/apispec/docs')
        },
        apiTokenName: pluginCfg.apiTokenName || 'api_token',
        authenticationUrl: pluginCfg.authenticationUrl || '/tokenify/auth',
        prefixBaseUrl: pluginCfg.prefixBaseUrl,
        loginForm: pluginCfg.loginForm
      });
    });

    app.use(self.getSwaggerMiddleware());

    pluginCfg.lazying === false && syncblock.begin(function(ticket) {
      self.initializeSwagger().finally(ticket.end);
    });

    return app;
  }

  this.getSwaggerUiLayer = function(branches) {
    return {
      name: 'app-apispec-swaggerui',
      path: path.join(contextPath, '/apispec/docs'),
      middleware: express.static(path.join(__dirname, '../../data/swagger-ui/public')),
      branches: branches
    }
  }

  this.getApidocsLayer = function(branches) {
    return {
      name: 'app-apispec-apidocs',
      path: path.join(contextPath, '/apispec'),
      middleware: this.buildRestRouter(express),
      branches: branches
    }
  }

  this.getOverrideStaticDirLayer = function(branches) {
    let layer = {
      name: 'app-apispec-customize',
      path: path.join(contextPath, '/apispec/docs'),
      branches: branches,
      skipped: true
    };
    if (pluginCfg.overrideStaticDir) {
      layer.skipped = false;
      layer.middleware = express.static(pluginCfg.overrideStaticDir);
    }
    return layer;
  }
};

Service.referenceHash = {
  swaggerBuilder: 'swaggerBuilder',
  webweaverService: 'app-webweaver/webweaverService'
};

module.exports = Service;
