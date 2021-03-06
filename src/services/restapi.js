'use strict';

function Service(params = {}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const pluginCfg = params.sandboxConfig;
  const contextPath = pluginCfg.contextPath || '/apispec';

  const { swaggerTools, swaggerUiExpress, webweaverService } = params;
  const express = webweaverService.express;

  let childRack = null;
  if (pluginCfg.autowired !== false) {
    childRack = childRack || {
      name: 'app-apispec-branches',
      middleware: express()
    };
    const layers = [
      webweaverService.getDefaultRedirectLayer()
    ];
    if (pluginCfg.uiType === 'swagger-ui-express') {
      layers.push(swaggerUiExpress.getSwaggerUiExpress());
    } else {
      layers.push(
        swaggerTools.getOverrideStaticDirLayer(),
        swaggerTools.getSwaggerUiLayer(),
        webweaverService.getSessionLayer([
          swaggerTools.getApidocsLayer(),
          childRack
        ], contextPath)
      )
    }
    webweaverService.push(layers, pluginCfg.priority);
  }
};

Service.referenceHash = {
  swaggerTools: 'swaggerTools',
  swaggerUiExpress: 'swaggerUiExpress',
  webweaverService: 'app-webweaver/webweaverService'
};

module.exports = Service;
