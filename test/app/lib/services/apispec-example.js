'use strict';

var Devebot = require('devebot');
var Promise = Devebot.require('bluebird');
var lodash = Devebot.require('lodash');
var debugx = Devebot.require('debug')('appApispec:example');

var Service = function(params) {
  debugx.enabled && debugx(' + constructor begin ...');

  params = params || {};

  var self = this;
  var logger = params.loggingFactory.getLogger();
  var pluginCfg = params.sandboxConfig;
  var contextPath = pluginCfg.contextPath || '/example';

  debugx.enabled && debugx(' - constructor end!');
};

Service.argumentSchema = {
  "id": "apispecExample",
  "type": "object",
  "properties": {
    "apispecService": {
      "type": "object"
    }
  }
};

module.exports = Service;
