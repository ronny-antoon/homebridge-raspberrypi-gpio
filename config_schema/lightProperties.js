/* eslint-disable */
const inputProperties = require("./input")
const outputProperties = require("./output")
const onlyLightBulb = {
  "condition": {
    "functionBody": "return model.accessories[arrayIndices].accessory === 'LightBulb';"
  }
}

module.exports = {
  "lightPin": {
    "title": "Light GPIO",
    "type": "number",
    ...onlyLightBulb,
    ...outputProperties
  },
  "buttonPin": {
    "title": "Button GPIO",
    "type": "number",
    ...onlyLightBulb,
    ...inputProperties
  }
}