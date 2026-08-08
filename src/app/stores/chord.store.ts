import {
  withDevtools,
  withStorageSync,
} from '@angular-architects/ngrx-toolkit';
import { signalStore } from '@ngrx/signals';
import { withEntities } from '@ngrx/signals/entities';
import { Chord } from '../models/chord.models';
import { prefixStorageKey } from '../utils/store.utils';

export const ChordStore = signalStore(
  { providedIn: 'root', protectedState: false },
  withDevtools('chord'),
  withStorageSync(prefixStorageKey('chord')),
  withEntities<Chord>(),
);
