/* eslint-disable */
const fs = require("fs")
const path = require("path")
const commonProperties = require('./commonProperties')
const lightProperties = require('./lightProperties')
const windowCoveringProperties = require('./windowCoveringProperties')
const boilerProperties = require('./boilerProperties')
const doorProperties = require('./doorProperties')
const buttonProperties = require('./buttonProperties')
const outletProperties = require('./outletProperties')

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
            ...outletProperties
          },
        },
      },
    },
  },
};


fs.writeFileSync(path.join(__dirname, '../config.schema.json'), JSON.stringify(schema, null, 2), {encoding: 'utf-8'})