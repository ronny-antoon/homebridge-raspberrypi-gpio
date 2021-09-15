import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { GenericRPIControllerPlatform } from '../platform';
import {GpioController} from '../controllers/gpioController';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PushButton {
  // responsible for communicating with home bridge.
  private service: Service;
  // input pin on the raspberry pi
  private readonly inputPin : number;
  private gpioController: GpioController;
  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  // private exampleStates = {
  //   On: false,
  //   Brightness: 100,
  // };

  constructor(
    private readonly platform: GenericRPIControllerPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly _inputPin: number, // TODO: could be null
  ) {
    this.gpioController = GpioController.Instance(platform.log);
    this.inputPin = _inputPin;
    this.gpioController.initGPIO(this.inputPin, 'in');
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer-Ronny')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model-Ronny')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial-Ronny');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.StatelessProgrammableSwitch)
      || this.accessory.addService(this.platform.Service.StatelessProgrammableSwitch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
      .onGet(this.getStatus.bind(this));               // GET - bind to the `getOn` method below
    /**
     * Creating multiple services of the same type.
     *
     * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
     * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
     * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
     *
     * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
     * can use the same sub type id.)
     */


    this.gpioController.startWatch(this.inputPin);
  }

  /**
   * Handle requests to get the current value of the "Programmable Switch Event" characteristic
   */
  handleProgrammableSwitchEventGet() {
    this.platform.log.info('Triggered GET ProgrammableSwitchEvent');

    // set this to a valid value for ProgrammableSwitchEvent
    const currentValue = this.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS;

    return currentValue;
  }

}
