/* eslint-disable */
const outputProperties = require("./output")
const onlyDoor = {
  "condition": {
    "functionBody": "return model.accessories[arrayIndices].accessory === 'Door';"
  }
}

module.exports = {
  "doorPin": {
    "title": "Door GPIO",
    "type": "number",
    ...onlyDoor,
    ...outputProperties
  }
}