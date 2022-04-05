import {PlatformAccessory, CharacteristicValue} from 'homebridge';

import { GenericRPIControllerPlatform } from '../platform';
import {BinaryValue} from 'onoff';
import {CommonAccessory} from './commonAccessory';

export class LightBulb extends CommonAccessory{

  // GPIO Pins raspberry pi
  private readonly lightButtonPin: number;
  private readonly lightPin: number;

  constructor(
    platform: GenericRPIControllerPlatform,
    accessory: PlatformAccessory,
  ) {
    // set accessory information
    super(platform, accessory, platform.Service.Lightbulb);

    // Configure Light Controller

    this.lightButtonPin = this.accessory.context.device.lightButtonPin;
    this.lightPin = this.accessory.context.device.lightPin;
    this.setOn(this.getOn() || 0);

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.turnLight.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getOnState.bind(this));               // GET - bind to the `getOn` method below

    //Configure raspberry pi controller
    this.gpioController.exportGPIO(this.lightButtonPin, 'in');
    this.gpioController.exportGPIO(this.lightPin, 'out');

    // Watch button press
    this.gpioController.startWatch(this.lightButtonPin, (err) => {
      if (err) {
        throw err;
      }
      const currentStatus = this.getOnState();
      const newStatus = currentStatus === 0 ? 1 : 0;
      this.turnLight(newStatus);
      this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.getOnState());
    });
    this.turnLight(this.getOn());

  }

  turnLight(value: CharacteristicValue) {
    // code to turn device on/off
    let newStat: BinaryValue;
    if (value) {
      newStat = 1;
    } else {
      newStat = 0;
    }
    this.setOn(value);
    this.gpioController.setState(this.lightPin, newStat);
    this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.getOnState());
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possible. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  getOnState(): CharacteristicValue {
    this.setOn(this.gpioController.getState(this.lightPin));
    return this.getOn();
  }

  private setOn(value: CharacteristicValue): CharacteristicValue | void{
    return this.accessory.context.device.onState = value;
  }

  private getOn(): CharacteristicValue{
    return this.accessory.context.device.onState;
  }
}