import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { HotkeysService } from '@ngneat/hotkeys';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { LayoutComponent } from 'src/app/components/layout/layout.component';
import { LiteLayoutComponent } from 'src/app/components/lite-layout/lite-layout.component';
import { SpeedometerComponent } from 'src/app/components/speedometer/speedometer.component';
import { ResolvedLesson } from 'src/app/models/lesson.models';
import { KeyRecordService } from 'src/app/services/key-record.service';
import { AirModeSettingStore } from 'src/app/stores/air-mode-setting.store';
import { LayoutSettingStore } from 'src/app/stores/layout-setting.store';
import { LessonStore } from 'src/app/stores/lesson.store';
import { VisibilitySettingStore } from 'src/app/stores/visibility-setting.store';
import { LessonPageComponent } from './lesson-page.component';

const lesson = (over: Partial<ResolvedLesson> = {}): ResolvedLesson => ({
  id: 'b',
  name: 'ㄅ',
  components: ['ㄅ', 'ㄆ'],
  componentNames: [],
  previousLessonUrl: '/lesson/prev',
  nextLessonUrl: '/lesson/next',
  ...over,
});

describe('LessonPageComponent', () => {
  let fixture: ComponentFixture<LessonPageComponent>;
  let component: LessonPageComponent;
  let navigateByUrl: jasmine.Spy;
  let shortcuts: Record<string, Subject<unknown>>;
  let shortcutOptions: Record<string, { allowIn?: string[] }>;
  let removed: string[][];
  let push: jasmine.Spy;
  let air: InstanceType<typeof AirModeSettingStore>;
  let visibility: InstanceType<typeof VisibilitySettingStore>;
  let layoutSetting: InstanceType<typeof LayoutSettingStore>;

  const el = () => fixture.nativeElement as HTMLElement;
  const text = (e: Element | null | undefined) =>
    e?.textContent?.replace(/\s+/g, ' ').trim().toLowerCase();
  const store = () => fixture.debugElement.injector.get(LessonStore);
  const input = () => el().querySelector('input') as HTMLInputElement;
  const liteLayout = () =>
    fixture.debugElement.query(By.directive(LiteLayoutComponent))
      .componentInstance as LiteLayoutComponent;
  const button = (icon: string) =>
    Array.from(el().querySelectorAll('button')).find(
      (b) => b.querySelector('mat-icon')?.textContent === icon,
    ) as HTMLButtonElement | undefined;
  const focus = () => {
    input().dispatchEvent(new Event('focus'));
    fixture.detectChanges();
  };
  const blur = () => {
    input().dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  };
  // finds the physical key that gives a symbol in the selected keyboard layout
  const codeOf = (symbol: string, shift = false) => {
    const layout = component.keyboardLayout().layout as Record<
      string,
      { unmodified?: { value: string }; withShift?: { value: string } }
    >;
    const code = Object.keys(layout).find(
      (c) =>
        (shift ? layout[c]?.withShift : layout[c]?.unmodified)?.value ===
        symbol,
    );
    if (!code) throw new Error(`no key for ${symbol}`);
    return code;
  };
  const press = (code: string, shiftKey = false) => {
    const event = new KeyboardEvent('keydown', {
      code,
      shiftKey,
      cancelable: true,
    });
    input().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const pressSymbol = (symbol: string) => press(codeOf(symbol));

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    shortcuts = {};
    shortcutOptions = {};
    removed = [];
    push = jasmine.createSpy('pushIntoQueue');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: KeyRecordService, useValue: { pushIntoQueue: push } },
        {
          provide: HotkeysService,
          useValue: {
            addShortcut: (o: { keys: string; allowIn?: string[] }) => {
              shortcutOptions[o.keys] = o;
              return (shortcuts[o.keys] = new Subject());
            },
            removeShortcuts: (k: string[]) => removed.push(k),
          },
        },
      ],
    });
    navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl');
    air = TestBed.inject(AirModeSettingStore);
    visibility = TestBed.inject(VisibilitySettingStore);
    layoutSetting = TestBed.inject(LayoutSettingStore);
    spyOn(Math, 'random').and.returnValue(0); // every pick is the first component
  });

  afterEach(() => localStorage.clear());

  function create(l: ResolvedLesson = lesson()) {
    fixture = TestBed.createComponent(LessonPageComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('lesson', l);
    fixture.detectChanges();
  }

  it('fills the page', () => {
    create();
    for (const c of ['flex', 'flex-col', 'gap-2', 'h-full', 'relative']) {
      expect(el().classList).toContain(c);
    }
  });

  describe('lesson', () => {
    it('is given to the lesson store, which fills its queue from the components', () => {
      create();
      expect(store().lessonId()).toBe('b');
      expect(store().queue().length).toBeGreaterThan(0);
      expect(store().queue()[0]).toBe('ㄅ');
      expect(store().components()).toEqual(['ㄅ', 'ㄆ']);
    });

    it('starts over when another lesson arrives', () => {
      create();
      focus();
      pressSymbol('ㄅ');
      expect(store().history()[2]).toBe('ㄅ');
      fixture.componentRef.setInput(
        'lesson',
        lesson({ id: 'p', name: 'ㄆ', components: ['ㄆ'] }),
      );
      fixture.detectChanges();
      expect(store().lessonId()).toBe('p');
      expect(store().history()).toEqual([' ', ' ', ' ']);
      expect(store().components()).toEqual(['ㄆ']);
    });
  });

  describe('before the lesson starts', () => {
    beforeEach(() => create());

    it('shows the lesson name and a start button with its key', () => {
      expect(text(el().querySelector('section'))).toBe('ㄅ');
      expect(text(button('play_arrow'))).toBe(
        'play_arrow lesson-page.start-action space',
      );
      expect(button('pause')).toBeUndefined();
    });

    it('has a hidden text box that cannot bring up a keyboard', () => {
      expect(input().getAttribute('inputmode')).toBe('none');
      expect(input().getAttribute('title')).toBe('lesson-page.input-box-title');
      expect(input().classList).toContain('opacity-0');
    });

    it('shows the layout without a highlight', () => {
      expect(liteLayout().highlightKeyCombination()).toBeNull();
      expect(liteLayout().secondaryHighlightPositions()).toEqual([]);
    });
  });

  describe('previous and next lesson', () => {
    const links = () =>
      Array.from(
        el().querySelectorAll('section ~ div a'),
      ) as HTMLAnchorElement[];

    it('links to both, when there are both', () => {
      create();
      expect(links().map((a) => a.getAttribute('href'))).toEqual([
        '/lesson/prev',
        '/lesson/next',
      ]);
      expect(links().map((a) => a.querySelector('button')!.disabled)).toEqual([
        false,
        false,
      ]);
      expect(links().map((a) => a.getAttribute('aria-label'))).toEqual([
        'lesson-page.previous-lesson-link.aria-label',
        'lesson-page.next-lesson-link.aria-label',
      ]);
    });

    it('disables the one that does not exist', () => {
      create(lesson({ previousLessonUrl: null }));
      expect(links().map((a) => a.querySelector('button')!.disabled)).toEqual([
        true,
        false,
      ]);
      create(lesson({ nextLessonUrl: null }));
      expect(links().map((a) => a.querySelector('button')!.disabled)).toEqual([
        false,
        true,
      ]);
    });

    it('shows a tooltip only for the links that exist', () => {
      const disabled = () =>
        fixture.debugElement
          .queryAll(By.directive(MatTooltip))
          .filter((d) => d.nativeElement.tagName === 'A')
          .map((d) => (d.injector.get(MatTooltip) as MatTooltip).disabled);
      create();
      expect(disabled()).toEqual([false, false]);
      create(lesson({ previousLessonUrl: null }));
      expect(disabled()).toEqual([true, false]);
      create(lesson({ nextLessonUrl: null }));
      expect(disabled()).toEqual([false, true]);
    });

    it('hides them while the lesson is running', () => {
      create();
      focus();
      expect(links().length).toBe(0);
    });
  });

  describe('while the lesson runs', () => {
    beforeEach(() => {
      create();
      focus();
    });

    it('shows the queue to type, and a pause button instead of the lesson name', () => {
      expect(el().querySelector('section')!.textContent).toContain('...');
      expect(text(button('pause'))).toBe('pause lesson-page.pause-action esc');
      expect(button('play_arrow')).toBeUndefined();
      const queue = Array.from(el().querySelectorAll('section span.mr-1')).map(
        (s) => s.textContent,
      );
      expect(queue).toEqual(store().queue());
    });

    it('shows what was typed so far in the history', () => {
      pressSymbol('ㄅ');
      expect(text(el().querySelector('section > div'))).toBe('ㄅ');
      expect(store().history()).toEqual([' ', ' ', 'ㄅ']);
    });

    it('stops the highlight when the text box loses focus, and pauses', () => {
      pressSymbol('ㄅ');
      expect(store().lastCorrectKeyTime()).not.toBeNull();
      blur();
      expect(liteLayout().highlightKeyCombination()).toBeNull();
      expect(store().lastCorrectKeyTime()).toBeNull();
      expect(button('play_arrow')).toBeDefined();
    });

    it('highlights the keys of the character to type', () => {
      const h = liteLayout().highlightKeyCombination()!;
      expect(h).toBeTruthy();
      expect(h).toBe(component.highlightCharacterKeyCombinationMap()['ㄅ']);
    });

    it('labels the keys of the lesson symbols, and only those', () => {
      const labels = Object.values(component.keyLabelMap()).flat();
      const chars = new Set(
        labels.filter((l) => 'c' in l).map((l) => (l as { c: string }).c),
      );
      expect(chars.has('ㄅ')).toBeTrue();
      expect(chars.has('ㄆ')).toBeTrue();
      expect(chars.has('ㄇ')).toBeFalse();
    });
  });

  describe('highlight of a chord with several symbols', () => {
    beforeEach(() => {
      create(lesson({ components: ['ㄅㄧ'] }));
      focus();
    });

    it('collects the symbols of the lesson', () => {
      expect(component.lessonSymbols()).toEqual(['ㄅ', 'ㄧ']);
    });

    it('drives the main highlight with the first symbol and the others as secondary highlights', () => {
      expect(component.targetSymbols()).toEqual(['ㄅ', 'ㄧ']);
      const map = component.highlightCharacterKeyCombinationMap();
      expect(component.highlightKeyCombination()).toBe(map['ㄅ']);
      expect(component.secondaryHighlightPositions()).toEqual(
        map['ㄧ'].positionCodes,
      );
      expect(liteLayout().secondaryHighlightPositions()).toEqual(
        map['ㄧ'].positionCodes,
      );
    });
  });

  describe('typing', () => {
    beforeEach(() => {
      create();
      focus();
    });

    it('takes a correct symbol into the history, and records it', () => {
      const event = pressSymbol('ㄅ');
      expect(event.defaultPrevented).toBeTrue();
      expect(store().history()).toEqual([' ', ' ', 'ㄅ']);
      expect(push).toHaveBeenCalledTimes(1);
      expect(push.calls.mostRecent().args[0].inputKey).toBe('ㄅ');
    });

    it('keeps a wrong symbol in the buffer and shows it', () => {
      pressSymbol('ㄆ');
      expect(store().history()).toEqual([' ', ' ', ' ']);
      expect(store().bufferText()).toBe('ㄆ');
      expect(text(el().querySelector('section'))).toContain('ㄆ');
      expect(push).not.toHaveBeenCalled();
    });

    it('reads the physical key, and takes Shift into account', () => {
      // Digit1 gives ㄅ, and ! with Shift
      expect(codeOf('ㄅ')).toBe('Digit1');
      const shifted = press('Digit1', true);
      expect(shifted.defaultPrevented).toBeTrue();
      expect(store().history()[2]).toBe(' ');
      expect(store().bufferText()).toBe('');
      press('Digit1', false);
      expect(store().history()[2]).toBe('ㄅ');
    });

    it('lets keys that give no text go through to the browser', () => {
      const event = press('F1');
      expect(event.defaultPrevented).toBeFalse();
      expect(store().bufferText()).toBe('');
    });

    it('removes the last typed part with Backspace, and keeps the browser out of it', () => {
      create(lesson({ components: ['ㄅㄧ'] }));
      focus();
      pressSymbol('ㄅ');
      pressSymbol('ㄧ');
      expect(store().history()[2]).toBe('ㄅㄧ');
      pressSymbol('ㄅ');
      expect(store().bufferText()).toBe('ㄅ');
      const event = press('Backspace');
      expect(event.defaultPrevented).toBeTrue();
      expect(store().bufferText()).toBe('');
    });

    it('does not type by hand while air mode is on', () => {
      air.set('enabled', true);
      const event = pressSymbol('ㄅ');
      expect(event.defaultPrevented).toBeFalse();
      expect(store().history()).toEqual([' ', ' ', ' ']);
      const backspace = press('Backspace');
      expect(backspace.defaultPrevented).toBeFalse();
    });
  });

  describe('air mode', () => {
    it('types by itself at the set speed after the start', fakeAsync(() => {
      air.set('enabled', true);
      air.set('characterEntrySpeed', 600); // one character every 100 ms
      create();
      component.startLesson();
      tick(100);
      expect(
        store()
          .history()
          .filter((h) => h === 'ㄅ').length,
      ).toBe(1);
      tick(300);
      expect(
        store()
          .history()
          .filter((h) => h === 'ㄅ').length,
      ).toBe(3);
      discardPeriodicTasks();
      fixture.destroy();
    }));

    it('does not type by itself when it is off', fakeAsync(() => {
      create();
      component.startLesson();
      tick(5000);
      expect(store().history()).toEqual([' ', ' ', ' ']);
      discardPeriodicTasks();
      fixture.destroy();
    }));

    it('stops typing when the page is destroyed', fakeAsync(() => {
      air.set('enabled', true);
      air.set('characterEntrySpeed', 600);
      create();
      component.startLesson();
      tick(100);
      const lessonStore = store();
      fixture.destroy();
      tick(1000);
      expect(lessonStore.history().filter((h) => h === 'ㄅ').length).toBe(1);
    }));
  });

  describe('starting and pausing', () => {
    beforeEach(() => create());

    it('focuses the text box when the start button is clicked', () => {
      const focusSpy = spyOn(input(), 'focus');
      button('play_arrow')!.click();
      expect(focusSpy).toHaveBeenCalledTimes(1);
    });

    it('pauses the lesson from the pause button', () => {
      focus();
      const pause = spyOn(store(), 'pauseLesson');
      button('pause')!.click();
      expect(pause).toHaveBeenCalledTimes(1);
    });
  });

  describe('hotkeys', () => {
    beforeEach(() => create());

    it('listens to the four shortcuts, and the pause one also inside the text box', () => {
      expect(Object.keys(shortcuts).sort()).toEqual([
        'escape',
        'meta.left',
        'meta.right',
        'space',
      ]);
      expect(shortcutOptions['escape'].allowIn).toEqual(['INPUT']);
      expect(shortcutOptions['space'].allowIn).toBeUndefined();
    });

    it('goes to the previous and the next lesson', () => {
      shortcuts['meta.left'].next({});
      expect(navigateByUrl).toHaveBeenCalledOnceWith('/lesson/prev');
      shortcuts['meta.right'].next({});
      expect(navigateByUrl).toHaveBeenCalledWith('/lesson/next');
    });

    it('does nothing when there is no such lesson', () => {
      create(lesson({ previousLessonUrl: null, nextLessonUrl: null }));
      shortcuts['meta.left'].next({});
      shortcuts['meta.right'].next({});
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('starts the lesson with space', () => {
      const focusSpy = spyOn(input(), 'focus');
      shortcuts['space'].next({});
      expect(focusSpy).toHaveBeenCalled();
    });

    it('takes the focus away with escape', () => {
      const blurSpy = spyOn(input(), 'blur');
      shortcuts['escape'].next({});
      expect(blurSpy).toHaveBeenCalled();
    });

    it('removes all four when destroyed', () => {
      fixture.destroy();
      expect(removed.length).toBe(1);
      expect([...removed[0]].sort()).toEqual([
        'escape',
        'meta.left',
        'meta.right',
        'space',
      ]);
    });
  });

  describe('layout type', () => {
    it('uses the lite layout for the lite preset', () => {
      create();
      expect(el().querySelector('app-lite-layout')).not.toBeNull();
      expect(el().querySelector('app-layout')).toBeNull();
    });

    it('uses the 3D layout for the 3D preset, with the thumb 3 switch setting', () => {
      layoutSetting.setPresetId('tanchord-36-v2');
      create();
      expect(el().querySelector('app-lite-layout')).toBeNull();
      const layout = fixture.debugElement.query(By.directive(LayoutComponent))
        .componentInstance as LayoutComponent;
      expect(layout.showThumb3Switch()).toBeTrue();
    });

    it('passes the thumb 3 switch setting on', () => {
      layoutSetting.setPresetId('tanchord-36-v2');
      visibility.set('layoutThumb3Switch', false);
      create();
      const layout = fixture.debugElement.query(By.directive(LayoutComponent))
        .componentInstance as LayoutComponent;
      expect(layout.showThumb3Switch()).toBeFalse();
    });

    it('highlights also on the 3D layout while the lesson runs', () => {
      layoutSetting.setPresetId('tanchord-36-v2');
      create();
      focus();
      const layout = fixture.debugElement.query(By.directive(LayoutComponent))
        .componentInstance as LayoutComponent;
      expect(layout.highlightKeyCombination()).toBe(
        component.highlightKeyCombination(),
      );
    });
  });

  describe('speedometer', () => {
    const speedometer = () =>
      fixture.debugElement.query(By.directive(SpeedometerComponent));

    it('shows the speed of the lesson with a top speed of 200', () => {
      create();
      expect(speedometer().componentInstance.maxSpeed()).toBe(200);
      expect(speedometer().componentInstance.speed()).toBe(store().cpm());
      expect(speedometer().componentInstance.speedUnit()).toBe(
        'general.character-entry-speed-unit',
      );
    });

    it('is dimmed while the lesson runs', () => {
      create();
      focus();
      expect(speedometer().nativeElement.classList).toContain('opacity-50');
    });

    it('can be hidden with the visibility setting', () => {
      visibility.set('speedometer', false);
      create();
      expect(speedometer()).toBeNull();
    });

    it('follows the speed while typing', () => {
      create();
      focus();
      const now = spyOn(Date, 'now');
      now.and.returnValue(1000);
      pressSymbol('ㄅ');
      now.and.returnValue(1200);
      pressSymbol('ㄅ');
      now.and.returnValue(1400);
      pressSymbol('ㄅ');
      fixture.detectChanges();
      expect(store().cpm()).toBe(300);
      expect(speedometer().componentInstance.speed()).toBe(300);
    });
  });
});
