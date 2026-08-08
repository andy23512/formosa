import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  OnDestroy,
  OnInit,
  Signal,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { Router, RouterLinkWithHref } from '@angular/router';
import { HotkeysService } from '@ngneat/hotkeys';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LetDirective } from '@ngrx/component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { liveQuery } from 'dexie';
import { interval } from 'rxjs';
import { LayoutComponent } from 'src/app/components/layout/layout.component';
import { LiteLayoutComponent } from 'src/app/components/lite-layout/lite-layout.component';
import { SpeedometerComponent } from 'src/app/components/speedometer/speedometer.component';
import { db } from 'src/app/db';
import { VisibleDirective } from 'src/app/directives/visible.directive';
import { ResolvedLesson } from 'src/app/models/lesson.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { AirModeSettingStore } from 'src/app/stores/air-mode-setting.store';
import { LayoutSettingStore } from 'src/app/stores/layout-setting.store';
import { LessonStore } from 'src/app/stores/lesson.store';
import { VisibilitySettingStore } from 'src/app/stores/visibility-setting.store';
import {
  TANCHORD_36_CONSONANT_PAIRS,
  TANCHORD_36_RHYME_PAIRS,
} from 'src/app/utils/tanchord-36.utils';
import {
  ALT_GRAPH_KEY_LABEL,
  CharacterKeyCode,
  CharacterKeyCodeMap,
  FLAG_SHIFT_KEY_LABEL,
  FN_SHIFT_KEY_LABEL,
  HighlightKeyCombination,
  HighlightSetting,
  KeyLabel,
  KeyLabelType,
  Layer,
  NUM_SHIFT_KEY_LABEL,
  SHIFT_KEY_LABEL,
  WSKCode,
  getCharacterActionCodesFromCharacterKeyCode,
  getHighlightKeyCombinationFromKeyCombinations,
  getKeyCombinationsFromActionCodes,
  getLayerShiftPositionCodeMap,
  getModifierKeyPositionCodeMap,
  nonNullable,
} from 'tangent-cc-lib';

// Fixed tendency for picking among equally-valid key combinations when
// highlighting a target (e.g. both-side Shift layer characters), now that
// the Layout Highlight setting panel has been removed.
const HIGHLIGHT_SETTING: HighlightSetting = {
  shiftLayer: {
    preferSides: 'both',
    preferShiftSide: 'left',
  },
  numShiftLayer: {
    preferSides: 'both',
    preferNumShiftSide: 'left',
  },
  shiftAndNumShiftLayer: {
    preferShiftSide: 'right',
    preferCharacterKeySide: 'right',
  },
  fnShiftLayer: {
    preferSides: 'both',
    preferFnShiftSide: 'left',
  },
  shiftAndFnShiftLayer: {
    preferShiftSide: 'right',
    preferCharacterKeySide: 'right',
  },
  flagShiftLayer: {
    preferSides: 'both',
    preferFlagShiftSide: 'left',
  },
  shiftAndFlagShiftLayer: {
    preferShiftSide: 'right',
    preferCharacterKeySide: 'right',
  },
};

// TanChord 36's 5 ambiguous keys are indexed in the OS keyboard layout by
// their combined pair string (e.g. "ㄍㄐ"), not by the individual symbols —
// so looking up where to find "ㄍ" falls back to whichever pair contains it.
const TANCHORD_36_PAIRS = [
  ...TANCHORD_36_CONSONANT_PAIRS,
  ...TANCHORD_36_RHYME_PAIRS,
];
function lookupCharacterKeyCodes(
  symbol: string,
  characterKeyCodeMap: CharacterKeyCodeMap,
): CharacterKeyCode[] | undefined {
  const direct = characterKeyCodeMap.get(symbol);
  if (direct && direct.length > 0) {
    return direct;
  }
  const pair = TANCHORD_36_PAIRS.find((p) => p.includes(symbol));
  return pair ? characterKeyCodeMap.get(pair) : undefined;
}

@UntilDestroy()
@Component({
  selector: 'app-lesson-page',
  standalone: true,
  imports: [
    LayoutComponent,
    LiteLayoutComponent,
    LetDirective,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTooltip,
    RouterLinkWithHref,
    SpeedometerComponent,
    VisibleDirective,
    IconGuardPipe,
    TranslatePipe,
    RealTitleCasePipe,
  ],
  templateUrl: './lesson-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LessonStore],
})
export class LessonPageComponent implements OnInit, OnDestroy {
  readonly lesson = input.required<ResolvedLesson>();

  readonly visibilitySettingStore = inject(VisibilitySettingStore);
  readonly airModeSettingStore = inject(AirModeSettingStore);
  readonly translateService = inject(TranslateService);

  readonly isFocus = signal(false);

  @HostBinding('class') classes = 'flex flex-col gap-2 h-full relative';

  readonly shortcuts = {
    goToPreviousLesson: 'meta.left',
    goToNextLesson: 'meta.right',
    startLesson: 'space',
    pauseLesson: 'escape',
  };

  @ViewChild('input', { static: true })
  public input!: ElementRef<HTMLInputElement>;

  readonly layoutSettingStore = inject(LayoutSettingStore);
  readonly characterKeyCodeMap = this.layoutSettingStore.characterKeyCodeMap;
  readonly keyboardLayout = this.layoutSettingStore.keyboardLayout;
  readonly deviceLayout = this.layoutSettingStore.deviceLayout;
  readonly layoutType = this.layoutSettingStore.layoutType;

  // Every distinct Bopomofo symbol used anywhere in the lesson (each lesson
  // component is a full chord string, e.g. "ㄉㄨㄛ", not a single symbol).
  readonly lessonSymbols = computed(() => {
    const lesson = this.lesson();
    const symbols = new Set<string>();
    lesson?.components.forEach((component) => {
      for (const symbol of component) {
        symbols.add(symbol);
      }
    });
    return Array.from(symbols);
  });

  readonly lessonCharactersDevicePositionCodes = computed(() => {
    const symbols = this.lessonSymbols();
    const characterKeyCodeMap = this.characterKeyCodeMap();
    const deviceLayout = this.deviceLayout();
    return symbols
      .map((c) => {
        const characterKeyCodes = lookupCharacterKeyCodes(
          c,
          characterKeyCodeMap,
        );
        if (!characterKeyCodes || characterKeyCodes.length === 0) {
          return null;
        }
        for (const characterKeyCode of characterKeyCodes) {
          const actionCodes =
            getCharacterActionCodesFromCharacterKeyCode(characterKeyCode);
          if (actionCodes.length === 0) {
            continue;
          }
          const keyCombinations = getKeyCombinationsFromActionCodes(
            actionCodes,
            deviceLayout,
          );
          if (!keyCombinations || keyCombinations.length === 0) {
            continue;
          }
          return {
            c,
            characterDeviceKeys: keyCombinations,
          };
        }
        return null;
      })
      .filter(nonNullable);
  });
  readonly layerShiftKeyPositionMap = computed(() => {
    const deviceLayout = this.deviceLayout();
    if (!deviceLayout) {
      return null;
    }
    return getLayerShiftPositionCodeMap(deviceLayout);
  });
  readonly modifierKeyPositionCodeMap = computed(() => {
    const deviceLayout = this.deviceLayout();
    if (!deviceLayout) {
      return null;
    }
    return getModifierKeyPositionCodeMap(deviceLayout);
  });
  readonly keyLabelMap = computed(() => {
    const lessonCharactersDevicePositionCodes =
      this.lessonCharactersDevicePositionCodes();
    if (!lessonCharactersDevicePositionCodes) {
      return {};
    }
    const modifierKeyPositionCodeMap = this.modifierKeyPositionCodeMap();
    const layerShiftKeyPositionCodeMap = this.layerShiftKeyPositionMap();
    if (!modifierKeyPositionCodeMap || !layerShiftKeyPositionCodeMap) {
      return {};
    }
    const keyLabelMap: Record<number, KeyLabel[]> = {};
    let addShiftLabel = false;
    let addNumShiftLabel = false;
    let addFnShiftLabel = false;
    let addFlagShiftLabel = false;
    let addAltGraphLabel = false;
    lessonCharactersDevicePositionCodes.forEach((v) => {
      v?.characterDeviceKeys?.forEach(
        ({ characterKeyPositionCode, layer, shiftKey, altGraphKey }) => {
          const d = {
            type: KeyLabelType.String as const,
            c: v.c,
            title: this.translateService.instant('general.character-tooltip', {
              character: v.c,
            }),
            layer,
            shiftKey,
            altGraphKey,
          };
          if (!keyLabelMap[characterKeyPositionCode]) {
            keyLabelMap[characterKeyPositionCode] = [d];
          } else {
            keyLabelMap[characterKeyPositionCode].push(d);
          }
          if (shiftKey && !addShiftLabel) {
            addShiftLabel = true;
          }
          if (layer === Layer.Secondary && !addNumShiftLabel) {
            addNumShiftLabel = true;
          }
          if (layer === Layer.Tertiary && !addFnShiftLabel) {
            addFnShiftLabel = true;
          }
          if (layer === Layer.Quaternary && !addFlagShiftLabel) {
            addFlagShiftLabel = true;
          }
          if (altGraphKey && !addAltGraphLabel) {
            addAltGraphLabel = true;
          }
        },
      );
    });
    if (addShiftLabel) {
      Object.entries(modifierKeyPositionCodeMap.shift).forEach(
        ([layer, positions]) => {
          const keyLabel = {
            ...SHIFT_KEY_LABEL,
            layer: layer as Layer,
            shiftKey: null,
            altGraphKey: null,
          };
          positions.forEach((pos) => {
            if (!keyLabelMap[pos]) {
              keyLabelMap[pos] = [keyLabel];
            } else {
              keyLabelMap[pos].push(keyLabel);
            }
          });
        },
      );
    }
    if (addNumShiftLabel) {
      layerShiftKeyPositionCodeMap.numShift.forEach((pos) => {
        if (!keyLabelMap[pos]) {
          keyLabelMap[pos] = [NUM_SHIFT_KEY_LABEL];
        } else {
          keyLabelMap[pos].push(NUM_SHIFT_KEY_LABEL);
        }
      });
    }
    if (addFnShiftLabel) {
      layerShiftKeyPositionCodeMap.fnShift.forEach((pos) => {
        if (!keyLabelMap[pos]) {
          keyLabelMap[pos] = [FN_SHIFT_KEY_LABEL];
        } else {
          keyLabelMap[pos].push(FN_SHIFT_KEY_LABEL);
        }
      });
    }
    if (addFlagShiftLabel) {
      layerShiftKeyPositionCodeMap.flagShift.forEach((pos) => {
        if (!keyLabelMap[pos]) {
          keyLabelMap[pos] = [FLAG_SHIFT_KEY_LABEL];
        } else {
          keyLabelMap[pos].push(FLAG_SHIFT_KEY_LABEL);
        }
      });
    }
    if (addAltGraphLabel) {
      Object.entries(modifierKeyPositionCodeMap.altGraph).forEach(
        ([layer, positions]) => {
          const keyLabel = {
            ...ALT_GRAPH_KEY_LABEL,
            layer: layer as Layer,
            shiftKey: null,
            altGraphKey: null,
          };
          positions.forEach((pos) => {
            if (!keyLabelMap[pos]) {
              keyLabelMap[pos] = [keyLabel];
            } else {
              keyLabelMap[pos].push(keyLabel);
            }
          });
        },
      );
    }
    return keyLabelMap;
  });
  readonly highlightCharacterKeyCombinationMap: Signal<
    Record<string, HighlightKeyCombination>
  > = computed(() => {
    const lessonCharactersDevicePositionCodes =
      this.lessonCharactersDevicePositionCodes();
    const deviceLayout = this.deviceLayout();
    if (!lessonCharactersDevicePositionCodes || !deviceLayout) {
      return {};
    }
    const modifierKeyPositionCodeMap = this.modifierKeyPositionCodeMap();
    const layerShiftKeyPositionMap = this.layerShiftKeyPositionMap();
    const highlightCharacterKeyMap: Record<string, HighlightKeyCombination> =
      {};
    lessonCharactersDevicePositionCodes.forEach((k) => {
      if (
        !k?.characterDeviceKeys ||
        !modifierKeyPositionCodeMap ||
        !layerShiftKeyPositionMap
      ) {
        return;
      }
      highlightCharacterKeyMap[k.c] =
        getHighlightKeyCombinationFromKeyCombinations(
          k.characterDeviceKeys,
          layerShiftKeyPositionMap,
          modifierKeyPositionCodeMap,
          HIGHLIGHT_SETTING,
        );
    });
    return highlightCharacterKeyMap;
  });

  readonly lessonStore = inject(LessonStore);

  // The current target may be a multi-symbol chord (e.g. "ㄉㄨㄛ"); since
  // slots can be filled in any order, every symbol's key lights up at once —
  // the first drives the primary highlight (and per-label active state), the
  // rest ride along as secondary highlights.
  readonly targetSymbols = computed(() => [...this.lessonStore.queue()[0]]);
  readonly highlightKeyCombination = computed(() => {
    const [primarySymbol] = this.targetSymbols();
    const highlightCharacterKeyCombinationMap =
      this.highlightCharacterKeyCombinationMap();
    return (
      (primarySymbol && highlightCharacterKeyCombinationMap[primarySymbol]) ||
      null
    );
  });
  readonly secondaryHighlightPositions = computed(() => {
    const [, ...restSymbols] = this.targetSymbols();
    const highlightCharacterKeyCombinationMap =
      this.highlightCharacterKeyCombinationMap();
    return restSymbols.flatMap(
      (symbol) =>
        highlightCharacterKeyCombinationMap[symbol]?.positionCodes ?? [],
    );
  });

  readonly hotkeysService = inject(HotkeysService);
  readonly router = inject(Router);

  constructor() {
    effect(() => {
      const lesson = this.lesson();
      untracked(() => {
        if (lesson) {
          this.lessonStore.setLesson(lesson);
        }
      });
    });
  }

  ngOnInit(): void {
    this.hotkeysService
      .addShortcut({ keys: this.shortcuts.goToPreviousLesson })
      .subscribe(() => {
        const previousLessonUrl = this.lesson()?.previousLessonUrl;
        if (previousLessonUrl) {
          this.router.navigateByUrl(previousLessonUrl);
        }
      });
    this.hotkeysService
      .addShortcut({ keys: this.shortcuts.goToNextLesson })
      .subscribe(() => {
        const nextLessonUrl = this.lesson()?.nextLessonUrl;
        if (nextLessonUrl) {
          this.router.navigateByUrl(nextLessonUrl);
        }
      });
    this.hotkeysService
      .addShortcut({ keys: this.shortcuts.startLesson })
      .subscribe(() => {
        this.startLesson();
      });
    this.hotkeysService
      .addShortcut({ keys: this.shortcuts.pauseLesson, allowIn: ['INPUT'] })
      .subscribe(() => {
        this.input.nativeElement.blur();
      });
  }

  ngOnDestroy(): void {
    this.hotkeysService.removeShortcuts([
      this.shortcuts.goToPreviousLesson,
      this.shortcuts.goToNextLesson,
      this.shortcuts.startLesson,
      this.shortcuts.pauseLesson,
    ]);
  }

  // Reads the physical key directly (via event.code, which is layout-
  // independent) and converts it ourselves through the selected OS keyboard
  // layout data, rather than trusting the browser's own OS-decoded
  // InputEvent.data. This is required for TanChord 36: its 5 ambiguous keys
  // (e.g. ㄍ/ㄐ) are only ambiguous in *our* data model — a real OS-level
  // keyboard layout can only ever emit one fixed symbol per physical key, so
  // reading already-decoded text would always see whichever symbol the OS
  // happened to pick and never the pair marker LessonStore.type() needs to
  // resolve the symbol live against the rest of the buffer.
  onKeyDown(event: KeyboardEvent) {
    const airModeEnabled = this.airModeSettingStore.enabled();
    if (airModeEnabled) {
      return;
    }
    if (event.code === 'Backspace') {
      event.preventDefault();
      this.lessonStore.backspace();
      return;
    }
    const key = this.keyboardLayout().layout[event.code as WSKCode];
    const output = event.shiftKey ? key?.withShift : key?.unmodified;
    if (!output || output.type !== 'text') {
      return;
    }
    event.preventDefault();
    this.lessonStore.type(output.value);
  }

  startLesson() {
    this.input.nativeElement.focus();
    const airModeEnabled = this.airModeSettingStore.enabled();
    if (airModeEnabled) {
      const characterEntrySpeed =
        this.airModeSettingStore.characterEntrySpeed();
      const characterEntryInterval = (60 * 1000) / characterEntrySpeed;
      interval(characterEntryInterval)
        .pipe(untilDestroyed(this))
        .subscribe(() => {
          this.lessonStore.airType();
        });
    }
  }

  pauseLesson() {
    this.lessonStore.pauseLesson();
  }

  keyRecords$ = liveQuery(() => db.keyRecords.toArray());
}
