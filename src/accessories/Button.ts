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
    this.gpioController.exportGPIO(this.buttonPin, 'in', 'both');

    // Watch for real button
    this.gpioController.startWatch(this.buttonPin, (err, value) =>{
      this.platform.log.info('button pressed :- ' + value);
      if (err) {
        throw err;
      }
      if (value === 0 || this.timoutLongPress !== 0) {
        this.platform.log.info('clear');
        clearTimeout(this.timoutLongPress);
        this.timoutLongPress = 0;
      } else {
        this.platform.log.info('set');
        this.timoutLongPress = setTimeout(() => {
          this.platform.log.info('dooo then clear');
          this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent).updateValue(
            this.platform.Characteristic.ProgrammableSwitchEvent.LONG_PRESS);
          this.timoutLongPress = 0;
        }, 2000);
      }
    });
  }

  handleProgrammableSwitchEventGet(): CharacteristicValue{
    return this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS;
  }
}