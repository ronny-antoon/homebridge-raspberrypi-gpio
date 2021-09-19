import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { GenericRPIControllerPlatform } from '../platform';
import {GpioController} from '../controllers/gpioController';

export class LightBulb {
  // responsible for communicating with home bridge.
  private service: Service;
  // responsible for communicating with Raspberry Pi GPIO
  private gpioController: GpioController;
  // GPIO Pins raspberry pi
  private readonly buttonPin: number;
  private readonly lightPin: number;

  constructor(
    private readonly platform: GenericRPIControllerPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer-Ronny')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model-Ronny')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial-Ronny')
      .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName || 'nonono');

    // Configure Light Controller
    this.buttonPin = accessory.context.device.buttonPin;
    this.lightPin = accessory.context.device.lightPin;

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.triggerLight.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getOnState.bind(this));               // GET - bind to the `getOn` method below


    //Configure raspberry pi controller
    this.gpioController = GpioController.Instance(platform.log);
    this.gpioController.initGPIO(this.buttonPin, 'in');
    this.gpioController.initGPIO(this.lightPin, 'out');

    // Watch button press
    this.gpioController.startWatch(this.buttonPin, (err) => {
      if (err) {
        throw err;
      }
      this.triggerLight();
      this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.getOnState());
    });
  }

  triggerLight() {
    // code to turn device on/off
    const currentStatus = this.getOnState();
    const newStatus = currentStatus === 0 ? 1 : 0;
    this.gpioController.setState(this.lightPin, newStatus);
    this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.getOnState());
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
  getOnState(): CharacteristicValue {
    return this.gpioController.getState(this.lightPin);
  }

}
