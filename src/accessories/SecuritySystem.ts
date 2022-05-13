import {CommonAccessory} from './commonAccessory';
import {CharacteristicValue, PlatformAccessory} from 'homebridge';
import {GenericRPIControllerPlatform} from '../platform';


export class SecuritySystem extends CommonAccessory {
  // parameters
  private currentState;
  private targetState;
  private alarmType;
  private statusFault;
  private statusTampered;

  constructor(
    platform: GenericRPIControllerPlatform,
    accessory: PlatformAccessory,
  ) {
    // set accessory information
    super(platform, accessory, platform.Service.SecuritySystem);

    // Configure properties
    this.currentState = this.accessory.context.device.currentState;
    this.targetState = this.accessory.context.device.targetState;
    this.alarmType = this.accessory.context.device.alarmType;
    this.statusFault = this.accessory.context.device.statusFault;
    this.statusTampered = this.accessory.context.device.statusTampered;

    // register handlers
    this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState)
      .onGet(this.getCurrentState.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemTargetState)
      .onGet(this.getTargetState.bind(this))
      .onSet(this.setTargetState.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemAlarmType)
      .onGet(this.getAlarmType.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.StatusFault)
      .onGet(this.getStatusFault.bind(this));
    this.service.getCharacteristic(this.platform.Characteristic.StatusTampered)
      .onGet(this.getStatusTampered.bind(this));
  }

  getCurrentState(): CharacteristicValue {
    return this.currentState;
  }

  getTargetState(): CharacteristicValue {
    return this.targetState;
  }

  setTargetState(value) {
    this.targetState = value;
    this.currentState = value;
    this.service.getCharacteristic(this.platform.Characteristic.SecuritySystemCurrentState).updateValue(this.currentState);
    return value;
  }

  getAlarmType(): CharacteristicValue {
    return 0;
  }

  getStatusFault(): CharacteristicValue {
    return this.platform.Characteristic.StatusFault.NO_FAULT;
  }

  getStatusTampered(): CharacteristicValue {
    return this.platform.Characteristic.StatusTampered.NOT_TAMPERED;
  }

  getValues(): Record<string, number | string | boolean> {
    return {
      'currentState': this.currentState,
      'targetState': this.targetState,
      'alarmType': this.alarmType,
      'statusFault': this.statusFault,
      'statusTampered': this.statusTampered,
    };
  }
}