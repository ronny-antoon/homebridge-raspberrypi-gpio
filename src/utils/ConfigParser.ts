import {PlatformConfig} from 'homebridge';
import {AccessoryType} from './accessoriesTypes';

export function getAccessories(config: PlatformConfig): AccessoryType[] {
  return config.accessories;
}