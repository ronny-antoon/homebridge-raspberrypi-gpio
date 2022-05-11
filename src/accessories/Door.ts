import {PlatformAccessory, CharacteristicValue} from 'homebridge';

import {GenericRPIControllerPlatform} from '../platform';
import {DEFAULT_TIME_TO_OPEN_DOOR} from '../configurations/constants';
import {CommonAccessory} from './commonAccessory';

export class Door extends CommonAccessory {
  // GPIO Pins raspberry pi
  private readonly doorPin: number;

  private timeOutMoving;

  constructor(
    platform: GenericRPIControllerPlatform,
    accessory: PlatformAccessory,
  ) {
    super(platform, accessory, platform.Service.LockMechanism);

    // Configure Door Controller
    this.doorPin = accessory.context.device.doorPin;

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.getLockCurrentState.bind(this));               // GET - bind to the `getOn` method below

    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onSet(this.setLockTargetState.bind(this))                //Set
      .onGet(this.getLockTargetState.bind(this));               // GET - bind to the `getOn` method below

    //Configure raspberry pi controller
    this.gpioController.exportGPIO(this.doorPin, 'out');

    // Close door efault
    this.setLockTargetState(this.platform.Characteristic.LockTargetState.SECURED);

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
  getLockCurrentState(): CharacteristicValue {
    // eslint-disable-next-line no-console
    //console.log('getLockCurrentState');
    return (
      this.gpioController.getState(this.doorPin) === 0 ?
        this.platform.Characteristic.LockCurrentState.SECURED :
        this.platform.Characteristic.LockCurrentState.UNSECURED
    );
  }

  getLockTargetState(): CharacteristicValue {
    // eslint-disable-next-line no-console
    //console.log('getLockTargetState------');
    return (
      this.gpioController.getState(this.doorPin) === 0 ?
        this.platform.Characteristic.LockTargetState.SECURED :
        this.platform.Characteristic.LockTargetState.UNSECURED
    );
  }

  setLockTargetState(value: CharacteristicValue): CharacteristicValue | void {
    // eslint-disable-next-line no-console
    //console.log('setLockTargetState---------------------------------');
    if (value === this.platform.Characteristic.LockTargetState.UNSECURED) {
      this.gpioController.setState(this.doorPin, 1);
      this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(this.getLockCurrentState());
      this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).updateValue(this.getLockTargetState());
      this.timeOutMoving = setTimeout(() => {
        this.gpioController.setState(this.doorPin, 0);
        this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(this.getLockCurrentState());
        this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).updateValue(this.getLockTargetState());
      }, (DEFAULT_TIME_TO_OPEN_DOOR * 1000));
    } else {
      if (this.timeOutMoving) {
        clearTimeout(this.timeOutMoving);
      }
      this.gpioController.setState(this.doorPin, 0);
      this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(this.getLockCurrentState());
      this.service.getCharacteristic(this.platform.Characteristic.LockTargetState).updateValue(this.getLockTargetState());
    }
    return this.getLockCurrentState();
  }

  getValues(): Record<string, number | string | boolean> {
    return {};
  }
}