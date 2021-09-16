import {BinaryValue, Gpio} from 'onoff';
import {Logger} from 'homebridge';

type Direction = 'in' | 'out' | 'high' | 'low';

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

  public initGPIO(_gpio: number, _direction: Direction, _debounceTimeout = 50) {
    if (!(Gpio.accessible)) {
      throw new Error('gpioController error: Gpio not accessible');
    }
    const newGPIo = new Gpio(_gpio, _direction, 'rising', {debounceTimeout: _debounceTimeout});
    if(!newGPIo){
      throw Error('didnt init new gpio correctly');
    }
    this.gpioInUse.push({gpios: newGPIo, id: _gpio});
    this.logger.info("Init for loop:");
    for(let i = 0; i < this.gpioInUse.length; i++) {
      this.logger.info("GPIO: " + i + ", id:" + this.gpioInUse[i].id + ", pin: " + this.gpioInUse[i].gpios);
    }
  }

  public async unexportGpio(): Promise<void> {
    for (const gpio of this.gpioInUse) {
      gpio.gpios.unexport();
    }
  }

  public getState(_pin: number): BinaryValue {
    const result = this.gpioInUse.find(gpioPin => gpioPin.id === _pin);
    if (result) {
      return result.gpios.readSync();
    }
    //TODO: throw Error
    return Gpio.LOW;
  }

  public setState(pin: number): void {
    this.logger.info("-----------------------------------------------");
    this.logger.info("setState for loop:");
    for(let i = 0; i < this.gpioInUse.length; i++) {
      this.logger.info("GPIO: " + i + ", id:" + this.gpioInUse[i].id + ", pin: " + this.gpioInUse[i].gpios);
    }
    this.logger.info("looking for: " + pin);
    const result = this.gpioInUse.find(gpioPin => gpioPin.id === pin);
    this.logger.info("result ---- : " + result);
    if (result) {
      const pinState = this.getState(pin);
      result.gpios.writeSync(pinState === Gpio.LOW ? Gpio.HIGH : Gpio.LOW);
    } else {
      throw new Error('setStat didnt run smoothly');
    }
  }

  public async startWatch(_inputPin: number, cb): Promise<void> {
    const result = this.gpioInUse.find(gpioPin => gpioPin.id === _inputPin);
    if (result) {
      result.gpios.watch(cb);
      // result.gpios.watch((err) => {
      //   if (err) {
      //     throw err;
      //   }
      //   this.setState(_outputPin);
      // });
    } else {
      throw new Error('startWatch didnt run smoothly :  ' + this.gpioInUse);
    }
  }
}