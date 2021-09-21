interface AccessoryInterface {
  displayName : string;
  accessory : string;
  type: string;
  manufacturer : string;
  model : string;
  serialNumber : string;
}

interface LightAccessoryType extends AccessoryInterface {
  accessory: 'Light';
  type: 'LightBulb';
  manufacturer : 'Ronny-Lights';
  model : 'LightsInputOutput';
  serialNumber : string;
  lightPin: number;
  buttonPin: number;
}

interface BlindAccessoryType extends AccessoryInterface {
  accessory: 'Blind';
  type: 'WindowCovering';
  manufacturer : 'Ronny-Blind';
  model : 'BlindsInputOutput';
  serialNumber : string;
  motorUpPin: number;
  motorDownPin: number;
  buttonUpPin: number;
  buttonDownPin: number;
  timeToOpen: number;
  timeToClose: number;
}
export type AccessoryType = LightAccessoryType | BlindAccessoryType;