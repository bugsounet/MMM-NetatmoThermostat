/* global Module */

/* Magic Mirror
 * Module: MMM-Netatmo-Thermostat
 *
 * By bugsounet ©2022
 * MIT Licensed.
 */
logNT = (...args) => { /* do nothing */ }

Module.register("MMM-Netatmo-Thermostat", {
  defaults: {
    debug: false,
    client_id: null,
    client_secret: null,
    username: null,
    password: null,
    updateInterval: 60,
    home_id: null,
    room_id: 0,
    display: {
      name: true,
      mode: true,
      battery: true,
      firmware: true,
      signal: true
    }
  },
  requiresVersion: "2.18.0",

  start: function() {
    this.Thermostat = null
  },

  getDom: function() {
    var wrapper = document.createElement("div")
    wrapper.id = "NETATMO"
    var name = document.createElement("div")
    name.id = "NETATMO_NAME"
    wrapper.appendChild(name)

    var temp = document.createElement("div")
    temp.id = "NETATMO_TEMP"
    var tempValue = document.createElement("div")
    tempValue.id = "NETATMO_TEMP_VALUE"
    temp.appendChild(tempValue)
    var tempTendency = document.createElement("div")
    tempTendency.id = "NETATMO_TEMP_TENDENCY"
    temp.appendChild(tempTendency)
    wrapper.appendChild(temp)

    var line1 = document.createElement("div") // display the first line values
    line1.id = "NETATMO_VALUES"

    var tempset = document.createElement("div")
    tempset.id = "NETATMO_TEMPSET"
    wrapper.appendChild(tempset)
    var tempsetIcon = document.createElement("div")
    tempsetIcon.id= "NETATMO_TEMPSET_ICON"
    tempset.appendChild(tempsetIcon)
    var tempsetValue = document.createElement("div")
    tempsetValue.id= "NETATMO_TEMPSET_VALUE"
    tempset.appendChild(tempsetValue)
    line1.appendChild(tempset)

    var battery = document.createElement("div")
    battery.id = "NETATMO_BATTERY"
    var batteryIcon = document.createElement("div")
    batteryIcon.id = "NETATMO_BATTERY_ICON"
    battery.appendChild(batteryIcon)

    var batteryValue = document.createElement("div")
    batteryValue.id = "NETATMO_BATTERY_VALUE"
    battery.appendChild(batteryValue)

    line1.appendChild(battery)

    var line2 = document.createElement("div") // display the second line values
    line2.id = "NETATMO_VALUES"
    var firmware = document.createElement("div")
    firmware.id = "NETATMO_FIRMWARE"
    var firmwareIcon = document.createElement("div")
    firmwareIcon.id = "NETATMO_FIRMWARE_ICON"
    firmware.appendChild(firmwareIcon)
    var firmwareValue = document.createElement("div")
    firmwareValue.id = "NETATMO_FIRMWARE_VALUE"
    firmware.appendChild(firmwareValue)
    line2.appendChild(firmware)

    var signal = document.createElement("div")
    signal.id = "NETATMO_RADIO"
    var signalIcon = document.createElement("div")
    signalIcon.id = "NETATMO_RADIO_ICON"
    signal.appendChild(signalIcon)
    var signalValue = document.createElement("div")
    signalValue.id = "NETATMO_RADIO_VALUE"
    signal.appendChild(signalValue)
    line2.appendChild(signal)

    wrapper.appendChild(line1)
    wrapper.appendChild(line2)
    return wrapper
  },

  getStyles: function () {
    return [
      "MMM-Netatmo-Thermostat.css",
      "font-awesome.css"
    ]
  },

  socketNotificationReceived: function (noti, payload) {
    switch(noti) {
      case "DATA":
        this.updateData(payload)
        break
    }
  },

  notificationReceived: function(noti, payload) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        if (this.config.debug) logNT = (...args) => { console.log("[NETATMO]", ...args) }
        this.prepareDisplay()
        if (this.config.updateInterval < 30) this.config.updateInterval=30
        this.sendSocketNotification("INIT", this.config)
        break
    }
  },

  updateData: function(data) {
    if (!data) return console.error("[NETATMO] No Data!")
    this.Thermostat = data
    logNT(this.Thermostat)

    var name = document.getElementById("NETATMO_NAME")
    var batteryIcon = document.getElementById("NETATMO_BATTERY_ICON")
    var batteryValue = document.getElementById("NETATMO_BATTERY_VALUE")
    var signalIcon = document.getElementById("NETATMO_RADIO_ICON")
    var signalValue = document.getElementById("NETATMO_RADIO_VALUE")
    var tempTendency = document.getElementById("NETATMO_TEMP_TENDENCY")
    var temp = document.getElementById("NETATMO_TEMP")
    var tempValue = document.getElementById("NETATMO_TEMP_VALUE")
    var tempsetValue = document.getElementById("NETATMO_TEMPSET_VALUE")
    var tempsetIcon = document.getElementById("NETATMO_TEMPSET_ICON")
    var firmwareIcon = document.getElementById("NETATMO_FIRMWARE_ICON")
    var firmwareValue = document.getElementById("NETATMO_FIRMWARE_VALUE")

    name.textContent = this.Thermostat.name

    tempValue.textContent = this.Thermostat.temp.toFixed(1) + "°"
    tempTendency.className= this.tempTendency(this.Thermostat.temp, this.Thermostat.lastTemp)

    if ((this.Thermostat.mode == "schedule") || (this.Thermostat.mode == "manual")) {
      tempsetValue.textContent = this.Thermostat.tempSet + "°"
    }
    switch (this.Thermostat.mode) {
      case "schedule":
        tempsetIcon.className = "far fa-calendar-check"
        break
      case "manual":
        tempsetIcon.className = "fas fa-hand-paper"
        break
      case "off":
        tempsetIcon.className = "fas fa-power-off"
        tempsetValue.textContent = "OFF"
        break
      case "max":
        tempsetIcon.className = "fas fa-thermometer-full"
        tempsetValue.textContent = "MAX"
        break
    }

    firmwareIcon.className= "fas fa-microchip"
    firmwareValue.textContent = this.Thermostat.firmware

    signalIcon.className= "fas fa-signal"
    signalValue.textContent = this.Thermostat.signal + "%"

    batteryIcon.className = this.Thermostat.battery > 95 ? "fa fa-battery-full" :
                            this.Thermostat.battery >= 70 ? "fa fa-battery-three-quarters" :
                            this.Thermostat.battery >= 45 ? "fa fa-battery-half" :
                            this.Thermostat.battery >= 15 ? "fa fa-battery-quarter" :
                            "fa fa-battery-empty"
    batteryValue.textContent = this.Thermostat.battery +"%"

    if (this.Thermostat.heating) temp.className = "heating"
    else temp.classList.remove("heating")
  },

  tempTendency: function(actual, old) {
    let icon
    if (actual > old) icon = "fa fa-caret-up"
    if (actual == old) icon = "fa fa-caret-right"
    if (actual < old) icon = "fa fa-caret-down"
    return icon
  },

  prepareDisplay: function() {
    var name = document.getElementById("NETATMO_NAME")
    var mode = document.getElementById("NETATMO_TEMPSET")
    var battery = document.getElementById("NETATMO_BATTERY")
    var firmware = document.getElementById("NETATMO_FIRMWARE")
    var signal = document.getElementById("NETATMO_RADIO")

    if (!this.config.display.name) name.className= "hidden"
    if (!this.config.display.mode) mode.className= "hidden"
    if (!this.config.display.battery) battery.className = "hidden"
    if (!this.config.display.firmware) firmware.className= "hidden"
    if (!this.config.display.signal) signal.className = "hidden"
  }
});
