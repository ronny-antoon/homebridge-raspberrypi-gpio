/* eslint-disable */
const inputProperties = require("../input")
const outputProperties = require("../output")
const onlyWindowCovering = {
  "condition": {
    "functionBody": "return model.accessories[arrayIndices].accessory === 'WindowCovering';"
  }
}

module.exports = {
  "motorUpPin": {
    "title": "Motor Up GPIO",
    "type": "number",
    ...onlyWindowCovering,
    ...outputProperties
  },
  "motorDownPin": {
    "title": "Motor Down GPIO",
    "type": "number",
    ...onlyWindowCovering,
    ...outputProperties
  },
  "buttonUpPin": {
    "title": "Button Up GPIO",
    "type": "number",
    ...onlyWindowCovering,
    ...inputProperties
  },
  "buttonDownPin": {
    "title": "Button Down GPIO",
    "type": "number",
    ...onlyWindowCovering,
    ...inputProperties
  },
  "timeToOpen": {
    "title": "Time To Open",
    "type": "number",
    "placeholder": 13,
    ...onlyWindowCovering
  },
  "timeToClose": {
    "title": "Time To Close",
    "type": "number",
    "placeholder": 13,
    ...onlyWindowCovering
  }
}