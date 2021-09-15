import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { GenericRPIControllerPlatform } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LightBulbAccessory {
  private service: Service;
  private statusTest: boolean;
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
  ) {
    this.statusTest = false;
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer-Ronny')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model-Ronny')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial-Ronny');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.triggerLight.bind(this))                // SET - bind to the `setOn` method below
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

      //TODO: add listener to input for trigger light "inputPin"

  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async triggerLight(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    const currentStatus = (await this.getStatus()) as boolean;
    const newStatus = !currentStatus;
    this.platform.log.info('Set Characteristic On value: ->', value);
    this.platform.log.info('Set Characteristic On currentStatus: ->', currentStatus);
    this.platform.log.info('Set Characteristic On newStatus: ->', newStatus);
    //TODO: write change output voltage
    this.statusTest = newStatus;
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
  async getStatus(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const isOn = this.statusTest; //TODO: read from outpot pin

    this.platform.log.info('Get Characteristic On ->', isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }

}
