import {PlatformAccessory, CharacteristicValue} from 'homebridge';

import {GenericRPIControllerPlatform} from '../platform';
import {BinaryValue} from 'onoff';
import {CommonAccessory} from './commonAccessory';

export class LightBulb extends CommonAccessory {

  // GPIO Pins raspberry pi
  private readonly lightButtonPin: number;
  private readonly lightPin: number;
  // parameters
  private onState: boolean;

  constructor(
    platform: GenericRPIControllerPlatform,
    accessory: PlatformAccessory,
  ) {
    // set accessory information
    super(platform, accessory, platform.Service.Lightbulb);

    // Configure properties Accessory
    this.lightButtonPin = this.accessory.context.device.lightButtonPin;
    this.lightPin = this.accessory.context.device.lightPin;
    this.onState = this.accessory.context.device.onState || false;

    // Configure raspberry pi controller
    this.gpioController.exportGPIO(this.lightButtonPin, 'in');
    this.gpioController.exportGPIO(this.lightPin, 'out');

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOnCharacteristic.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getOnCharacteristic.bind(this));               // GET - bind to the `getOn` method below

    // register handler for button
    this.gpioController.startWatch(this.lightButtonPin, (err, value) => {
      if (err) {
        throw err;
      }
      if (value === 1) {
        const newStatus = this.onState ? 0 : 1;
        this.setOnCharacteristic(newStatus);
      }
    });

    // update device
    this.setOnCharacteristic(this.getOnCharacteristic());
  }

  // get Handler for homekit
  getOnCharacteristic(): CharacteristicValue {
    return this.onState;
  }

  // set Handler for homekit
  setOnCharacteristic(value: CharacteristicValue): CharacteristicValue | void {
    // fastest respond;
    this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(value);
    // change local value
    this.onState = value === true;
    // switch bulb
    this.gpioController.setState(this.lightPin, this.onState ? 1 : 0);

    this.updateCacheDevice();
  }

  getValues(): Record<string, number | string | boolean> {
    return {
      'onState': this.onState,
    };
  }
}