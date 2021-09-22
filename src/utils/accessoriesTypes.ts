interface AccessoryInterface {
  displayName : string;
  accessory : string;
  type: string;
  manufacturer : string;
  model : string;
  serialNumber : string;
}

interface LightAccessoryType extends AccessoryInterface {
  accessory: 'LightBulb';
  lightPin: number;
  buttonPin: number;
}

interface BlindAccessoryType extends AccessoryInterface {
  accessory: 'WindowCovering';
  motorUpPin: number;
  motorDownPin: number;
  buttonUpPin: number;
  buttonDownPin: number;
  timeToOpen: number;
  timeToClose: number;
}
export type AccessoryType = LightAccessoryType | BlindAccessoryType;