/* eslint-disable */
const inputProperties = require("./input")
const onlyButton = {
  "condition": {
    "functionBody": "return model.accessories[arrayIndices].accessory === 'Button';"
  }
}

module.exports = {
  "buttonPin": {
    "title": "Button GPIO",
    "type": "number",
    ...onlyButton,
    ...inputProperties
  }
}