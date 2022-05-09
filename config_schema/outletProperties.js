/* eslint-disable */
const outputProperties = require("./output")
const onlyOutlet = {
  "condition": {
    "functionBody": "return model.accessories[arrayIndices].accessory === 'Outlet';"
  }
}

module.exports = {
  "outletPin": {
    "title": "outlet GPIO",
    "type": "number",
    ...onlyOutlet,
    ...outputProperties
  }
}