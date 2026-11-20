import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { HotkeysService } from '@ngneat/hotkeys';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { CHORDING_TIMING } from 'src/app/data/chord-timing';
import { HOME_PAGE_BACKGROUND_SCENES } from 'src/app/data/home-page-background-scenes';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let component: HomePageComponent;
  let navigateByUrl: jasmine.Spy;
  let shortcuts: Record<string, Subject<unknown>>;
  let removed: string[][];

  const el = () => fixture.nativeElement as HTMLElement;
  const text = (e: Element | null | undefined) =>
    e?.textContent?.replace(/\s+/g, ' ').trim().toLowerCase();

  beforeEach(() => {
    TestBed.resetTestingModule();
    shortcuts = {};
    removed = [];
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        {
          provide: HotkeysService,
          useValue: {
            addShortcut: ({ keys }: { keys: string }) =>
              (shortcuts[keys] = new Subject()),
            removeShortcuts: (k: string[]) => removed.push(k),
          },
        },
      ],
    });
    navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl');
  });

  function create() {
    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('fills the page and names the site', () => {
    create();
    expect(el().classList).toContain('block');
    expect(el().classList).toContain('relative');
    expect(el().classList).toContain('h-full');
    expect(text(el().querySelector('h1'))).toBe('home-page.website-name');
    expect(text(el())).toContain('home-page.remark');
  });

  describe('background', () => {
    it('draws one scene, picked at random from the scenes', () => {
      const random = spyOn(Math, 'random');
      HOME_PAGE_BACKGROUND_SCENES.forEach((scene, i) => {
        random.and.returnValue((i + 0.5) / HOME_PAGE_BACKGROUND_SCENES.length);
        create();
        expect(component.backgroundScene).toBe(scene);
        fixture.destroy();
      });
    });

    it('draws a text for each glyph, a path for each link and a dot for each marker', () => {
      create();
      const scene = component.backgroundScene;
      const svg = el().querySelector('svg')!;
      const texts = Array.from(svg.querySelectorAll('text')).map((t) =>
        t.textContent?.trim(),
      );
      scene.glyphs.forEach((g) => expect(texts).toContain(g.glyph));
      expect(svg.querySelectorAll('path').length).toBe(scene.links.length);
      const dots = scene.markers.reduce((n, m) => n + (m.lone ? 2 : 1), 0);
      // 8 fixed stars are drawn besides the markers
      expect(svg.querySelectorAll('circle').length).toBe(8 + dots);
    });

    it('rotates each glyph around its own position', () => {
      create();
      const glyph = component.backgroundScene.glyphs[0];
      const t = Array.from(el().querySelectorAll('svg text')).find(
        (e) => e.textContent?.trim() === glyph.glyph,
      )!;
      expect(t.getAttribute('transform')).toBe(
        `rotate(${glyph.rotation} ${glyph.x} ${glyph.y})`,
      );
    });

    it('stays behind the content', () => {
      create();
      expect(el().querySelector('svg')!.classList).toContain('-z-10');
    });
  });

  describe('starting a lesson', () => {
    it('goes to the first lesson, which is the first one in the lesson list', () => {
      create();
      expect(component.firstLessonUrl).toBe('/lesson/b');
    });

    it('goes there when space is pressed', () => {
      create();
      shortcuts['space'].next({});
      expect(navigateByUrl).toHaveBeenCalledOnceWith('/lesson/b');
    });

    it('stops listening for space when it is destroyed', () => {
      create();
      fixture.destroy();
      expect(removed).toEqual([['space']]);
    });

    it('tells the visitor to press space', () => {
      create();
      expect(text(el().querySelector('main > span'))).toBe(
        'home-page.lesson-start-instruction.0home-page.lesson-start-instruction.1home-page.lesson-start-instruction.2',
      );
      expect(text(el().querySelector('kbd'))).toBe(
        'home-page.lesson-start-instruction.1',
      );
    });
  });

  describe('typing animation', () => {
    it('shows the plain summary when the animation is off', () => {
      create();
      expect(component.useAnimation()).toBeFalse();
      expect(text(el())).toContain('home-page.summary.1');
      expect(el().querySelector('.h-6')).toBeNull();
    });

    it('starts when the summary is clicked, and replaces the plain summary', fakeAsync(() => {
      create();
      (el().querySelector('.cursor-pointer') as HTMLElement).click();
      fixture.detectChanges();
      expect(component.useAnimation()).toBeTrue();
      expect(text(el())).not.toContain('home-page.summary.1');
      expect(el().querySelector('.h-6')).not.toBeNull();
      expect(el().querySelector('.h-6 span')?.textContent).toBe('_');
      tick(120000);
      discardPeriodicTasks();
      fixture.destroy();
    }));

    it('types a device name with a cursor', fakeAsync(() => {
      create();
      component.useAndReplayAnimation();
      fixture.detectChanges();
      tick(220);
      fixture.detectChanges();
      const typed = el()
        .querySelector('.h-6')!
        .textContent!.replace('_', '')
        .trim();
      expect(['c', 'm']).toContain(typed);
      tick(120000);
      discardPeriodicTasks();
      fixture.destroy();
    }));

    it('keeps the last device name on the screen, and erases the others', fakeAsync(() => {
      create();
      component.useAndReplayAnimation();
      fixture.detectChanges();
      const typed = CHORDING_TIMING['ctd'].reduce(
        (t, e) => (e.type === '+' ? t + e.c : t.slice(0, -1)),
        '',
      );
      const shown = () =>
        el().querySelector('.h-6')!.textContent!.replace('_', '').trim();
      tick(120000);
      fixture.detectChanges();
      expect(shown()).toBe(typed);
      expect(typed.length).toBeGreaterThan(0);
      tick(120000);
      fixture.detectChanges();
      expect(shown()).toBe(typed);
      discardPeriodicTasks();
      fixture.destroy();
    }));
  });

  describe('links', () => {
    it('opens the source code in a new tab, without giving it access to this page', () => {
      create();
      const links = Array.from(
        el().querySelectorAll('main a'),
      ) as HTMLAnchorElement[];
      expect(links.map((a) => a.getAttribute('href'))).toEqual([
        'https://github.com/andy23512/formosa',
      ]);
      expect(links[0].target).toBe('_blank');
      expect(links[0].rel).toContain('noopener');
      expect(text(links[0])).toBe('code home-page.source-code');
    });
  });
});
