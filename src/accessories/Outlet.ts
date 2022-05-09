import {CommonAccessory} from './commonAccessory';
import {GenericRPIControllerPlatform} from '../platform';
import {CharacteristicValue, PlatformAccessory} from 'homebridge';
import {BinaryValue} from 'onoff';

export class Outlet extends CommonAccessory{
  // GPIO Pins raspberry pi
  private readonly outletPin: number;

  constructor(
    platform: GenericRPIControllerPlatform,
    accessory: PlatformAccessory,
  ) {
    // set accessory information
    super(platform, accessory, platform.Service.Outlet);

    // Configure pins Controller
    this.outletPin = this.accessory.context.device.outletPin;

    //Configure raspberry pi controller
    this.gpioController.exportGPIO(this.outletPin, 'out');

    // register handlers
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onGet(this.handleOnGet.bind(this))
      .onSet(this.handleOnSet.bind(this));
  }

  handleOnGet(): CharacteristicValue{
    return this.gpioController.getState(this.outletPin);
  }

  handleOnSet(value: CharacteristicValue): CharacteristicValue | void{
    let newStat: BinaryValue;
    if (value) {
      newStat = 1;
    } else {
      newStat = 0;
    }
    this.gpioController.setState(this.outletPin, newStat);
    this.service.getCharacteristic(this.platform.Characteristic.On).updateValue(this.handleOnGet());
    return this.handleOnGet();
  }
}