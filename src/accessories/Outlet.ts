import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';

import {GenericRPIControllerPlatform} from '../platform';
import {GpioController} from '../controllers/gpioController';
import {BinaryValue} from 'onoff';

export class Outlet {
  // responsible for communicating with home bridge.
  private service: Service;
  // responsible for communicating with Raspberry Pi GPIO
  private gpioController: GpioController;
  // GPIO Pins raspberry pi
  private readonly outletPin: number;

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

    // Configure Light Controller
    this.outletPin = accessory.context.device.outletPin;

    //Configure raspberry pi controller
    this.gpioController = GpioController.Instance(platform.log);
    this.gpioController.exportGPIO(this.outletPin, 'out');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Outlet) || this.accessory.addService(this.platform.Service.Outlet);
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below

    // Configure Cached State
    this.setOn(accessory.context.device.onState || 0);
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

  private setOn(value: CharacteristicValue): CharacteristicValue | void{
    const newValue: BinaryValue = (value == 1)?1:0;
    this.gpioController.setState(this.outletPin, newValue); // TODO: Async
    value = this.getOn();
    this.accessory.context.device.onState = value;
    this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(value);
    return value;
  }

  private getOn(): CharacteristicValue{
    const value = this.gpioController.getState(this.outletPin);
    return (value == 1) ? 1 : 0;
  }
}