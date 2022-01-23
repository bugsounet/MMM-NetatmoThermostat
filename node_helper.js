/* Magic Mirror
 * Node Helper: MMM-Netatmo-Thermostat
 *
 * By bugsounet ©2022
 * MIT Licensed.
 */

var NodeHelper = require("node_helper")
var netatmo = require('netatmo')

logNT = (...args) => { /* do nothing ! */ }

module.exports = NodeHelper.create({
  start: function () {
    this.thermostat= {
      name: null,
      battery: null,
      temp: null,
      lastTemp: null,
      tempSet: null,
      heating: false,
      bridge: null,
      id: null,
      mode: null,
      signal: null,
      firmware: null
    }
  },

  socketNotificationReceived: function (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[NETATMO] MMM-Netatmo-Thermostat Version:", require('./package.json').version)
        this.initialize(payload)
      break
    }
  },

  initialize: function (config) {
    this.config = config
    if (this.config.debug) logNT = (...args) => { console.log("[NETATMO]", ...args) }
    if (!this.config.home_id) return console.error("[NETATMO] home_id not set!")
    console.log("[NETATMO] Starting Netatmo module...")
    logNT(this.config)
    var auth = {
      client_id: this.config.client_id,
      client_secret: this.config.client_secret,
      username: this.config.username,
      password: this.config.password
    }
    var api = new netatmo(auth)

    var getThermostatsData = (err, devices) => {
      logNT("ThermostatsData:", devices)
      devices.forEach(device => {
        if (device._id == this.thermostat.bridge) { // select Relay
          device.modules.forEach(moduleData => {
            if (moduleData._id == this.thermostat.id) { // select Thermostat
              this.thermostat.battery = moduleData.battery_percent
              this.thermostat.name = moduleData.module_name
            }
          })
        }
      })
      logNT("Final Result:", this.thermostat)
      this.sendSocketNotification("DATA", this.thermostat)
    }

    var getHomeStatus = (err, data) => {
      logNT("HomeStatus:", data.home)
      if (this.thermostat.temp) this.thermostat.lastTemp = this.thermostat.temp
      else this.thermostat.lastTemp = data.home.rooms[this.config.room_id].therm_measured_temperature
      this.thermostat.temp = data.home.rooms[this.config.room_id].therm_measured_temperature
      this.thermostat.tempSet = data.home.rooms[this.config.room_id].therm_setpoint_temperature
      this.thermostat.mode = data.home.rooms[this.config.room_id].therm_setpoint_mode
      data.home.modules.forEach(module => {
        if (module.type == "NATherm1") {
          this.thermostat.bridge = module.bridge
          this.thermostat.id = module.id
          this.thermostat.heating = module.boiler_status
          this.thermostat.firmware = module.firmware_revision
          this.thermostat.signal = module.rf_strength
        }
      })
      api.getThermostatsData()
    }

    api.on('get-thermostatsdata', getThermostatsData)
    api.on('get-homestatus', getHomeStatus)

    api.on("error", function(error) {
      console.error('[NETATMO] threw an error: ' + error);
    })
    api.on("warning", function(error) {
      console.log('[NETATMO] threw a warning: ' + error);
    })
    api.on("authenticated", function (login) { console.log("[NETATMO] Authenticated!")});

    api.homeStatus({ "home_id": this.config.home_id })
    setInterval(()=> {
      api.homeStatus({ "home_id": this.config.home_id })
    }, this.config.updateInterval*1000)
  }
});
