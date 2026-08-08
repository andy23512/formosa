import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  BOPOMOFO_CONSONANTS,
  BOPOMOFO_MEDIALS,
  BOPOMOFO_RHYMES,
} from '../data/bopomofo-symbols';
import { Lesson } from '../models/lesson.models';
import { KeyRecordService } from '../services/key-record.service';
import { pickRandomItem, pickRandomItemNTimes } from '../utils/random.utils';

const QUEUE_SIZE = 20;

interface LessonBuffer {
  consonant: string | null;
  medial: string | null;
  rhyme: string | null;
}

const EMPTY_BUFFER: LessonBuffer = {
  consonant: null,
  medial: null,
  rhyme: null,
};

function assembleBuffer(buffer: LessonBuffer): string {
  return [buffer.consonant, buffer.medial, buffer.rhyme]
    .filter((symbol): symbol is string => symbol !== null)
    .join('');
}

interface LessonState {
  lessonId: string | null;
  components: string[];
  queue: string[];
  history: string[];
  buffer: LessonBuffer;
  lastCorrectKeyTime: number | null;
  keyIntervals: number[];
}

const initialState: LessonState = {
  lessonId: null,
  components: [],
  queue: [],
  history: [' ', ' ', ' '],
  buffer: EMPTY_BUFFER,
  lastCorrectKeyTime: null,
  keyIntervals: [],
};

export const LessonStore = signalStore(
  { protectedState: false }, withDevtools('lesson'),
  withState(initialState),
  withMethods((store, keyRecordService = inject(KeyRecordService)) => ({
    setLesson(lesson: Lesson) {
      patchState(store, () => ({
        lessonId: lesson.id,
        components: lesson.components,
        queue: pickRandomItemNTimes(lesson.components, QUEUE_SIZE),
        history: [' ', ' ', ' '],
        buffer: EMPTY_BUFFER,
        lastCorrectKeyTime: null,
        keyIntervals: [],
      }));
    },
    pauseLesson() {
      patchState(store, (state) => ({
        ...state,
        lastCorrectKeyTime: null,
      }));
    },
    airType() {
      patchState(store, (state) => {
        if (state.lessonId === null) {
          return {};
        }
        const currentKeyTime = Date.now();
        const keyInterval =
          state.lastCorrectKeyTime !== null
            ? currentKeyTime - state.lastCorrectKeyTime
            : null;
        const keyIntervals = [...state.keyIntervals];
        if (keyInterval) {
          keyIntervals.push(keyInterval);
        }
        return {
          queue: [...state.queue.slice(1), pickRandomItem(state.components)],
          history: [...state.history.slice(1), state.queue[0]],
          buffer: EMPTY_BUFFER,
          lastCorrectKeyTime: currentKeyTime,
          keyIntervals: keyIntervals.slice(-10),
        };
      });
    },
    // Each typed symbol replaces whichever slot (聲母/介音/韻母) it belongs
    // to, regardless of typing order — pressing a new consonant always
    // overwrites the previous consonant, etc. A match is checked after
    // every replace by reassembling the filled slots in order.
    type(component: string) {
      patchState(store, (state) => {
        if (state.lessonId === null) {
          return {};
        }
        let buffer: LessonBuffer;
        if (BOPOMOFO_CONSONANTS.includes(component)) {
          buffer = { ...state.buffer, consonant: component };
        } else if (BOPOMOFO_MEDIALS.includes(component)) {
          buffer = { ...state.buffer, medial: component };
        } else if (BOPOMOFO_RHYMES.includes(component)) {
          buffer = { ...state.buffer, rhyme: component };
        } else {
          return {};
        }
        const target = state.queue[0];
        const attempt = assembleBuffer(buffer);
        if (attempt !== target) {
          return { buffer };
        }
        const currentKeyTime = Date.now();
        const keyInterval =
          state.lastCorrectKeyTime !== null
            ? currentKeyTime - state.lastCorrectKeyTime
            : null;
        keyRecordService.pushIntoQueue({
          timestamp: currentKeyTime,
          lessonId: state.lessonId,
          targetKey: target,
          inputKey: attempt,
          isCorrect: true,
          intervalToPreviousCorrectKey: keyInterval,
          cpm: keyInterval ? Math.floor((60 * 1000) / keyInterval) : null,
        });
        const keyIntervals = [...state.keyIntervals];
        if (keyInterval) {
          keyIntervals.push(keyInterval);
        }
        return {
          queue: [...state.queue.slice(1), pickRandomItem(state.components)],
          history: [...state.history.slice(1), target],
          buffer: EMPTY_BUFFER,
          lastCorrectKeyTime: currentKeyTime,
          keyIntervals: keyIntervals.slice(-10),
        };
      });
    },
    // Clears the last populated slot in 聲母 → 介音 → 韻母 order, i.e. 韻母
    // first if present, then 介音, then 聲母.
    backspace() {
      patchState(store, (state) => {
        if (state.lessonId === null) {
          return {};
        }
        if (state.buffer.rhyme !== null) {
          return { buffer: { ...state.buffer, rhyme: null } };
        }
        if (state.buffer.medial !== null) {
          return { buffer: { ...state.buffer, medial: null } };
        }
        if (state.buffer.consonant !== null) {
          return { buffer: { ...state.buffer, consonant: null } };
        }
        return {};
      });
    },
  })),
  withComputed((state) => ({
    bufferText: computed(() => assembleBuffer(state.buffer())),
    cpm: computed(() => {
      const keyIntervals = state.keyIntervals();
      const totalPeriodInMinute =
        keyIntervals.reduce((a, b) => a + b, 0) / 1000 / 60;
      if (totalPeriodInMinute === 0) {
        return 0;
      }
      const characterNumber = keyIntervals.length;
      return Math.floor(characterNumber / totalPeriodInMinute);
    }),
  })),
);
