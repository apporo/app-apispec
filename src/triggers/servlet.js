'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const lodash = Devebot.require('lodash');

function RestspecTrigger(params = {}) {
  const pluginCfg = lodash.get(params, ['sandboxConfig'], {});
  const { apispecService } = params;

  this.start = function() {
    if (pluginCfg.lazying !== false) {
      return apispecService.initializeSwagger();
    } else {
      return Promise.resolve();
    }
  };

  this.stop = function() {
    return Promise.resolve();
  };
};

RestspecTrigger.referenceHash = {
  apispecService: 'apispecService'
};

module.exports = RestspecTrigger;
