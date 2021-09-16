import {PlatformAccessory, Service} from 'homebridge';
import {GpioController} from '../controllers/gpioController';
import {GenericRPIControllerPlatform} from '../platform';

export class Blind{
  // responsible for communicating with home bridge.
  private service: Service;
  // responsible for communicating with Raspberry Pi GPIO
  private gpioController: GpioController;
  // GPIO Pins raspberry pi
  private readonly motorUpPin : number;
  private readonly motorDownPin: number;
  private readonly buttonUpPin: number;
  private readonly buttonDownPin: number;
  // parameters
  private readonly timerToOpen: number; // seconds
  private readonly timerToClose: number;// seconds
  private targetPercentage: number;     // where to goes
  private openPercentage: number;       // 0 full close, 100 full open
  // constructor getting platform and accessory
  constructor(
    private readonly platform: GenericRPIControllerPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    //set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.serialNumber)
      .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    // Configure Blind Controller
    this.motorUpPin = accessory.context.device.motorUpPin;
    this.motorDownPin = accessory.context.device.motorDownPin;
    this.buttonUpPin = accessory.context.device.buttonUpPin;
    this.buttonDownPin = accessory.context.device.buttonDownPin;
    this.timerToOpen = accessory.context.device.timerToOpen || 13;
    this.timerToClose = accessory.context.device.timerToClose || 13;
    this.targetPercentage = 0;
    this.openPercentage = 100;
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
    //set accessory pins on Controller
    this.gpioController = GpioController.Instance(platform.log);
  }

  /**
   * Handle requests to get the current value of the "Current Position" characteristic 0-100
   */
  handleCurrentPositionGet() {
    this.platform.log.debug('Triggered GET CurrentPosition');
    return this.openPercentage;
  }


  /**
   * Handle requests to get the current value of the "Position State" characteristic
   */
  handlePositionStateGet() {
    this.platform.log.debug('Triggered GET PositionState');

    // set this to a valid value for PositionState
    // opening
    if (this.handleTargetPositionGet() > this.handleCurrentPositionGet()) {
      return this.platform.Characteristic.PositionState.INCREASING;
    }
    // Closing
    if (this.handleTargetPositionGet() < this.handleCurrentPositionGet()) {
      return this.platform.Characteristic.PositionState.DECREASING;
    }
    // stopped
    return this.platform.Characteristic.PositionState.STOPPED;
  }


  /**
   * Handle requests to get the current value of the "Target Position" characteristic
   */
  handleTargetPositionGet() {
    this.platform.log.debug('Triggered GET TargetPosition');
    return this.targetPercentage;
  }

  /**
   * Handle requests to set the "Target Position" characteristic
   */
  handleTargetPositionSet(value) {
    this.platform.log.debug('Triggered SET TargetPosition:' + value);
    this.targetPercentage = value;
    this.moveBlind();
  }

  // move blinds to the correct postion
  private moveBlind(){

  }
}