'use strict';

var events = require('events');
var util = require('util');
var path = require('path');

var Devebot = require('devebot');
var lodash = Devebot.require('lodash');
var debug = Devebot.require('debug');
var debuglog = debug('appApispec:trailer');

var Service = function(params) {
  debuglog.isEnabled && debuglog(' + constructor begin ...');

  params = params || {};

  var self = this;

  self.logger = params.loggingFactory.getLogger();

  self.getSandboxName = function() {
    return params.sandboxName;
  };

  var webserverTrigger = params.webserverTrigger;
  var express = webserverTrigger.getExpress();
  var position = webserverTrigger.getPosition();

  var pluginCfg = lodash.get(params, ['sandboxConfig', 'plugins', 'appApispec'], {});

  var contextPath = pluginCfg.contextPath || '/apispec';

  if (pluginCfg.overrideStaticDir) {
    webserverTrigger.inject(express.static(pluginCfg.overrideStaticDir),
        contextPath + '/apispec/docs', position.inRangeOfStaticFiles(), 'app-apispec-customize');
  }

  webserverTrigger.inject(express.static(path.join(__dirname, '../../data/swagger-ui/public')),
      contextPath + '/apispec/docs', position.inRangeOfStaticFiles(), 'app-apispec-extension');

  webserverTrigger.inject(params.apispecService.buildRestRouter(express),
      contextPath + '/apispec', position.inRangeOfMiddlewares(), 'app-apispec-service');

  self.getServiceInfo = function() {
    return {};
  };

  self.getServiceHelp = function() {
    return {};
  };

  debuglog.isEnabled && debuglog(' - constructor end!');
};

Service.argumentSchema = {
  "id": "apispecTrailer",
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
    },
    "apispecService": {
      "type": "object"
    },
    "webserverTrigger": {
      "type": "object"
    }
  }
};

module.exports = Service;
