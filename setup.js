/** MMM-Netatmo-Thermostat search home_id **/
/** @bugsounet **/

const fs = require("fs")
const path = require("path")
var netatmo = require('netatmo')

console.log("[NETATMO] Search config.js file...")
let file = path.resolve(__dirname, "../../config/config.js")
let found = false
let config = {}

if (fs.existsSync(file)) {
  var MMConfig = require(file)
  var MMModules = MMConfig.modules
}
else return console.log("[NETATMO] config.js not found !?")
console.log("[NETATMO] Found config.js !")
console.log("[NETATMO] Search MMM-Netatmo-Thermostat...")

for (let [nb, module] of Object.entries(MMModules)) {
  if (module.module == "MMM-Netatmo-Thermostat") {
    console.log("[NETATMO] Found:", module.module)
    found = true
    if (!module.config.client_id) return console.log("client_id not defined in config.js")
    if (!module.config.client_secret) return console.log("client_secret not defined in config.js")
    if (!module.config.username) return console.log("username not defined in config.js")
    if (!module.config.password) return console.log("password not defined in config.js")
    console.log("[NETATMO] All needed value are there, perfect!")
    var auth = {
      "client_id": module.config.client_id,
      "client_secret": module.config.client_secret,
      "username": module.config.username,
      "password": module.config.password,
    }
  }
  else if (!found) console.log("[NETATMO] Skip:", module.module)
}
if (!found) return console.log("MMM-Netatmo-Thermostat not configured in config.js")

console.log("[NETATMO] Try to login to Netatmo Servers...")

var api = new netatmo(auth)

var getHomeData = function(err, data) {
  console.log("[NETATMO] Read result from Netatmo server (/homesdata Endpoint)...")
  data.homes.forEach(home => {
    console.log("[NETATMO] --> home_id:", home.id, "(" + home.name + ")")
  })
  process.exit()
}

api.on('get-homedata', getHomeData)

api.on("error", function(error) {
  console.error('[NETATMO] Netatmo threw an error: ' + error)
})

api.on("warning", function(error) {
  console.log('[NETATMO] Netatmo threw a warning: ' + error)
})

api.on("authenticated", function (login) {
  console.log("[NETATMO] Authenticated!")
})

api.getHomeData()
