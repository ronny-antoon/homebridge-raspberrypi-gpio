import {Service, PlatformAccessory, CharacteristicValue} from 'homebridge';

import {GenericRPIControllerPlatform} from '../platform';
import {BinaryValue} from 'onoff';
import {DEFAULT_TIME_TO_STOP_BOILER} from '../configurations/constants';
import {CommonAccessory} from './commonAccessory';


export class Boiler extends CommonAccessory {
  // responsible for communicating with home bridge.
  private service2: Service;
  // GPIO Pins raspberry pi
  private readonly boilerPin: number;
  private readonly boilerButtonPin: number;
  // parameters
  private isActive;
  private inUse;
  private readonly valveType;
  private remainingDuration;
  private durationTime;
  private timer;

  constructor(
    platform: GenericRPIControllerPlatform,
    accessory: PlatformAccessory,
  ) {
    // set accessory information
    super(platform, accessory, platform.Service.Valve);

    // Configure properties Accessory
    this.boilerPin = this.accessory.context.device.boilerPin;
    this.boilerButtonPin = this.accessory.context.device.boilerButtonPin;
    this.isActive = this.platform.Characteristic.Active.INACTIVE;
    this.inUse = this.platform.Characteristic.InUse.NOT_IN_USE;
    this.valveType = this.platform.Characteristic.ValveType.SHOWER_HEAD;
    this.remainingDuration = 0;
    this.durationTime = this.accessory.context.device.durationTime || DEFAULT_TIME_TO_STOP_BOILER;

    //Configure raspberry pi controller
    this.gpioController.exportGPIO(this.boilerPin, 'out');
    this.gpioController.exportGPIO(this.boilerButtonPin, 'in', 'rising', 100);

    // get the Valve service if it exists, otherwise create a new Valve service
    // you can create multiple services for each accessory
    this.service2 = this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Valve

    this.service2.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setValveState.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getValveState.bind(this));               // GET - bind to the `getOn` method below


    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setValveState.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getValveState.bind(this));               // GET - bind to the `getOn` method below

    this.service.getCharacteristic(this.platform.Characteristic.InUse)
      .onSet(this.setValveState.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getValveState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ValveType)
      .onGet(this.getValveType.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.RemainingDuration)
      .onGet(this.getRemainingDuration.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.SetDuration)
      .onSet(this.setDurationTime.bind(this))// SET - bind to the `setOn` method below
      .onGet(this.getDurationTime.bind(this))
      .setProps({minValue: 600, maxValue: 3600, minStep: 600, validValueRanges: [600, 3600]});

    // Watch button press
    this.gpioController.startWatch(this.boilerButtonPin, (err, value) => {
      if (err) {
        throw err;
      }
      if (value) {
        const currentStatus = this.getValveState();
        const newStatus = currentStatus === 0 ? 1 : 0;
        this.setValveState(newStatus);
      }
    });
    this.setValveState(0);
  }

  private setValveState(value: CharacteristicValue): CharacteristicValue | void {
    let newState: BinaryValue;
    if (value) {
      newState = 1;
    } else {
      newState = 0;
      if (this.timer) {
        clearInterval(this.timer);
      }
    }
    this.gpioController.setState(this.boilerPin, newState);
    this.isActive = newState;
    this.inUse = newState;

    this.service.getCharacteristic(this.platform.Characteristic.Active).updateValue(newState);
    this.service2.getCharacteristic(this.platform.Characteristic.On).updateValue(newState);
    this.service.getCharacteristic(this.platform.Characteristic.InUse).updateValue(newState);
    this.service.getCharacteristic(this.platform.Characteristic.RemainingDuration).updateValue(this.remainingDuration);
    this.updateCacheDevice();

    if (value) {
      if (this.timer) {
        clearInterval(this.timer);
      }
      this.remainingDuration = this.getDurationTime();
      this.timer = setInterval(() => {
        if (this.remainingDuration <= 0) {
          this.remainingDuration = 0;
          clearInterval(this.timer);
          this.setValveState(0);
          return;
        }
        this.remainingDuration--;
        this.service.getCharacteristic(this.platform.Characteristic.RemainingDuration).updateValue(this.remainingDuration);
      }, 1000);
    }
    return newState;
  }

  private getValveState(): CharacteristicValue {
    return this.isActive;
  }

  private getValveType(): CharacteristicValue {
    return this.valveType;
  }

  private getRemainingDuration(): CharacteristicValue {
    return (this.remainingDuration);
  }

  private setDurationTime(value: CharacteristicValue): CharacteristicValue {
    this.durationTime = value;
    this.service.getCharacteristic(this.platform.Characteristic.SetDuration).updateValue(this.durationTime);
    this.updateCacheDevice();
    return this.durationTime;
  }

  private getDurationTime(): CharacteristicValue {
    return this.durationTime;
  }

  getValues(): Record<string, number | string | boolean> {
    return {
      'durationTime': this.durationTime,
    };
  }

}