/* eslint-disable */
const fs = require("fs")
const path = require("path")
const commonProperties = require('./commonProperties')
const lightProperties = require('./accessory_config/lightProperties')
const windowCoveringProperties = require('./accessory_config/windowCoveringProperties')
const boilerProperties = require('./accessory_config/boilerProperties')
const doorProperties = require('./accessory_config/doorProperties')
const buttonProperties = require('./accessory_config/buttonProperties')
const outletProperties = require('./accessory_config/outletProperties')
const securitySystemProperties = require('./accessory_config/securitySystemProperties')

const schema = {
  'pluginAlias': 'homebridge-raspberrypi-gpio',
  'pluginType': 'platform',
  'singular': true,
  'headerDisplay': 'Homebridge plugin for Raspberry Pi',
  'footerDisplay': '',
  'schema': {
    'type': 'object',
    'properties': {
      'name': {
        'description': 'Plugin name as displayed in the homebridge log.',
        'type': 'string',
        'required': true,
        'default': 'homebridge-raspberrypi-gpio',
      },
      'accessories': {
        'title': 'Accessories',
        'notitle': true,
        'type': 'array',
        'items': {
          'description': '<b>Accessories</b>',
          'type': 'object',
          'properties': {
            ...commonProperties,
            ...lightProperties,
            ...windowCoveringProperties,
            ...boilerProperties,
            ...doorProperties,
            ...buttonProperties,
            ...outletProperties,
            ...securitySystemProperties,
          },
        },
      },
    },
  },
};


fs.writeFileSync(path.join(__dirname, '../config.schema.json'), JSON.stringify(schema, null, 2), {encoding: 'utf-8'})