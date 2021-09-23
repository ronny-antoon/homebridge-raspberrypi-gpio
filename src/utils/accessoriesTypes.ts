interface AccessoryInterface {
  displayName : string;
  accessory : string;
  manufacturer : string;
  model : string;
  serialNumber : string;
}

interface LightAccessoryType extends AccessoryInterface {
  accessory: 'LightBulb';
  lightPin: number;
  buttonPin: number;
  onState: 0 | 1;
}

interface BlindAccessoryType extends AccessoryInterface {
  accessory: 'WindowCovering';
  motorUpPin: number;
  motorDownPin: number;
  buttonUpPin: number;
  buttonDownPin: number;
  timeToOpen: number;
  timeToClose: number;
  targetPosition: number;
  currentPosition: number;
}

interface ButtonAccessoryType extends AccessoryInterface{
  accessory: 'StatelessProgrammableSwitch';
  buttonPin: number;
}
export type AccessoryType = LightAccessoryType | BlindAccessoryType| ButtonAccessoryType;