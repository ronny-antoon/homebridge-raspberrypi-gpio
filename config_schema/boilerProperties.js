/* eslint-disable */
const outputProperties = require("./output")
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
  }
}