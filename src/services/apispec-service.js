'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const chores = Devebot.require('chores');
const lodash = Devebot.require('lodash');

const path = require('path');
const swaggerTools = require('swagger-tools');
const syncblock = require('syncblock');

function RestspecService(params) {
  params = params || {};
  let self = this;

  let LX = params.loggingFactory.getLogger();
  let LT = params.loggingFactory.getTracer();
  let packageName = params.packageName || 'app-apispec';
  let blockRef = chores.getBlockRef(__filename, packageName);

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [ blockRef, 'constructor-begin' ],
    text: ' + constructor begin ...'
  }));

  let pluginCfg = params.sandboxConfig;
  let contextPath = pluginCfg.contextPath || '/apispec';

  let webweaverService = params['app-webweaver/webweaverService'];
  let express = webweaverService.express;

  let swaggerApiSpec = require(pluginCfg.specificationFile || '../../data/swagger/apispec.json');
  self.getApiSpecDocument = function() {
    return swaggerApiSpec;
  };

  let swaggerMiddleware = null;
  self.getSwaggerMiddleware = function() {
    return (swaggerMiddleware = swaggerMiddleware || new express());
  }

  self.initializeSwagger = function() {
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

        LX.has('silly') && LX.log('silly', LT.toMessage({
          text: ' - Interpret Swagger resources and attach metadata to request (#1)'
        }));
        mw.use(middleware.swaggerMetadata());

        LX.has('silly') && LX.log('silly', LT.toMessage({
          text: ' - Validate Swagger requests (#2)'
        }));
        mw.use(middleware.swaggerValidator());

        LX.has('silly') && LX.log('silly', LT.toMessage({
          text: ' - Route validated requests to appropriate controller (#3)'
        }));
        mw.use(middleware.swaggerRouter(swaggerOpts));

        LX.has('silly') && LX.log('silly', LT.toMessage({
          text: ' - Serve the Swagger documents and Swagger UI (#4)'
        }));
        mw.use(middleware.swaggerUi());

        onResolved();
      });
    });
  }

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

    app.use(self.getSwaggerMiddleware());

    pluginCfg.lazying === false && syncblock.begin(function(ticket) {
      self.initializeSwagger().finally(ticket.end);
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
    let layer = {
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

  let childRack = null;
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

  LX.has('silly') && LX.log('silly', LT.toMessage({
    tags: [ blockRef, 'constructor-end' ],
    text: ' - constructor end!'
  }));
};

RestspecService.referenceList = [ 'app-webweaver/webweaverService' ];

module.exports = RestspecService;
