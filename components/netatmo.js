/*
 * from https://github.com/karbassi/netatmo
 * adapted for MMM-Netatmo-Thermostat (only)
 * bugsounet 2024
 */
 
/* eslint-disable no-param-reassign */

var util = require("util");
var EventEmitter = require("events").EventEmitter;
var request = require("request");

const BASE_URL = "https://api.netatmo.net";

var client_id;
var client_secret;
var access_token;
var refresh_token;

/**
 * @constructor
 * @param args
 */
var netatmo = function (args) {
  EventEmitter.call(this);
  this.authenticate(args);
};

util.inherits(netatmo, EventEmitter);

/**
 * handleRequestError
 * @param err
 * @param response
 * @param body
 * @param message
 * @param critical
 * @returns {Error}
 */
netatmo.prototype.handleRequestError = function (err, response, body, message, critical) {
  var errorMessage = "";
  if (body && response.headers["content-type"].trim().toLowerCase().indexOf("application/json") !== -1) {
    errorMessage = JSON.parse(body);
    errorMessage = errorMessage && (errorMessage.error.message || errorMessage.error);
  } else if (typeof response !== "undefined") {
    errorMessage = `Status code ${response.statusCode}`;
  } else {
    errorMessage = "No response";
  }
  var error = new Error(`${message}: ${errorMessage}`);
  if (critical) {
    this.emit("error", error);
  } else {
    this.emit("warning", error);
  }
  return error;
};

/**
 * https://dev.netatmo.com/apidocumentation/oauth#using-a-token
 * @param args
 * @param callback
 * @returns {netatmo}
 */
netatmo.prototype.authenticate = function (args, callback) {
  if (!args) {
    this.emit("error", new Error("Authenticate 'args' not set."));
    return this;
  }

  if (!args.client_id) {
    this.emit("error", new Error("Authenticate 'client_id' not set."));
    return this;
  }

  if (!args.client_secret) {
    this.emit("error", new Error("Authenticate 'client_secret' not set."));
    return this;
  }

  if (!args.refresh_token) {
    this.emit("error", new Error("Authenticate 'refresh_token' not set."));
    return this;
  }


  client_id = args.client_id;
  client_secret = args.client_secret;
  refresh_token = args.refresh_token;

  var form = {
    grant_type: "refresh_token",
    refresh_token: refresh_token,
    client_id: client_id,
    client_secret: client_secret
  };

  var url = util.format("%s/oauth2/token", BASE_URL);

  request({
    url: url,
    method: "POST",
    form: form
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "Authenticate error", true);
    }

    body = JSON.parse(body);

    access_token = body.access_token;

    if (body.expires_in) {
      setTimeout(this.authenticate_refresh.bind(this), body.expires_in * 1000, body.refresh_token);
    }

    this.emit("authenticated", body.expires_in);

    if (callback) {
      return callback();
    }

    return this;
  }.bind(this));

  return this;
};

/**
 * https://dev.netatmo.com/apidocumentation/oauth#refreshing-a-token
 * @param refresh_token
 * @returns {netatmo}
 */
netatmo.prototype.authenticate_refresh = function (refresh_token) {

  var form = {
    grant_type: "refresh_token",
    refresh_token: refresh_token,
    client_id: client_id,
    client_secret: client_secret
  };

  var url = util.format("%s/oauth2/token", BASE_URL);

  request({
    url: url,
    method: "POST",
    form: form
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "Authenticate refresh error");
    }

    body = JSON.parse(body);

    access_token = body.access_token;

    if (body.expires_in) {
      setTimeout(this.authenticate_refresh.bind(this), body.expires_in * 1000, body.refresh_token);
    }
    
    this.emit("refreshed", body.expires_in);

    return this;
  }.bind(this));

  return this;
};

/**
 * https://dev.netatmo.com/apidocumentation/energy#homesdata
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.getHomesData = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on("authenticated", function () {
      this.getHomesData(options, callback);
    });
  }

  var url = util.format("%s/api/homesdata", BASE_URL);

  var form = {
    access_token: access_token
  };

  if (options) {
    if (options.home_id) form.home_id = options.home_id;
    if (options.gateway_types) form.gateway_types = options.gateway_types;
  }

  request({
    url: url,
    method: "POST",
    form: form
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "getHomesData error");
    }

    body = JSON.parse(body);

    this.emit("get-homesdata", err, body.body);

    if (callback) {
      return callback(err, body.body);
    }

    return this;

  }.bind(this));

  return this;
};

/**
 * https://dev.netatmo.com/apidocumentation/energy#homestatus
 * @param options
 * @param callback
 * @returns {*}
 */
netatmo.prototype.homeStatus = function (options, callback) {
  // Wait until authenticated.
  if (!access_token) {
    return this.on("authenticated", function () {
      this.homeStatus(options, callback);
    });
  }

  if (!options) {
    this.emit("error", new Error("homeStatus 'options' not set."));
    return this;
  }

  if (!options.home_id) {
    this.emit("error", new Error("homeStatus 'home_id' not set."));
    return this;
  }

  var url = util.format("%s/api/homestatus", BASE_URL);

  var form = {
    access_token: access_token,
    home_id: options.home_id
  };

  if (options) {
    if (options.device_types) {
      form.device_types = options.device_types;
    }
  }
 
  request({
    url: url,
    method: "POST",
    form: form
  }, function (err, response, body) {
    if (err || response.statusCode !== 200) {
      return this.handleRequestError(err, response, body, "homeStatus error");
    }

    body = JSON.parse(body);

    this.emit("get-homestatus", err, body.body);

    if (callback) {
      return callback(err, body.body);
    }

    return this;

  }.bind(this));

  return this;
};

module.exports = netatmo;
