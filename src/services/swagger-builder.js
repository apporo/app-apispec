'use strict';

const Devebot = require('devebot');
const Promise = Devebot.require('bluebird');
const lodash = Devebot.require('lodash');
const path = require('path');

function Service(params = {}) {
  const L = params.loggingFactory.getLogger();
  const T = params.loggingFactory.getTracer();

  const { sandboxConfig } = params;

  const apiDocs = require(sandboxConfig.defaultApiDocs);

  this.setHost = function (host) {
    if (lodash.isString(host) && !lodash.isEmpty(host)) {
      apiDocs.host = host;
    }
  }

  this.setBasePath = function (basePath) {
    if (lodash.isString(basePath) && !lodash.isEmpty(basePath)) {
      apiDocs.basePath = basePath;
    }
  }

  this.setSchemes = function (schemes) {
    if (lodash.isArray(schemes) && !lodash.isEmpty(schemes)) {
      apiDocs.schemes = schemes;
    }
  }

  this.setExternalDocs = function (externalDocs) {
    if (externalDocs && lodash.isObject(externalDocs)) {
      lodash.merge(apiDocs.externalDocs, externalDocs);
    }
  }

  this.addTags = function (tags) {
    if (!lodash.isArray(tags)) {
      throw new Error('tags must be an array');
    }
    
  }

  this.setTags = function () {

  }

  this.addPaths = function () {

  }

  this.setPaths = function () {
    
  }

  this.validate = function () {
    return true;
  }

  this.setApiDocs = function (apidocs) {
    if (lodash.isEmpty(apidocs) || !lodash.isObject(apidocs)) {
      throw new Error('apiDocs must be a JSON object');
    }
    lodash.merge(apiDocs, apidocs);
  }

  this.getApiDocs = function ({ freezed }) {
    if (freezed !== false) {
      return apiDocs;
    }
    return lodash.cloneDeep(apiDocs);
  }
};

module.exports = Service;
