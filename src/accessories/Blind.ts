import {PlatformAccessory} from 'homebridge';
import {GenericRPIControllerPlatform} from '../platform';
import {
  DEFAULT_CURRENT_PERCENTAGE_BLIND, DEFAULT_TARGET_PERCENTAGE_BLIND,
  DEFAULT_TIME_TO_CLOSE_BLIND,
  DEFAULT_TIME_TO_OPEN_BLIND,
  INTERVAL_BLIND,
} from '../configurations/constants';
import {CommonAccessory} from './commonAccessory';

export class Blind extends CommonAccessory {


  // GPIO Pins raspberry pi
  private readonly motorUpPin: number;
  private readonly motorDownPin: number;
  private readonly buttonUpPin: number;
  private readonly buttonDownPin: number;
  // parameters
  private readonly timeToOpen: number; // seconds
  private readonly timeToClose: number;// seconds
  private targetPercentage: number;     // where to goes
  private currentPercentage: number;     // current position
  private intervalMoving?: ReturnType<typeof setInterval>;

  constructor(
    platform: GenericRPIControllerPlatform,
    accessory: PlatformAccessory,
  ) {
    //set accessory information
    super(platform, accessory, platform.Service.WindowCovering);

    // Configure properties Accessory
    this.motorUpPin = this.accessory.context.device.motorUpPin;
    this.motorDownPin = this.accessory.context.device.motorDownPin;
    this.buttonUpPin = this.accessory.context.device.buttonUpPin;
    this.buttonDownPin = this.accessory.context.device.buttonDownPin;
    this.timeToOpen = this.accessory.context.device.timeToOpen || DEFAULT_TIME_TO_OPEN_BLIND;
    this.timeToClose = this.accessory.context.device.timeToClose || DEFAULT_TIME_TO_CLOSE_BLIND;
    this.targetPercentage = this.accessory.context.device.targetPercentage || DEFAULT_TARGET_PERCENTAGE_BLIND;
    this.currentPercentage = this.accessory.context.device.currentPercentage ?? DEFAULT_CURRENT_PERCENTAGE_BLIND;
    this.updateCacheDevice();

    //Configure raspberry pi controller
    this.gpioController.exportGPIO(this.motorUpPin, 'out');
    this.gpioController.exportGPIO(this.motorDownPin, 'out');
    this.gpioController.exportGPIO(this.buttonUpPin, 'in', 'both');
    this.gpioController.exportGPIO(this.buttonDownPin, 'in', 'both');

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet((): number => {
        return this.currentPercentage;
      });

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(this.getPositionState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet((): number => {
        return this.targetPercentage;
      })
      .onSet(this.setTargetPosition.bind(this));

    // Watch button press
    let lasttrig1 = 0;
    let lasttrig2 = 0;
    this.gpioController.startWatch(this.buttonUpPin, (err, value) => {
      if (err) {
        throw err;
      }
      if (value === 1) {
        lasttrig1 = 1;
        this.setTargetPosition(100);
      }
      if (value === 0 && lasttrig1 === 1) {
        lasttrig1 = 0;
        this.setTargetPosition(this.currentPercentage);
      }
    });

    this.gpioController.startWatch(this.buttonDownPin, (err, value) => {
      if (err) {
        throw err;
      }
      if (value === 1) {
        lasttrig2 = 1;
        this.setTargetPosition(0);
      }
      if (value === 0 && lasttrig2 === 1) {
        lasttrig2 = 0;
        this.setTargetPosition(this.currentPercentage);
      }
    });

    // init position and set state
    this.moveBlind();
  }


  /**
   * Handle requests to get the current value of the "Position State" characteristic
   */
  getPositionState() {
    let state = this.platform.Characteristic.PositionState.STOPPED;
    // set this to a valid value for PositionState
    // opening
    if (this.targetPercentage > this.currentPercentage) {
      state = this.platform.Characteristic.PositionState.INCREASING;
    }
    // Closing
    if (this.targetPercentage < this.currentPercentage) {
      state = this.platform.Characteristic.PositionState.DECREASING;
    }
    // stopped
    return state;
  }

  /**
   * Handle requests to set the "Target Position" characteristic
   */
  setTargetPosition(target) {
    //this.platform.log.info('Triggered SET TargetPosition:' + target);
    if (this.getPositionState() !== this.platform.Characteristic.PositionState.STOPPED) {
      this.gpioController.setState(this.motorUpPin, 0);
      this.gpioController.setState(this.motorDownPin, 0);
      if (this.intervalMoving !== undefined) {
        clearInterval(this.intervalMoving);
      }
    }
    this.targetPercentage = target;
    this.updateCacheDevice();
    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition).updateValue(this.targetPercentage);
    this.service.getCharacteristic(this.platform.Characteristic.PositionState).updateValue(this.getPositionState());
    this.moveBlind();
  }

  // move blinds to the correct position
  private moveBlind() {
    //this.platform.log.info('Triggered moveBlind:');
    let tickerPercentage: number;
    let direction = this.platform.Characteristic.PositionState.STOPPED;
    // check directions and turn on
    if (this.getPositionState() === this.platform.Characteristic.PositionState.INCREASING) {
      this.gpioController.setState(this.motorUpPin, 1);
      direction = this.platform.Characteristic.PositionState.INCREASING;
      tickerPercentage = (INTERVAL_BLIND / 1000) / this.timeToOpen;
    } else {
      if (this.getPositionState() === this.platform.Characteristic.PositionState.DECREASING) {
        this.gpioController.setState(this.motorDownPin, 1);
        direction = this.platform.Characteristic.PositionState.DECREASING;
        tickerPercentage = ((INTERVAL_BLIND / 1000) / this.timeToClose) * -1;
      } else {
        this.updateCacheDevice();
        this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).updateValue(this.currentPercentage);
        this.service.getCharacteristic(this.platform.Characteristic.PositionState).updateValue(this.getPositionState());
        return;
      }
    }

    // Update position every IntervalTime
    this.intervalMoving = setInterval(() => {
      this.currentPercentage = (this.currentPercentage + (tickerPercentage * 100));

      this.currentPercentage = (Math.max(0, this.currentPercentage));
      this.currentPercentage = (Math.min(100, this.currentPercentage));
      // check if the blind achieves the target
      if (this.getPositionState() !== direction) {
        // stop motor and clear interval
        this.gpioController.setState(this.motorUpPin, 0);
        this.gpioController.setState(this.motorDownPin, 0);
        this.currentPercentage = (this.targetPercentage);
        clearInterval(this.intervalMoving!);
        this.updateCacheDevice();
        this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition).updateValue(this.currentPercentage);
        this.service.getCharacteristic(this.platform.Characteristic.PositionState).updateValue(this.getPositionState());
      }
    }, INTERVAL_BLIND);
  }

  getValues(): Record<string, number | string | boolean> {
    return {
      'targetPercentage': this.targetPercentage,
      'currentPercentage': this.currentPercentage,
    };
  }
}