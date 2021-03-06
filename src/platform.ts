import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './configurations/settings';
import {LightBulb} from './accessories/LightBulb';
import {Blind} from './accessories/Blind';
import {getAccessories} from './utils/ConfigParser';
import {Boiler} from './accessories/Boiler';
import {Door} from './accessories/Door';
import {Button} from './accessories/Button';
import {Outlet} from './accessories/Outlet';
import {GpioController} from './controllers/gpioController';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config_schema and discover/register accessories with Homebridge.
 */
export class GenericRPIControllerPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.info('Finished initializing platform:', this.config.name);
    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.info('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.registerDevices(); // Marwan
    });

    // Blink led 5 times then turn of it
    this.blinkLed();
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  registerDevices() {
    this.log.info('register device entered');
    // EXAMPLE ONLY
    // A real plugin you would register accessories from a user-defined array in the platform config_schema.
    const configuredDevicesFromFile = getAccessories(this.config);
    if(configuredDevicesFromFile) {
      // loop over the discovered devices and register each one if it has not already been registered
      for (const device of configuredDevicesFromFile) {

        // generate a unique id for the accessory this should be generated from
        // something globally unique, but constant, for example, the device serial
        // number or MAC address
        const uuid = this.api.hap.uuid.generate(device.serialNumber);

        // see if an accessory with the same uuid has already been registered and restored from
        // the cached devices we stored in the `configureAccessory` method above
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {
          // the accessory already exists
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          if (existingAccessory.context.device.accessory === 'WindowCovering') {
            new Blind(this, existingAccessory);
          }
          if (existingAccessory.context.device.accessory === 'LightBulb') {
            new LightBulb(this, existingAccessory);
          }
          if (existingAccessory.context.device.accessory === 'Door') {
            new Door(this, existingAccessory);
          }
          if (existingAccessory.context.device.accessory === 'Boiler') {
            new Boiler(this, existingAccessory);
          }
          if (existingAccessory.context.device.accessory === 'Button') {
            new Button(this, existingAccessory);
          }
          if (existingAccessory.context.device.accessory === 'Outlet') {
            new Outlet(this, existingAccessory);
          }
          // TODO: https://stackoverflow.com/questions/15338610/dynamically-loading-a-typescript-class-reflection-for-typescript
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        } else {
          // the accessory does not yet exist, so we need to create it
          this.log.info('Adding new accessory:', device.displayName);
          // create a new accessory
          const accessory = new this.api.platformAccessory(device.displayName, uuid);

          // store a copy of the device object in the `accessory.context`
          // the `context` property can be used to store any data about the accessory you may need
          accessory.context.device = device;

          // create the accessory handler for the newly create accessory
          // this is imported from `platformAccessory.ts`
          // marwan switch case according to accessory type
          if (device.accessory === 'WindowCovering') {
            new Blind(this, accessory);
          }
          if (device.accessory === 'LightBulb') {
            new LightBulb(this, accessory);
          }
          if (device.accessory === 'Door') {
            new Door(this, accessory);
          }
          if (device.accessory === 'Boiler') {
            new Boiler(this, accessory);
          }
          if (device.accessory === 'Button') {
            new Button(this, accessory);
          }
          if (device.accessory === 'Outlet') {
            new Outlet(this, accessory);
          }

          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);

        }
      }
    }
  }

  blinkLed(){
    //Configure raspberry pi controller
    const gpioController = GpioController.Instance(console);
    gpioController.exportGPIO(2, 'out');
    let count = 0;
    gpioController.setState(2, 0);
    const ti = setInterval(()=>{
      gpioController.setState(2, (gpioController.getState(2) === 0 ? 1 : 0));
      if(count === 10){
        gpioController.setState(2, 0);
        clearInterval(ti);
      }
      count++;
    }, 1000);
  }
}
