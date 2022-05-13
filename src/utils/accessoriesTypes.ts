interface AccessoryInterface {
  displayName: string;
  accessory: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
}

interface LightAccessoryType extends AccessoryInterface {
  accessory: 'LightBulb';
  lightPin: number;
  lightButtonPin: number;
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

interface DoorAccessoryType extends AccessoryInterface {
  accessory: 'Door';
  doorPin: number;
}

interface BoilerAccessoryType extends AccessoryInterface {
  accessory: 'Boiler';
  boilerPin: number;
  boilerButtonPin: number;
}

interface ButtonAccessoryType extends AccessoryInterface {
  accessory: 'Button';
  buttonPin: number;
}

interface OutletAccessoryType extends AccessoryInterface {
  accessory: 'Outlet';
  OutletPin: number;
}

interface SecuritySystemAccessoryType extends AccessoryInterface {
  accessory: 'SecuritySystem';
}

export type AccessoryType = LightAccessoryType | BlindAccessoryType | DoorAccessoryType | BoilerAccessoryType | ButtonAccessoryType
  | OutletAccessoryType | SecuritySystemAccessoryType;