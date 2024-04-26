# MMM-NetatmoThermostat

![](https://github.com/bugsounet/MMM-NetatmoThermostat/blob/dev/resources/netatmo-logo.png?raw=true)

This module display your Netatmo Thermostat informations on MirrorMirror²

## Screenshoot

## Install

  ```sh
  cd ~/MagicMirror/modules
  git clone https://github.com/bugsounet/MMM-NetatmoThermostat
  cd MMM-NetatmoThermostat
  npm install
  ```

## Pre-install

   1) Link your module with netatmo api
      * Navigate to [Netatmo Connect](https://dev.netatmo.com/) website
      * You have to use your personal identifier
      * Create a new app
      * Note your `client id` and `client secret`
      * In `Token generator` add `read_thermostat` scope
      * Generate Token
      * Accept Netatmo link with your app
      * Note your `Refresh Token`

   2) Create your own configuration
      * replace all value by yours
      * `home_id` will be null at this time
      * don't worry, we find it in post-install step !

## Configuration Sample

### Simple Sample

```js
    {
      module: 'MMM-NetatmoThermostat',
      position: 'top_center',
      configDeepMerge: true,
      config: {
        api: {
          client_id: null,
          client_secret: null,
          refresh_token: null
        },
        home_id: null,
      }
    },
```

### Personalized Sample

This Configuration is the same like the Simple Configuration.

If you want to tune it, you can change only the desired value

```js
    {
      module: "MMM-NetatmoThermostat",
      position: "top_center",
      configDeepMerge: true,
      config: {
        debug: false,
        verbose: false,
        api: {
          client_id: null,
          client_secret: null,
          refresh_token: null
        },
        updateInterval: 60000,
        home_id: null,
        room_id: 0,
        display: {
          name: true,
          mode: true,
          battery: true,
          firmware: false,
          signal: true,
          tendency: true
        }
      }
    },
```

### Configuration Structure

* Field in `root`

> | field | type | default | description |
> |--- |--- |--- | --- |
> | debug | BOOLEAN | false | enable or not debug mode |
> | verbose | BOOLEAN | false | verbose dialogue on debug mode |
> | client_id | STRING | null | your client id of your app | 
> | client_secret | STRING | null | your client secret of your app |
> | home_id | STRING | null | Your home_id find with `npm run setup` |
> | room_id | NUMBER | 0 | room_id (can help if your have many adapter).<br>Generally, you don't have to change this value |
> | updateInterval | NUMBER| 60000 | delay in ms for next update.<br> (mini interval is 30 seconds (30000) to preserve Netatmo Server) |

* Field `api: {...}`
> |field | type | default | description |
> |--- |--- |--- | --- |
> | client_id | STRING | null | your client id of your app |
> | client_secret | STRING | null | your client secret of your app |
> | refresh_token | STRING | null | your refresh token of your app |

* Field `display: {...}`

> | field | type | default | description
> |--- |--- |--- |---
> | name | BOOLEAN | true | Display the name of the thermostat |
> | mode | BOOLEAN | true | Display the program mode and associated the temperature |
> | battery | BOOLEAN | true | Display the battery level of the thermostat |
> | firmware | BOOLEAN | false | Display the firmware number |
> | signal | BOOLEAN | true | Display signal quality between relay and thermostat |
> | tendency | BOOLEAN | true | Display the temperature tendency arrow |

## Post install: Find your `home_id`

  * For this, the module configuration should be present in your `config.js` file
  * Naturally, your MagicMirror² app should be stop at this point :)
  * Run this command:
  ```sh
  cd ~/MagicMirror/modules/MMM-NetatmoThermostat
  npm run setup
  ```
  This script will read your `config.js` file and find your module configuration.

  * Sample of Return with this script:
  ```sh
[NETATMO] Try to login to Netatmo Servers...
[NETATMO] Authenticated!

[NETATMO] --> [MyHome - Thermostat] home_id: "61e44c0f411341055bXXXXX"

[NETATMO] Select your 'home_id' key and past it in your config.
```

You can have multi line with home_id value (if you have another house with Netatmo thermostat)
Select the better line !
Just copy/past the home_id key and past it in your config
In this case : `home_id: "61e44c0f411341055bXXXXX",`

## Update
### Manual update
In a terminal try this command:

```sh
  cd ~/MagicMirror/modules/MMM-NetatmoThermostat
  npm run update
```

### Automatic Update from [updatenotification](https://develop.docs.magicmirror.builders/modules/updatenotification.html) default module
Since MagicMirror² v2.27.x, we are able to Update automatically any modules from `updatenotification`.<br>
Let's add `MMM-NetatmoThermostat` rule

```js
  {
    module: "updatenotification",
    position: "top_center",
    config: {
      updateAutorestart: true, // restart MagicMirror² automatically after update
      updates: [
        // MMM-NetatmoThermostat rule
        {
          "MMM-NetatmoThermostat": "npm run update"
        },
      ]
    }
  },
```

## Credits
  * Author:
     * @bugsounet
  * License: MIT

## Donation
 If you love this module, buy me a coffee :)

 [Donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=TTHRH94Y4KL36&source=url)