/* eslint-disable */
const outputProperties = require("./output")
const inputProperties = require('./input');
const onlyBoiler = {
  "condition": {
    "functionBody": "return model.accessories[arrayIndices].accessory === 'Boiler';"
  }
}

module.exports = {
  "boilerPin": {
    "title": "boiler Pin",
    "type": "number",
    ...onlyBoiler,
    ...outputProperties,
  },
  "boilerButtonPin": {
    "title": "Button GPIO",
    "type": "number",
    ...onlyBoiler,
    ...inputProperties
  }
}