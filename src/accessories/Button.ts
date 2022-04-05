import {CommonAccessory} from './commonAccessory';
import {GenericRPIControllerPlatform} from '../platform';
import {CharacteristicValue, PlatformAccessory} from 'homebridge';

export class Button extends CommonAccessory{
  // GPIO Pins raspberry pi
  private readonly buttonPin: number;

  // parameters
  private timoutLongPress;

  constructor(
    platform: GenericRPIControllerPlatform,
    accessory: PlatformAccessory,
  ) {
    // set accessory information
    super(platform, accessory, platform.Service.StatelessProgrammableSwitch);

    // Configure pins Controller
    this.buttonPin = this.accessory.context.device.buttonPin;

    // register handlers
    this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
      .onGet(this.handleProgrammableSwitchEventGet.bind(this));

    // Configure raspberry pi Controller
    this.gpioController.exportGPIO(this.buttonPin, 'in');

    // Watch for real button
    this.gpioController.startWatch(this.buttonPin, (err) =>{
      if (err) {
        throw err;
      }
      if (!this.timoutLongPress){
        this.timoutLongPress = setTimeout(()=>{
          this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent).
            updateValue(this.platform.Characteristic.ProgrammableSwitchEvent.LONG_PRESS);
          clearTimeout(this.timoutLongPress);
        }, 2000);
      }else {
        clearTimeout(this.timoutLongPress);
      }
    });
  }

  handleProgrammableSwitchEventGet(): CharacteristicValue{
    return this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS;
  }
}