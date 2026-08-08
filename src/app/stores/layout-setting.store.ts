import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { convertKeyboardLayoutToCharacterKeyCodeMap } from 'tangent-cc-lib';
import { LAYOUT_PRESETS } from '../data/layout-presets';
import { prefixStorageKey } from '../utils/store.utils';

const DEFAULT_PRESET_ID = 'standard-bopomofo';

export const LayoutSettingStore = signalStore(
  { providedIn: 'root', protectedState: false },
  withDevtools('layoutSetting'),
  withStorageSync(prefixStorageKey('layoutSetting')),
  withState({ presetId: DEFAULT_PRESET_ID }),
  withMethods((store) => ({
    setPresetId(presetId: string) {
      patchState(store, () => ({ presetId }));
    },
  })),
  withComputed((state) => ({
    preset: computed(
      () =>
        LAYOUT_PRESETS.find((preset) => preset.id === state.presetId()) ??
        LAYOUT_PRESETS[0],
    ),
  })),
  withComputed((state) => ({
    layoutType: computed(() => state.preset().layoutType),
    deviceLayout: computed(() => state.preset().deviceLayout),
    keyboardLayout: computed(() => state.preset().keyboardLayout),
  })),
  withComputed((state) => ({
    characterKeyCodeMap: computed(() =>
      convertKeyboardLayoutToCharacterKeyCodeMap(state.keyboardLayout()),
    ),
  })),
);
