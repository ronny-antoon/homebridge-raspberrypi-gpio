import {Service, PlatformAccessory, CharacteristicValue} from 'homebridge';

import { GenericRPIControllerPlatform } from '../platform';
import {GpioController} from '../controllers/gpioController';
import {BinaryValue} from 'onoff';
import {DEFAULT_TIME_TO_OPEN_DOOR} from '../configurations/constants';

export class Door {
  // responsible for communicating with home bridge.
  private service: Service;
  // responsible for communicating with Raspberry Pi GPIO
  private gpioController: GpioController;
  // GPIO Pins raspberry pi
  private readonly doorPin: number;

  private timeOutMoving;

  constructor(
    private readonly platform: GenericRPIControllerPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.manufacturer || 'Default-Manufacturer-Ronny')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model || 'Default-Model-Ronny')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.serialNumber || 'Default-Serial-Ronny')
      .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName || 'nonono');

    // Configure Door Controller
    this.doorPin = accessory.context.device.doorPin;

    // get the LockMechansim service if it exists, otherwise create a new LockMechansim service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.LockMechanism) ||
      this.accessory.addService(this.platform.Service.LockMechanism);
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/LockMechanism

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(this.getLockCurrentState.bind(this));               // GET - bind to the `getOn` method below

    this.service.getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onSet(this.setLockTargetState.bind(this))                //Set
      .onGet(this.getLockTargetState.bind(this));               // GET - bind to the `getOn` method below

    //Configure raspberry pi controller
    this.gpioController = GpioController.Instance(platform.log);
    this.gpioController.exportGPIO(this.doorPin, 'out');

    // Close door efault
    this.setLockTargetState(0);

  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  getLockCurrentState(): CharacteristicValue {
    // eslint-disable-next-line no-console
    console.log('getLockCurrentState');
    return (
      this.gpioController.getState(this.doorPin) == 0 ?
        this.platform.Characteristic.LockCurrentState.UNSECURED :
        this.platform.Characteristic.LockCurrentState.SECURED
    );
  }

  getLockTargetState(): CharacteristicValue {
    // eslint-disable-next-line no-console
    console.log('getLockTargetState------');
    return (this.platform.Characteristic.LockTargetState.SECURED);
  }

  setLockTargetState(value: CharacteristicValue) : CharacteristicValue | void {
    // eslint-disable-next-line no-console
    console.log('setLockTargetState---------------------------------');
    if (value) {
      this.gpioController.setState(this.doorPin, 1);
      this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(this.getLockCurrentState());
      this.timeOutMoving = setTimeout(() => {
        this.gpioController.setState(this.doorPin, 0);
        this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(this.getLockCurrentState());
      }, (DEFAULT_TIME_TO_OPEN_DOOR * 1000));
    } else {
      if(this.timeOutMoving){
        clearTimeout(this.timeOutMoving)
      }
      this.gpioController.setState(this.doorPin, 0);
      this.service.getCharacteristic(this.platform.Characteristic.LockCurrentState).updateValue(this.getLockCurrentState());
    }
    return this.getLockCurrentState();
  }

}