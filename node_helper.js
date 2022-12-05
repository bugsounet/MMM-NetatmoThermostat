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
      tendency: null,
      tempSet: null,
      heating: false,
      bridge: null,
      id: null,
      mode: null,
      signal: null,
      firmware: null
    }
    this.tempHistory = {
      data: [],
      average: null,
      lastAverage: null
    }
    this.Authenticated = false
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
      if (data.home.rooms) {
        this.thermostat.temp = data.home.rooms[this.config.room_id].therm_measured_temperature
        this.thermostat.tempSet = data.home.rooms[this.config.room_id].therm_setpoint_temperature
        this.thermostat.mode = data.home.rooms[this.config.room_id].therm_setpoint_mode
        this.thermostat.tendency = this.averageTemp(this.thermostat.temp)
        data.home.modules.forEach(module => {
          if (module.type == "NATherm1") {
            this.thermostat.bridge = module.bridge
            this.thermostat.id = module.id
            this.thermostat.heating = module.boiler_status
            this.thermostat.firmware = module.firmware_revision
            this.thermostat.signal = module.rf_strength
          }
        })
      } else console.error("[NETATMO] no rooms found!", data.home)
      api.getThermostatsData()
    }

    var getHomeData = (err, data) => { console.log("HomeData:", data)}

    api.on('get-thermostatsdata', getThermostatsData)
    api.on('get-homestatus', getHomeStatus)
    
    api.on("error", error => {
      console.error('[NETATMO] threw an error: ' + error)
    })
    api.on("warning", error => {
      console.log('[NETATMO] threw a warning: ' + error)
    })
    api.on("authenticated", () => {
      console.log("[NETATMO] Authenticated!")
      this.Authenticated = true
    })

    api.homeStatus({ "home_id": this.config.home_id })

    setInterval(()=> {
      if (this.Authenticated) { // auth only ?
        logNT("Updating...")
        api.homeStatus({ "home_id": this.config.home_id })
      }
    }, this.config.updateInterval*1000)
  },

  averageTemp: function(temp) {
    if (!temp) return
    let average = 0
    /** do Array of last 10 Temp **/
    if (this.tempHistory.data.length >= 10) this.tempHistory.data.splice(0,1)
    this.tempHistory.data.push(temp)

    /** do the average **/
    this.tempHistory.data.forEach(value => {
      average += value
    })
    average = (average/this.tempHistory.data.length).toFixed(2)
    this.tempHistory.lastAverage = this.tempHistory.average ? this.tempHistory.average: average
    this.tempHistory.average= average
    logNT("tempHistory:", this.tempHistory)
    if (this.tempHistory.average > this.tempHistory.lastAverage) return 1
    if (this.tempHistory.average < this.tempHistory.lastAverage) return 2
    return 0
  }
});
