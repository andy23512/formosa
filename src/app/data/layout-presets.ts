import {
  CCLITE_DEFAULT_DEVICE_LAYOUT,
  CHINESE_KEYBOARD_LAYOUTS,
  DeviceLayout,
  KeyboardLayout,
} from 'tangent-cc-lib';
import { TANCHORD_36_V2_DEVICE_LAYOUT } from './tanchord-36-v2-device-layout';

// Not yet exported by the installed tangent-cc-lib version; the CharaChorder
// Lite (67-key) vs 3D input device (90-key) device family a layout targets.
export type LayoutType = 'lite' | '3d';

function findKeyboardLayout(id: string): KeyboardLayout {
  const keyboardLayout = CHINESE_KEYBOARD_LAYOUTS.find(
    (layout) => layout.id === id,
  );
  if (!keyboardLayout) {
    throw new Error(`Unknown keyboard layout id: ${id}`);
  }
  return keyboardLayout;
}

export interface LayoutPreset {
  id: string;
  name: string;
  layoutType: LayoutType;
  deviceLayout: DeviceLayout;
  keyboardLayout: KeyboardLayout;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'standard-bopomofo',
    name: 'layout-setting.standard-bopomofo',
    layoutType: 'lite',
    deviceLayout: CCLITE_DEFAULT_DEVICE_LAYOUT,
    keyboardLayout: findKeyboardLayout('standard-bopomofo'),
  },
  {
    id: 'tanchord-36-v2',
    name: 'layout-setting.tanchord-36-v2',
    layoutType: '3d',
    deviceLayout: TANCHORD_36_V2_DEVICE_LAYOUT,
    keyboardLayout: findKeyboardLayout('tanchord-36-v2'),
  },
];
