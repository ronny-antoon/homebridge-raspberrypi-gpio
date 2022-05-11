import {PlatformAccessory, Service, WithUUID} from 'homebridge';
import {GpioController} from '../controllers/gpioController';
import {GenericRPIControllerPlatform} from '../platform';

export abstract class CommonAccessory {

  // responsible for communicating with home bridge.
  protected service: Service;

  // responsible for communicating with Raspberry Pi GPIO
  protected gpioController: GpioController;

  constructor(
    protected readonly platform: GenericRPIControllerPlatform,
    protected readonly accessory: PlatformAccessory,
    protected readonly serviceType: WithUUID<typeof Service>,
  ) {

    // get the service if it exists, otherwise create a new service
    // you can create multiple services for each accessory
    // each service must implement at-minimum the "required characteristics" for the given service type
    //this.service = this.accessory.getService(serviceType) || this.accessory.addService(serviceType);
    this.service = this.accessory.getService(serviceType) || this.accessory.addService(serviceType);

    this.setAccessoryInfo();

    //Configure raspberry pi controller
    this.gpioController = GpioController.Instance(this.platform.log);
  }

  abstract getValues(): Record<string, number | string | boolean>;

  updateCacheDevice(): void {
    Object.assign(this.accessory.context.device, this.getValues());
  }

  // TODO: restoreCacheDevice()
  // TODO: oneSingletonFuncRefresh()

  setAccessoryInfo(): void {
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer,
        this.accessory.context.device.manufacturer || 'Default-Manufacturer-Ronny')
      .setCharacteristic(this.platform.Characteristic.Model,
        this.accessory.context.device.model || 'Default-Model-Ronny')
      .setCharacteristic(this.platform.Characteristic.SerialNumber,
        this.accessory.context.device.serialNumber || 'Default-Serial-Ronny')
      .setCharacteristic(this.platform.Characteristic.Name,
        this.accessory.context.device.displayName || 'Default-DisplayName-Ronny');
    // TODO: npm install internal-ip
  }
}