import {PlatformAccessory, Service} from 'homebridge';
import {GpioController} from '../controllers/gpioController';
import {GenericRPIControllerPlatform} from '../platform';
import {
  DEFAULT_CURRENT_PERCENTAGE_BLIND, DEFAULT_TARGET_PERCENTAGE_BLIND,
  DEFAULT_TIME_TO_CLOSE_BLIND,
  DEFAULT_TIME_TO_OPEN_BLIND,
  INTERVAL_BLIND,
} from '../configurations/constants';

export class Blind {
  // responsible for communicating with home bridge.
  private service: Service;
  // responsible for communicating with Raspberry Pi GPIO
  private gpioController: GpioController;
  // GPIO Pins raspberry pi
  private readonly motorUpPin: number;
  private readonly motorDownPin: number;
  private readonly buttonUpPin: number;
  private readonly buttonDownPin: number;
  // parameters
  private readonly timeToOpen: number; // seconds
  private readonly timeToClose: number;// seconds
  private targetPercentage: number;     // where to goes
  private intervalMoving?: ReturnType<typeof setInterval>;

  // constructor getting platform and accessory
  constructor(
    private readonly platform: GenericRPIControllerPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    //set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.manufacturer || 'nonono')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model || 'nonono')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.serialNumber || 'nonono')
      .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName || 'nonono');

    // Configure Blind Controller
    this.motorUpPin = accessory.context.device.motorUpPin;
    this.motorDownPin = accessory.context.device.motorDownPin;
    this.buttonUpPin = accessory.context.device.buttonUpPin;
    this.buttonDownPin = accessory.context.device.buttonDownPin;
    this.timeToOpen = accessory.context.device.timeToOpen || DEFAULT_TIME_TO_OPEN_BLIND;
    this.timeToClose = accessory.context.device.timeToClose || DEFAULT_TIME_TO_CLOSE_BLIND;
    this.targetPercentage = accessory.context.device.currentPosition || DEFAULT_TARGET_PERCENTAGE_BLIND;
    this.setCurrentPercentage(accessory.context.device.currentPosition || DEFAULT_CURRENT_PERCENTAGE_BLIND);

    // get the Blinds( window covering service if it exists, otherwise create a new window Covering service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(
      this.platform.Service.WindowCovering) || this.accessory.addService(this.platform.Service.WindowCovering);
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/WindowCovering

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.handleCurrentPositionGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(this.handlePositionStateGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(this.handleTargetPositionGet.bind(this))
      .onSet(this.handleTargetPositionSet.bind(this));

    //Configure raspberry pi controller
    this.gpioController = GpioController.Instance(platform.log);
    this.gpioController.exportGPIO(this.motorUpPin, 'out');
    this.gpioController.exportGPIO(this.motorDownPin, 'out');
    this.gpioController.exportGPIO(this.buttonUpPin, 'in', 'both');
    this.gpioController.exportGPIO(this.buttonDownPin, 'in', 'both');

    // Watch button press
    let lasttrig1 = 0;
    let lasttrig2 = 0;
    this.gpioController.startWatch(this.buttonUpPin, (err, value) => {
      if (err) {
        throw err;
      }
      if (value === 1) {
        lasttrig1 = 1;
        this.handleTargetPositionSet(100);
      }
      if (value === 0 && lasttrig1 === 1) {
        lasttrig1 = 0;
        this.handleTargetPositionSet(this.getCurrentPercentage());
      }
    });

    this.gpioController.startWatch(this.buttonDownPin, (err, value) => {
      if (err) {
        throw err;
      }
      if (value === 1) {
        lasttrig2 = 1;
        this.handleTargetPositionSet(0);
      }
      if (value === 0 && lasttrig2 === 1) {
        lasttrig2 = 0;
        this.handleTargetPositionSet(this.getCurrentPercentage());
      }
    });

    // init position and set state
    this.moveBlind();
  }

  /**
   * Handle requests to get the current value of the "Current Position" characteristic 0-100
   */
  handleCurrentPositionGet() {
    //this.platform.log.info('Triggered GET CurrentPosition: ' + this.currentPercentage);
    return this.getCurrentPercentage();
  }


  /**
   * Handle requests to get the current value of the "Position State" characteristic
   */
  handlePositionStateGet() {
    let state = this.platform.Characteristic.PositionState.STOPPED;
    // set this to a valid value for PositionState
    // opening
    if (this.handleTargetPositionGet() > this.handleCurrentPositionGet()) {
      state = this.platform.Characteristic.PositionState.INCREASING;
    }
    // Closing
    if (this.handleTargetPositionGet() < this.handleCurrentPositionGet()) {
      state = this.platform.Characteristic.PositionState.DECREASING;
    }
    // stopped
    //this.platform.log.info('Triggered GET PositionState: ' + state);
    return state;
  }


  /**
   * Handle requests to get the current value of the "Target Position" characteristic
   */
  handleTargetPositionGet() {
    //this.platform.log.info('Triggered GET TargetPosition: ' + this.targetPercentage);
    return this.targetPercentage;
  }

  /**
   * Handle requests to set the "Target Position" characteristic
   */
  handleTargetPositionSet(target) {
    //this.platform.log.info('Triggered SET TargetPosition:' + target);
    if (this.handlePositionStateGet() !== this.platform.Characteristic.PositionState.STOPPED) {
      this.gpioController.setState(this.motorUpPin, 0);
      this.gpioController.setState(this.motorDownPin, 0);
      if (this.intervalMoving !== undefined) {
        clearInterval(this.intervalMoving);
      }
    }
    this.targetPercentage = target;
    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition).updateValue(this.handleTargetPositionGet());
    this.service.getCharacteristic(this.platform.Characteristic.PositionState).updateValue(this.handlePositionStateGet());
    this.moveBlind();
  }

  // move blinds to the correct position
  private moveBlind() {
    //this.platform.log.info('Triggered moveBlind:');
    let tickerPercentage: number;
    let direction = this.platform.Characteristic.PositionState.STOPPED;
    // check directions and turn on
    if (this.handlePositionStateGet() === this.platform.Characteristic.PositionState.INCREASING) {
      this.gpioController.setState(this.motorUpPin, 1);
      direction = this.platform.Characteristic.PositionState.INCREASING;
      tickerPercentage = (INTERVAL_BLIND / 1000) / this.timeToOpen;
    } else {
      if (this.handlePositionStateGet() === this.platform.Characteristic.PositionState.DECREASING) {
        this.gpioController.setState(this.motorDownPin, 1);
        direction = this.platform.Characteristic.PositionState.DECREASING;
        tickerPercentage = ((INTERVAL_BLIND / 1000) / this.timeToClose) * -1;
      } else {
        this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).updateValue(this.handleCurrentPositionGet());
        this.service.getCharacteristic(this.platform.Characteristic.PositionState).updateValue(this.handlePositionStateGet());
        return;
      }
    }

    // Update position every IntervalTime
    this.intervalMoving = setInterval(() => {
      this.setCurrentPercentage(this.getCurrentPercentage() + (tickerPercentage * 100));

      this.setCurrentPercentage(Math.max(0, this.getCurrentPercentage()));
      this.setCurrentPercentage(Math.min(100, this.getCurrentPercentage()));
      // check if the blind achieves the target
      if (this.handlePositionStateGet() !== direction) {
        // stop motor and clear interval
        this.gpioController.setState(this.motorUpPin, 0);
        this.gpioController.setState(this.motorDownPin, 0);
        this.setCurrentPercentage(this.targetPercentage);
        clearInterval(this.intervalMoving!);
        this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).updateValue(this.handleCurrentPositionGet());
        this.service.getCharacteristic(this.platform.Characteristic.PositionState).updateValue(this.handlePositionStateGet());
      }
    }, INTERVAL_BLIND);
  }

  private getCurrentPercentage(): number{
    return this.accessory.context.device.currentPosition;
  }

  private setCurrentPercentage(value: number): number | void{
    return this.accessory.context.device.currentPosition = value;
  }
}