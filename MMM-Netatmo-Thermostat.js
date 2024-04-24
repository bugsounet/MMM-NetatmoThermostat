/*
 * Module: MMM-Netatmo-Thermostat
 *
 * By bugsounet ©2024
 * MIT Licensed.
 */
logNT = (...args) => { /* do nothing */ }

Module.register("MMM-Netatmo-Thermostat", {
  defaults: {
    debug: false,
    updateInterval: 30000,
    home_id: null,
    room_id: 0,
    api: {
      client_id: null,
      client_secret: null,
      access_token: null,
      refresh_token: null
    },
    display: {
      name: true,
      mode: true,
      battery: true,
      firmware: true,
      signal: true,
      tendency: true
    }
  },
  requiresVersion: "2.26.0",

  start: function() {
    this.Thermostat = null
  },

  getDom: function() {
    var wrapper = document.createElement("div")
    wrapper.id = "NETATMO"

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
        if (!this.config.display.mode) {
          tempsetIcon.className = "hidden"
          tempsetValue.className = "hidden"
        }
      zone1.appendChild(tempset)

        var firmware = document.createElement("div")
        firmware.id = "NETATMO_FIRMWARE"
        var firmwareIcon = document.createElement("div")
        firmwareIcon.id = "NETATMO_FIRMWARE_ICON"
        firmware.appendChild(firmwareIcon)
        var firmwareValue = document.createElement("div")
        firmwareValue.id = "NETATMO_FIRMWARE_VALUE"
        firmware.appendChild(firmwareValue)
        if (!this.config.display.firmware) {
          firmwareIcon.className = "hidden"
          firmwareValue.className = "hidden"
        }
      zone1.appendChild(firmware)

    temp.appendChild(zone1)

    var zone2 = document.createElement("div")
      zone2.id = "NETATMO_ZONE2"

      var name = document.createElement("div")
      name.id = "NETATMO_NAME"
      zone2.appendChild(name)

      var tempValue = document.createElement("div")
      tempValue.id = "NETATMO_TEMP_VALUE"
      tempValue.innerHTML = "<img src ='modules/MMM-Netatmo-Thermostat/netatmo-logo.png' style='width: 200px;'>"
      zone2.appendChild(tempValue)

      var empty = document.createElement("div")
      empty.id = "NETATMO_EMPTY"
      zone2.appendChild(empty)

    temp.appendChild(zone2)

    var zone3 = document.createElement("div")
    zone3.id = "NETATMO_ZONE3"

      var battery = document.createElement("div")
      battery.id = "NETATMO_BATTERY"
      var batteryIcon = document.createElement("div")
      batteryIcon.id = "NETATMO_BATTERY_ICON"
      battery.appendChild(batteryIcon)
      var batteryValue = document.createElement("div")
      batteryValue.id = "NETATMO_BATTERY_VALUE"
      battery.appendChild(batteryValue)
      if (!this.config.display.battery) {
        batteryIcon.className = "hidden"
        batteryValue.className = "hidden"
      }
    zone3.appendChild(battery)

      var tempTendency = document.createElement("div")
      tempTendency.id = "NETATMO_TEMP_TENDENCY"
      var tempTendencyIcon = document.createElement("div")
      tempTendencyIcon.id = "NETATMO_TEMP_TENDENCY_ICON"
      tempTendency.appendChild(tempTendencyIcon)
      if (!this.config.display.tendency) tempTendencyIcon.className = "hidden"
    zone3.appendChild(tempTendency)

      var signal = document.createElement("div")
      signal.id = "NETATMO_RADIO"
      var signalIcon = document.createElement("div")
      signalIcon.id = "NETATMO_RADIO_ICON"
      signal.appendChild(signalIcon)
      var signalValue = document.createElement("div")
      signalValue.id = "NETATMO_RADIO_VALUE"
      signal.appendChild(signalValue)
      if (!this.config.display.signal) {
        signalIcon.className = "hidden"
        signalValue.className = "hidden"
      }
    zone3.appendChild(signal)

    temp.appendChild(zone3)
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
        if (this.config.updateInterval < 30000) this.config.updateInterval = 30000
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
    var tempTendencyIcon = document.getElementById("NETATMO_TEMP_TENDENCY_ICON")
    var temp = document.getElementById("NETATMO_TEMP")
    var tempValue = document.getElementById("NETATMO_TEMP_VALUE")
    var tempsetValue = document.getElementById("NETATMO_TEMPSET_VALUE")
    var tempsetIcon = document.getElementById("NETATMO_TEMPSET_ICON")
    var firmwareIcon = document.getElementById("NETATMO_FIRMWARE_ICON")
    var firmwareValue = document.getElementById("NETATMO_FIRMWARE_VALUE")

    if (this.config.display.name) name.textContent = this.Thermostat.name

    tempValue.textContent = this.Thermostat.temp.toFixed(1) + "°"
    if (this.config.display.tendency) {
      tempTendencyIcon.className= this.tempTendency(this.Thermostat.tendency)
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
  }
});
