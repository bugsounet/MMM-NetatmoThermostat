/** MMM-Netatmo-Thermostat search home_id **/
/** @bugsounet **/

const fs = require("fs")
const path = require("path")
var netatmo = require('./netatmo')

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
    if (!module.config.api.client_id) return console.log("client_id not defined in config.js")
    if (!module.config.api.client_secret) return console.log("client_secret not defined in config.js")
    //if (!module.config.username) return console.log("username not defined in config.js")
    //if (!module.config.password) return console.log("password not defined in config.js")
    console.log("[NETATMO] All needed value are there, perfect!")
    var auth = module.config.api
  }
}
if (!found) return console.log("MMM-Netatmo-Thermostat not configured in config.js")

console.log("[NETATMO] Try to login to Netatmo Servers...")

var api = new netatmo(auth)

var getHomeData = function(err, data) {
  console.log("[NETATMO] Read result from Netatmo server (/homesdata Endpoint)...")
  if (data && data.homes.length) {
    data.homes.forEach(home => {
      console.log("[NETATMO] --> [" + home.name + "] home_id:", `"` + home.id + `",`)
    })
  } else {
    console.error("[NETATMO] No datas !")
    process.exit()
  }
  console.log("[NETATMO] Select your 'home_id' key and past it in your config.")
  process.exit()
}

api
  .on('get-homedata', getHomeData)
  .on("error", function(error) {
    console.error('[NETATMO] Netatmo Servers threw an error: ' + error)
  })
  .on("warning", function(error) {
    console.warn('[NETATMO] Netatmo Servers threw a warning: ' + error)
  })
  .on("authenticated", function () {
    console.log("[NETATMO] Authenticated!")
  })

api.getHomeData()
