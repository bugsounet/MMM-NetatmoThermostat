/*
 * Node Helper: MMM-Netatmo-Thermostat
 *
 * By bugsounet ©2024
 * MIT Licensed.
 */

var NodeHelper = require("node_helper")
var netatmo = require('./netatmo')

logNT = (...args) => { /* do nothing ! */ }

module.exports = NodeHelper.create({
  start () {
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
    this.api = null
  },

  socketNotificationReceived (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[NETATMO] MMM-Netatmo-Thermostat Version:", require('./package.json').version)
        this.initialize(payload)
      break
    }
  },

  initialize (config) {
    this.config = config
    if (this.config.debug) logNT = (...args) => { console.log("[NETATMO]", ...args) }
    if (!this.config.home_id) return console.error("[NETATMO] home_id not set!")
    console.log("[NETATMO] Starting MMM-Netatmo-Thermostat module...")
    logNT(this.config)
    this.api = new netatmo(this.config.api)
    this.api
      .on('get-thermostatsdata', (err, devices) => this.getThermostatsData(err, devices))
      .on('get-homestatus', (err, data) => this.getHomeStatus(err, data))
      .on("error", error => {
        console.error('[NETATMO] threw an error: ' + error)
      })
      .on("warning", error => {
        console.log('[NETATMO] threw a warning: ' + error)
      })
      .on("authenticated", () => {
        console.log("[NETATMO] Authenticated!")
        this.Authenticated = true
      })

    this.api.homeStatus({ "home_id": this.config.home_id })

    setInterval(()=> {
      if (this.Authenticated) { // auth only ?
        logNT("Updating...")
        this.api.homeStatus({ "home_id": this.config.home_id })
      }
    }, this.config.updateInterval)
  },

  getThermostatsData (err, devices) {
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
  },

  getHomeStatus (err, data) {
    logNT("HomeStatus:", data.home)
    if (data.home.rooms.length && data.home.rooms.length-1 >= this.config.room_id) {
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
    this.api.getThermostatsData()
  },

  averageTemp (temp) {
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
