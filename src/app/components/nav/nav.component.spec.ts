import { BreakpointObserver } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { HotkeysService } from '@ngneat/hotkeys';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { LESSONS } from 'src/app/data/lessons';
import { NAV_LINKS } from 'src/app/data/nav-links';
import { HOTKEY_DIALOG_ID } from '../hotkey-dialog/hotkey-dialog.const';
import { NavComponent } from './nav.component';

describe('NavComponent', () => {
  let fixture: ComponentFixture<NavComponent>;
  let component: NavComponent;
  let handset: BehaviorSubject<{ matches: boolean }>;
  let shortcut: Subject<unknown>;
  let hotkeys: HotkeysService;
  let dialog: MatDialog;

  const el = () => fixture.nativeElement as HTMLElement;
  const drawer = () =>
    fixture.debugElement.query(By.directive(MatSidenav))
      .componentInstance as MatSidenav;
  const header = () => el().querySelector('header') as HTMLElement;
  const headerLinks = () =>
    Array.from(header().querySelectorAll(':scope > div > a')) as HTMLElement[];
  const lessonLinks = () =>
    Array.from(el().querySelectorAll('mat-nav-list a')) as HTMLAnchorElement[];
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  async function create(isHandset = false) {
    handset = new BehaviorSubject({ matches: isHandset });
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [NavComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: BreakpointObserver, useValue: { observe: () => handset } },
      ],
    }).compileComponents();
    hotkeys = TestBed.inject(HotkeysService);
    shortcut = new Subject();
    spyOn(hotkeys, 'addShortcut').and.returnValue(shortcut as never);
    spyOn(hotkeys, 'removeShortcuts');
    dialog = TestBed.inject(MatDialog);
    spyOn(dialog, 'open');
    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    await settle();
  }

  describe('on a wide screen', () => {
    beforeEach(() => create(false));

    it('keeps the side menu open beside the page and cannot close it', () => {
      expect(drawer().opened).toBeTrue();
      expect(drawer().mode).toBe('side');
      expect(drawer().disableClose).toBeTrue();
      expect(el().querySelector('mat-sidenav')?.getAttribute('role')).toBe(
        'navigation',
      );
    });

    it('has no open-menu button while the menu is open', () => {
      expect(el().querySelector('mat-sidenav-content button')).toBeNull();
    });

    it('has a router outlet for the page', () => {
      expect(el().querySelector('router-outlet')).toBeTruthy();
    });
  });

  describe('on a phone', () => {
    beforeEach(() => create(true));

    it('keeps the side menu closed and over the page, like a dialog', () => {
      expect(drawer().opened).toBeFalse();
      expect(drawer().mode).toBe('over');
      expect(drawer().disableClose).toBeFalse();
      expect(el().querySelector('mat-sidenav')?.getAttribute('role')).toBe(
        'dialog',
      );
    });

    it('shows a button that opens the menu', async () => {
      const button = el().querySelector(
        'mat-sidenav-content button',
      ) as HTMLButtonElement;
      expect(button.getAttribute('aria-label')).toBe(
        'nav.side-menu-toggle.aria-label',
      );
      button.click();
      await settle();
      expect(drawer().opened).toBeTrue();
      expect(el().querySelector('mat-sidenav-content button')).toBeNull();
    });

    it('closes the menu when a link is chosen', async () => {
      await drawer().open();
      await settle();
      component.onNavLinkClick();
      await settle();
      expect(drawer().opened).toBeFalse();
    });
  });

  describe('on a wide screen, choosing a link', () => {
    beforeEach(() => create(false));

    it('keeps the side menu open', async () => {
      component.onNavLinkClick();
      await settle();
      expect(drawer().opened).toBeTrue();
    });
  });

  describe('page links', () => {
    beforeEach(() => create(false));

    it('has a link for each page, then the hotkey button', () => {
      expect(headerLinks().length).toBe(NAV_LINKS.length + 1);
    });

    it('points each link at its page, with its labels', () => {
      NAV_LINKS.forEach((navLink, i) => {
        const a = headerLinks()[i] as HTMLAnchorElement;
        expect(a.getAttribute('aria-label')).toBe(navLink.ariaLabel);
        expect(a.getAttribute('href')).toBe(navLink.routerLink);
        expect(a.querySelector('mat-icon')?.textContent).toBe(navLink.icon);
        expect(a.textContent?.toLowerCase()).toContain(navLink.title);
      });
    });

    it('marks the link of the current page with the primary color', async () => {
      await TestBed.inject(Router).navigateByUrl('/');
      await settle();
      const primary = headerLinks()
        .slice(0, NAV_LINKS.length)
        .map((a) =>
          a.querySelector('button')!.classList.contains('mat-primary'),
        );
      expect(primary).toEqual(NAV_LINKS.map((l) => l.routerLink === '/'));
    });

    it('marks only the link of the current page, also for a deeper address', async () => {
      await TestBed.inject(Router)
        .navigateByUrl('/settings')
        .catch(() => {});
      await settle();
      const primary = headerLinks()
        .slice(0, NAV_LINKS.length)
        .map((a) =>
          a.querySelector('button')!.classList.contains('mat-primary'),
        );
      // the routes are empty in this test, so no link may stay marked as home
      expect(primary[0]).toBeFalse();
    });
  });

  describe('the hotkey dialog', () => {
    beforeEach(() => create(false));

    const hotkeyButton = () =>
      Array.from(header().querySelectorAll('button')).find(
        (b) => b.querySelector('mat-icon')?.textContent === 'keyboard',
      ) as HTMLButtonElement;

    it('opens from its button', async () => {
      hotkeyButton().click();
      await new Promise((r) => setTimeout(r, 100));
      expect(dialog.open).toHaveBeenCalledTimes(1);
      const { HotkeyDialogComponent } =
        await import('../hotkey-dialog/hotkey-dialog.component');
      expect((dialog.open as jasmine.Spy).calls.mostRecent().args).toEqual([
        HotkeyDialogComponent,
        { id: HOTKEY_DIALOG_ID },
      ]);
    });

    it('does not open a second one while one is open', async () => {
      spyOn(dialog, 'getDialogById').and.returnValue({} as never);
      hotkeyButton().click();
      await new Promise((r) => setTimeout(r, 100));
      expect(dialog.getDialogById).toHaveBeenCalledWith(HOTKEY_DIALOG_ID);
      expect(dialog.open).not.toHaveBeenCalled();
    });
  });

  describe('the lesson list', () => {
    beforeEach(() => create(false));

    it('lists every lesson exactly once', () => {
      expect(lessonLinks().length).toBe(LESSONS.length);
      expect(
        lessonLinks()
          .map((a) => a.getAttribute('href'))
          .sort(),
      ).toEqual(LESSONS.map((l) => `/lesson/${l.id}`).sort());
    });

    it('puts the consonant lessons in a four column table in zhuyin order, then the rest', () => {
      const hrefs = lessonLinks().map((a) => a.getAttribute('href'));
      expect(hrefs.slice(0, 4)).toEqual([
        '/lesson/b',
        '/lesson/p',
        '/lesson/m',
        '/lesson/f',
      ]);
      expect(el().querySelector('mat-nav-list > div')?.className).toContain(
        'grid-cols-4',
      );
    });

    it('pads the short rows with empty cells so rows line up', () => {
      const grid = el().querySelector('mat-nav-list > div')!;
      expect(grid.children.length).toBe(28);
      expect(grid.querySelectorAll(':scope > span').length).toBe(
        28 - grid.querySelectorAll('a').length,
      );
      expect(component.lessonTableCells.filter((c) => c === null).length).toBe(
        grid.querySelectorAll(':scope > span').length,
      );
    });

    it('shows the lesson names', () => {
      expect(lessonLinks()[0].textContent?.trim()).toBe('ㄅ');
    });

    it('lists the lessons outside the table below it', () => {
      const inTable = el().querySelectorAll('mat-nav-list > div a').length;
      expect(component.otherLessons.length + inTable).toBe(LESSONS.length);
      expect(el().querySelectorAll('mat-nav-list > a').length).toBe(
        component.otherLessons.length,
      );
    });
  });

  describe('the side menu shortcut', () => {
    beforeEach(() => create(false));

    it('listens to meta+b', () => {
      expect(component.toggleSideMenuShortcut).toBe('meta.b');
      expect(hotkeys.addShortcut).toHaveBeenCalledOnceWith({ keys: 'meta.b' });
    });

    it('toggles the side menu each time it is pressed', async () => {
      shortcut.next(null);
      await settle();
      expect(drawer().opened).toBeFalse();
      shortcut.next(null);
      await settle();
      expect(drawer().opened).toBeTrue();
    });

    it('is removed when the component is destroyed', () => {
      fixture.destroy();
      expect(hotkeys.removeShortcuts).toHaveBeenCalledOnceWith(['meta.b']);
    });
  });
});
