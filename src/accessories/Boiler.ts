import {Service, PlatformAccessory, CharacteristicValue, Characteristic} from 'homebridge';

import { GenericRPIControllerPlatform } from '../platform';
import {GpioController} from '../controllers/gpioController';
import {BinaryValue} from 'onoff';
import {DEFAULT_TIME_TO_STOP_BOILER} from '../configurations/constants';


export class Boiler {
  // responsible for communicating with home bridge.
  private service: Service;
  // responsible for communicating with Raspberry Pi GPIO
  private gpioController: GpioController;
  // GPIO Pins raspberry pi
  private readonly boilerPin: number;

  private readonly boilerButtonPin: number;

  private isActive;

  private inUse;

  private readonly valveType;

  private isConfigured;

  private readonly name;

  private remainingDuration;

  private readonly serviceLabelIndex;

  private durationTime;

  private timer;

  constructor(
    private readonly platform: GenericRPIControllerPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, accessory.context.device.manufacturer || 'Default-Manufacturer-Ronny')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.model || 'Default-Model-Ronny')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.serialNumber || 'Default-Serial-Ronny')
      .setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName || 'nonono');

    // Configure Boiler Controller
    this.boilerPin = accessory.context.device.boilerPin;
    this.boilerButtonPin = accessory.context.device.boilerButtonPin;
    this.isActive = this.platform.Characteristic.Active.INACTIVE;
    this.inUse = this.platform.Characteristic.InUse.NOT_IN_USE;
    this.valveType = this.platform.Characteristic.ValveType.SHOWER_HEAD;
    this.isConfigured = this.platform.Characteristic.IsConfigured.CONFIGURED;
    this.name = accessory.context.device.displayName || 'No name';
    this.remainingDuration = 20;
    this.serviceLabelIndex = 1;
    this.durationTime = DEFAULT_TIME_TO_STOP_BOILER;
    this.updateCachedDevice();

    //Configure raspberry pi controller
    this.gpioController = GpioController.Instance(platform.log);
    this.gpioController.exportGPIO(this.boilerPin, 'out');
    this.gpioController.exportGPIO(this.boilerButtonPin, 'in', 'both');

    // get the Valve service if it exists, otherwise create a new Valve service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Valve) || this.accessory.addService(this.platform.Service.Valve);
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Valve

    // register handlers for required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.setValveState.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getValveState.bind(this));               // GET - bind to the `getOn` method below

    this.service.getCharacteristic(this.platform.Characteristic.InUse)
      .onSet(this.setValveState.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getValveState.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ValveType)
      .onGet(this.getValveType.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.IsConfigured)
      .onSet(this.setIsConfigured.bind(this))             // SET - bind to the `setOn` method below
      .onGet(this.getIsConfigured.bind(this));

    // this.service.getCharacteristic(this.platform.Characteristic.Name)
    //   .onGet(this.getName.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.RemainingDuration)
      .onGet(this.getRemainingDuration.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.ServiceLabelIndex)
      .onGet(this.getServiceLabelIndex.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.SetDuration)
      .onSet(this.setDurationTime.bind(this))// SET - bind to the `setOn` method below
      .onGet(this.getDurationTime.bind(this))
      .setProps({minValue: 1200, maxValue: 5400, minStep: 600});

    // this.service.getCharacteristic(this.platform.Characteristic.StatusFault)
    //   .onGet(this.getStatusFault.bind(this));

    // Watch button press
    this.gpioController.startWatch(this.boilerButtonPin, (err) => {
      if (err) {
        throw err;
      }
      const currentStatus = this.getValveState();
      const newStatus = currentStatus === 0 ? 1 : 0;
      this.setValveState(newStatus);
    });

    this.setValveState(0);
  }

  private updateCachedDevice(): void{
    this.accessory.context.device.boilerPin = this.boilerPin;
    this.accessory.context.device.boilerButtonPin = this.boilerButtonPin;
    this.accessory.context.device.isActive = this.isActive;
    this.accessory.context.device.inUse = this.inUse;
    this.accessory.context.device.valveType = this.valveType;
    this.accessory.context.device.isConfigured = this.isConfigured;
    this.accessory.context.device.name = this.name;
    this.accessory.context.device.remainingDuration = this.remainingDuration;
    this.accessory.context.device.serviceLabelIndex = this.serviceLabelIndex;
    this.accessory.context.device.durationTime = this.durationTime;
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */

  private setValveState(value: CharacteristicValue) : CharacteristicValue | void{
    let newState: BinaryValue;
    if (value) {
      newState = 1;
    }else {
      newState = 0;
      if(this.timer){
        clearInterval(this.timer);
      }
    }
    this.gpioController.setState(this.boilerPin, newState);
    this.isActive = newState;
    this.inUse = newState;

    this.service.getCharacteristic(this.platform.Characteristic.Active).updateValue(newState);
    this.service.getCharacteristic(this.platform.Characteristic.InUse).updateValue(newState);
    if(value){
      if(this.timer){
        clearInterval(this.timer);
      }
      this.remainingDuration = this.getDurationTime();
      this.timer = setInterval(()=>{
        if(this.remainingDuration <= 0) {
          this.remainingDuration = 0;
          clearInterval(this.timer);
          this.setValveState(0);
          return;
        }
        this.remainingDuration--;
        this.service.getCharacteristic(this.platform.Characteristic.RemainingDuration).updateValue(this.remainingDuration);
      }, 1000);
    }
    // eslint-disable-next-line no-console
    console.log('SET valve state :   ', value);
    return newState;
  }

  private getValveState(): CharacteristicValue{
    // eslint-disable-next-line no-console
    console.log('get valve state : ', this.gpioController.getState(this.boilerPin));
    return this.gpioController.getState(this.boilerPin);
  }

  private getValveType(): CharacteristicValue{
    // eslint-disable-next-line no-console
    console.log('get valve type : ', this.valveType);
    return this.valveType;
  }

  private getIsConfigured() : CharacteristicValue{
    return this.isConfigured;
  }

  private setIsConfigured(value : CharacteristicValue) : CharacteristicValue{
    this.isConfigured = value;
    this.service.getCharacteristic(this.platform.Characteristic.IsConfigured).updateValue(this.isConfigured);
    return this.isConfigured;
  }

  // private getName(): CharacteristicValue{
  //   return this.name;
  // }

  private getRemainingDuration(): CharacteristicValue{
    // eslint-disable-next-line no-console
    console.log('get remaining duration time : ', this.remainingDuration);
    return (this.remainingDuration);
  }

  private getServiceLabelIndex(): CharacteristicValue{
    return this.serviceLabelIndex;
  }

  private setDurationTime(value : CharacteristicValue) : CharacteristicValue{
    this.durationTime = value;
    this.service.getCharacteristic(this.platform.Characteristic.SetDuration).updateValue(this.durationTime);
    // eslint-disable-next-line no-console
    console.log('SET duration time : ', this.durationTime);
    return this.durationTime;
  }

  private getDurationTime(): CharacteristicValue{
    // eslint-disable-next-line no-console
    console.log('get duration time : ', this.durationTime);
    return this.durationTime;
  }

  // private getStatusFault(): CharacteristicValue{
  //   return 0;
  // }
}