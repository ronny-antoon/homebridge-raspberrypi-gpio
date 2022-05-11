import {CommonAccessory} from './commonAccessory';
import {GenericRPIControllerPlatform} from '../platform';
import {CharacteristicValue, PlatformAccessory} from 'homebridge';
import {BinaryValue} from 'onoff';

export class Outlet extends CommonAccessory {
  // GPIO Pins raspberry pi
  private readonly outletPin: number;
// parameters
  private onState: boolean;

  constructor(
    platform: GenericRPIControllerPlatform,
    accessory: PlatformAccessory,
  ) {
    // set accessory information
    super(platform, accessory, platform.Service.Outlet);

    // Configure pins Controller
    this.outletPin = this.accessory.context.device.outletPin;
    this.onState = this.accessory.context.device.onState || false;

    //Configure raspberry pi controller
    this.gpioController.exportGPIO(this.outletPin, 'out');

    // register handlers
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.handleOnGet.bind(this))
      .onSet(this.handleOnSet.bind(this));

    this.handleOnSet(this.handleOnGet());
  }

  handleOnGet(): CharacteristicValue {
    return this.onState;
  }

  handleOnSet(value: CharacteristicValue): CharacteristicValue | void {
    const newStat = value === true ? 1 : 0;
    this.onState = value === true;
    this.gpioController.setState(this.outletPin, newStat);
    this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.handleOnGet());
    return this.handleOnGet();
  }

  getValues(): Record<string, number | string | boolean> {
    return {
      'onState': this.onState,
    };
  }
}