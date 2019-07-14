'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const path = require('path');
const swaggerTools = require('swagger-tools');
const syncblock = require('syncblock');

function RestspecService(params = {}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  let pluginCfg = params.sandboxConfig;
  let contextPath = pluginCfg.contextPath || '/apispec';

  let { webweaverService } = params;
  let express = webweaverService.express;

  let swaggerApiSpec = require(pluginCfg.specificationFile || '../../data/swagger/apispec.json');
  this.getApiSpecDocument = function() {
    return swaggerApiSpec;
  };

  let swaggerMiddleware = null;
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

  this.getSwaggerUiLayer = function(branches) {
    return {
      name: 'app-apispec-swaggerui',
      path: contextPath + '/apispec/docs',
      middleware: express.static(path.join(__dirname, '../../data/swagger-ui/public')),
      branches: branches
    }
  }

  this.getApidocsLayer = function(branches) {
    return {
      name: 'app-apispec-apidocs',
      path: contextPath + '/apispec',
      middleware: this.buildRestRouter(express),
      branches: branches
    }
  }

  this.getOverrideStaticDirLayer = function(branches) {
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
      this.getOverrideStaticDirLayer(),
      this.getSwaggerUiLayer(),
      webweaverService.getSessionLayer([
        this.getApidocsLayer(),
        childRack
      ], contextPath)
    ], pluginCfg.priority);
  }
};

RestspecService.referenceHash = {
  webweaverService: 'app-webweaver/webweaverService'
};

module.exports = RestspecService;
