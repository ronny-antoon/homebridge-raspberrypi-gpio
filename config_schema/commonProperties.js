/* eslint-disable */

module.exports = { // add accessories type
  'accessory': {
    'title': 'Accessory',
    'description': 'The type of the accessory.',
    'type': 'string',
    'default': 'LightBulb',
    'required': true,
    'oneOf': [
      {
        'title': 'Light',
        'enum': [
          'LightBulb',
        ],
      },
      {
        'title': 'Window Covering',
        'enum': [
          'WindowCovering',
        ],
      },
      {
        'title': 'Boiler',
        'enum': [
          'Boiler',
        ],
      },
      {
        'title': 'Door',
        'enum': [
          'Door',
        ],
      },
      {
        'title': 'Button',
        'enum': [
          'Button',
        ],
      },
      {
        'title': 'Outlet',
        'enum': [
          'Outlet',
        ],
      },
      {
        'title': 'SecuritySystem',
        'enum': [
          'SecuritySystem',
        ],
      },
    ],
  },
  'serialNumber': {
    'title': 'Serial Name',
    'description': 'The HomeKit Serial recognizing.',
    'type': 'string',
    'required': true,
  },
  'displayName': {
    'title': 'Display Name',
    'description': 'The HomeKit name of the device.',
    'type': 'string',
    'required': true,
  },
}