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
      signal: true,
      tendency: true
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
      var zone1 = document.createElement("div")
      zone1.id = "NETATMO_ZONE1"

        var tempset = document.createElement("div")
        tempset.id = "NETATMO_TEMPSET"
        var tempsetIcon = document.createElement("div")
        tempsetIcon.id= "NETATMO_TEMPSET_ICON"
        tempset.appendChild(tempsetIcon)
        var tempsetValue = document.createElement("div")
        tempsetValue.id= "NETATMO_TEMPSET_VALUE"
        tempset.appendChild(tempsetValue)
      zone1.appendChild(tempset)

        var firmware = document.createElement("div")
        firmware.id = "NETATMO_FIRMWARE"
        var firmwareIcon = document.createElement("div")
        firmwareIcon.id = "NETATMO_FIRMWARE_ICON"
        firmware.appendChild(firmwareIcon)
        var firmwareValue = document.createElement("div")
        firmwareValue.id = "NETATMO_FIRMWARE_VALUE"
        firmware.appendChild(firmwareValue)
      zone1.appendChild(firmware)

    temp.appendChild(zone1)

    var tempValue = document.createElement("div")
    tempValue.id = "NETATMO_TEMP_VALUE"
    tempValue.innerHTML = "<img src ='https://my.netatmo.com/images/common/logo_netatmo.svg' style='zoom: 150%'>"
    temp.appendChild(tempValue)

    var zone2 = document.createElement("div")
    zone2.id = "NETATMO_ZONE2"

      var battery = document.createElement("div")
      battery.id = "NETATMO_BATTERY"
      var batteryIcon = document.createElement("div")
      batteryIcon.id = "NETATMO_BATTERY_ICON"
      battery.appendChild(batteryIcon)
      var batteryValue = document.createElement("div")
      batteryValue.id = "NETATMO_BATTERY_VALUE"
      battery.appendChild(batteryValue)
    zone2.appendChild(battery)

      var tempTendency = document.createElement("div")
      tempTendency.id = "NETATMO_TEMP_TENDENCY"
    zone2.appendChild(tempTendency)

      var signal = document.createElement("div")
      signal.id = "NETATMO_RADIO"
      var signalIcon = document.createElement("div")
      signalIcon.id = "NETATMO_RADIO_ICON"
      signal.appendChild(signalIcon)
      var signalValue = document.createElement("div")
      signalValue.id = "NETATMO_RADIO_VALUE"
      signal.appendChild(signalValue)
    zone2.appendChild(signal)

    temp.appendChild(zone2)
    wrapper.appendChild(temp)

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
    if (this.config.display.tendency) {
      tempTendency.className= this.tempTendency(this.Thermostat.tendency)
    }

    if (this.config.display.mode) {
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
    }

    if (this.config.display.firmware) {
      firmwareIcon.className= "fas fa-microchip"
      firmwareValue.textContent = this.Thermostat.firmware
    }

    if (this.config.display.signal) {
      signalIcon.className= "fas fa-signal"
      signalValue.textContent = this.Thermostat.signal + "%"
    }

    if (this.config.display.battery) {
      batteryIcon.className = this.Thermostat.battery > 95 ? "fa fa-battery-full" :
                              this.Thermostat.battery >= 70 ? "fa fa-battery-three-quarters" :
                              this.Thermostat.battery >= 45 ? "fa fa-battery-half" :
                              this.Thermostat.battery >= 15 ? "fa fa-battery-quarter" :
                              "fa fa-battery-empty"
      batteryValue.textContent = this.Thermostat.battery +"%"
    }

    if (this.Thermostat.heating) temp.className = "heating"
    else temp.classList.remove("heating")
  },

  tempTendency: function(tendency) {
    let icon
    if (tendency == 1 ) icon = "fa fa-caret-up"
    else if (tendency == 2) icon = "fa fa-caret-down"
    else icon = "fa fa-caret-right"
    return icon
  },

  prepareDisplay: function() {
    var name = document.getElementById("NETATMO_NAME")
    var modeIcon = document.getElementById("NETATMO_TEMPSET_ICON")
    var modeValue = document.getElementById("NETATMO_TEMPSET_VALUE")
    var batteryIcon = document.getElementById("NETATMO_BATTERY_ICON")
    var batteryValue = document.getElementById("NETATMO_BATTERY_VALUE")
    var firmwareIcon = document.getElementById("NETATMO_FIRMWARE_ICON")
    var firmwareValue = document.getElementById("NETATMO_FIRMWARE_VALUE")
    var signalIcon = document.getElementById("NETATMO_RADIO_ICON")
    var signalValue = document.getElementById("NETATMO_RADIO_VALUE")
    var tempTendency = document.getElementById("NETATMO_TEMP_TENDENCY")

    if (!this.config.display.name) name.className= "hidden"
    if (!this.config.display.mode) {
      modeIcon.classList.add("hidden")
      modeValue.className = "hidden"
    }
    if (!this.config.display.battery) {
      batteryIcon.className = "hidden"
      batteryValue.className = "hidden"
    }
    if (!this.config.display.firmware) {
      firmwareIcon.className= "hidden"
      firmwareValue.className= "hidden"
    }
    if (!this.config.display.signal) {
      signalIcon.className = "hidden"
      signalValue.className = "hidden"
    }
    if (this.config.display.tendency)
      tempTendency.className = "hidden"
    }
});
