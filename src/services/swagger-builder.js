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

  this.setApiLayout = function (apiDocs = {}) {
    this.setHost(apiDocs.host);
    this.setBasePath(apiDocs.basePath);
    this.setSchemes(apiDocs.schemes);
    this.setInfo(apiDocs.info);
    this.setExternalDocs(apiDocs.externalDocs);
  }

  this.addApiEntries = function (fromDocs = {}) {
    // the the tags
    apiDocs.tags = apiDocs.tags || [];
    const currentTags = lodash.filter(apiDocs.tags, function (tag) {
      return tag && lodash.isObject(tag);
    });
    const tagMap = lodash.keyBy(currentTags, function (tag) {
      return lodash.lowerCase(tag.name);
    });
    lodash.forEach(fromDocs.tags, function (tag) {
      if (!(lodash.lowerCase(tag.name) in tagMap)) {
        apiDocs.tags.push(tag);
      }
    });
    // merge the paths
    apiDocs.paths = apiDocs.paths || {};
    lodash.forOwn(fromDocs.paths, function(descriptor, apiUrl) {
      apiDocs.paths[apiUrl] = descriptor;
    });
    // merge the definitions
    apiDocs.definitions = apiDocs.definitions || {};
    lodash.forOwn(fromDocs.definitions, function (descriptor, name) {
      apiDocs.definitions[name] = descriptor;
    });
  }

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

  this.setInfo = function (info) {
    if (lodash.isObject(info) && !lodash.isEmpty(info)) {
      apiDocs.info = apiDocs.info || {};
      lodash.merge(apiDocs.info, info);
    }
  }

  this.setExternalDocs = function (externalDocs) {
    if (externalDocs && lodash.isObject(externalDocs)) {
      apiDocs.externalDocs = apiDocs.externalDocs || {};
      lodash.merge(apiDocs.externalDocs, externalDocs);
    }
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
