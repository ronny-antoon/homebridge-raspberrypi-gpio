import {BinaryValue, Gpio} from 'onoff';
import {Logger} from 'homebridge';
import {DEBOUNCE_TIMEOUT} from '../configurations/constants';

type Direction = 'in' | 'out';
type Edge = 'none' | 'rising' | 'falling' | 'both';

export class GpioController {
  private static _instance: GpioController;
  private readonly gpioInUse: { gpios: Gpio, id: number }[] = [];
  private logger: Logger;
  constructor(log: Logger) {
    this.logger = log;
  }

  public static Instance(log: Logger): GpioController {
    return this._instance || (this._instance = new this(log));
  }

  public initGPIO(_gpio: number, _direction: Direction, _edge: Edge = 'rising', _debounceTimeout: number = DEBOUNCE_TIMEOUT) {
    if (!(Gpio.accessible)) {
      throw new Error('gpioController error: Gpio not accessible');
    }
    const newGPIo = new Gpio(_gpio, _direction, _edge, {debounceTimeout: _debounceTimeout});
    if(!newGPIo){
      throw Error('didnt init new gpio correctly');
    }
    if(_direction === 'out'){
      newGPIo.writeSync(0);
    }
    this.gpioInUse.push({gpios: newGPIo, id: _gpio});
  }

  public async unexportGpio(): Promise<void> {
    for (const gpio of this.gpioInUse) {
      gpio.gpios.unexport();
    }
  }

  public getState(pinNumber: number): BinaryValue {

    const result = this.gpioInUse.find(gpioPin => gpioPin.id === pinNumber);
    if (result) {
      return result.gpios.readSync();
    }
    throw Error('didnt find this pin gpio:' + pinNumber);
  }

  public setState(pinNumber: number, powerState: BinaryValue): void {
    const result = this.gpioInUse.find(gpioPin => gpioPin.id === pinNumber);
    if (result) {
      result.gpios.writeSync(powerState);
    }else {
      throw new Error('didnt find this pin gpio:' + pinNumber);
    }
  }

  public async startWatch(_inputPin: number, cb): Promise<void> {
    const result = this.gpioInUse.find(gpioPin => gpioPin.id === _inputPin);
    if (result) {
      result.gpios.watch(cb);
    } else {
      throw new Error('startWatch didnt run smoothly :  ' + this.gpioInUse);
    }
  }
}