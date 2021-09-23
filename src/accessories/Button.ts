import {CharacteristicValue, PlatformAccessory, Service} from 'homebridge';
import {GpioController} from '../controllers/gpioController';
import {GenericRPIControllerPlatform} from '../platform';

export class Button {
  // responsible for communicating with home bridge.
  private service: Service;
  // responsible for communicating with Raspberry Pi GPIO
  private gpioController: GpioController;
  // GPIO Pins raspberry pi
  private readonly buttonPin: number;

  private intervalSinglePress?: ReturnType<typeof setInterval>;
  private counterSinglePress = 0;
  private intervalDoublePress?: ReturnType<typeof setInterval>;
  private counterDoublePress = 0;
  private timeOutLongPress?: ReturnType<typeof setInterval>;
  private counterLongPress = 0;

  constructor(
    private readonly platform: GenericRPIControllerPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.manufacturer ||
        'Default-Manufacturer-Ronny')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model || 'Default-Model-Ronny')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.serialNumber || 'Default-Serial-Ronny')
      .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName || 'nonono');

    // Configure Button Controller
    this.buttonPin = accessory.context.device.buttonPin;

    // get the Button service if it exists, otherwise create a new Button service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.StatelessProgrammableSwitch) ||
      this.accessory.addService(this.platform.Service.StatelessProgrammableSwitch);
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/StatelessProgrammableSwitch

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
      .onGet(this.getButtonState.bind(this));               // GET - bind to the `getOn` method below

    ////////////////////////////////////////////////////////
    // this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent).onGet(((...args) => this.platform.log.info(args as any)) as any);
    this.service.getCharacteristic(this.platform.Characteristic.ProgramMode).onSet(((...args) => this.platform.log.info(args as any)) as any);
    // this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchOutputState).onGet(((...args) => this.platform.log.info(args as any)) as any);
    /////////////////////////////////////////////////////////
    //Configure raspberry pi controller
    this.gpioController = GpioController.Instance(platform.log);
    this.gpioController.exportGPIO(this.buttonPin, 'in', 'both');

    // Watch button press0
    this.gpioController.startWatch(this.buttonPin, (err, value) => {
      if (err) {
        throw err;
      }
      if (value === 1) {
        this.platform.log.info('value is : ' + value);
        this.timeOutLongPress = setTimeout(() => {
          this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent).updateValue(
            this.platform.Characteristic.ProgrammableSwitchEvent.LONG_PRESS);
          this.platform.log.info('Long Press Emitted');
        }, 500);
      } else {
        if (this.timeOutLongPress) {
          clearTimeout(this.timeOutLongPress);
        }
      }

    });
  }

  getButtonState(): CharacteristicValue {
    return this.gpioController.getState(this.buttonPin);
  }

}