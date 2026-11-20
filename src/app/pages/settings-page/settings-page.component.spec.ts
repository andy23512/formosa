import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { UiLanguage } from 'src/app/models/language-setting.models';
import { LanguageSettingStore } from 'src/app/stores/language-setting.store';
import { SettingsPageComponent } from './settings-page.component';

describe('SettingsPageComponent', () => {
  let fixture: ComponentFixture<SettingsPageComponent>;
  let component: SettingsPageComponent;
  let store: InstanceType<typeof LanguageSettingStore>;
  let translate: TranslateService;

  const el = () => fixture.nativeElement as HTMLElement;
  const headers = () =>
    Array.from(
      el().querySelectorAll('mat-expansion-panel-header'),
    ) as HTMLElement[];
  const panels = () =>
    Array.from(el().querySelectorAll('mat-expansion-panel')) as HTMLElement[];
  const toggles = () =>
    Array.from(
      el().querySelectorAll('mat-button-toggle button'),
    ) as HTMLButtonElement[];
  async function settle() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent, NoopAnimationsModule],
      providers: [provideTranslateService()],
    }).compileComponents();
    translate = TestBed.inject(TranslateService);
    store = TestBed.inject(LanguageSettingStore);
    store.set('uiLanguage', UiLanguage.EN);
    fixture = TestBed.createComponent(SettingsPageComponent);
    component = fixture.componentInstance;
    await settle();
  });

  afterEach(() => localStorage.clear());

  it('is a padded block with a title', () => {
    expect(el().classList).toContain('block');
    expect(el().classList).toContain('p-5');
    expect(el().querySelector('h2')?.textContent?.toLowerCase()).toContain(
      'settings-page.title',
    );
  });

  it('has the four panels in order', () => {
    expect(headers().map((h) => h.textContent?.trim().toLowerCase())).toEqual([
      'settings-page.panel-header.layout',
      'settings-page.panel-header.visibility',
      'settings-page.panel-header.misc',
      'settings-page.panel-header.ui-language',
    ]);
  });

  it('opens only the layout panel at first, and fills it', () => {
    expect(panels().map((p) => p.classList.contains('mat-expanded'))).toEqual([
      true,
      false,
      false,
      false,
    ]);
    expect(el().querySelector('app-layout-setting-panel-content')).toBeTruthy();
  });

  it('does not build the content of a closed panel until it is opened', async () => {
    expect(
      el().querySelector('app-visibility-setting-panel-content'),
    ).toBeNull();
    expect(el().querySelector('app-misc-setting-panel-content')).toBeNull();
    headers()[1].click();
    await settle();
    expect(
      el().querySelector('app-visibility-setting-panel-content'),
    ).toBeTruthy();
  });

  it('keeps one panel open at a time', async () => {
    headers()[1].click();
    await settle();
    expect(panels().map((p) => p.classList.contains('mat-expanded'))).toEqual([
      false,
      true,
      false,
      false,
    ]);
  });

  describe('language', () => {
    beforeEach(async () => {
      headers()[3].click();
      await settle();
    });

    it('offers English, Chinese and Japanese by their own names', () => {
      expect(toggles().map((b) => b.textContent?.trim())).toEqual([
        'English',
        '繁體中文',
        '日本語',
      ]);
      expect(component.supportedLanguages.map((l) => l.id)).toEqual([
        UiLanguage.EN,
        UiLanguage.ZH_TW,
        UiLanguage.JP,
      ]);
    });

    it('shows the current language as chosen', () => {
      expect(
        toggles().map(
          (b) =>
            b.getAttribute('aria-pressed') ?? b.getAttribute('aria-checked'),
        ),
      ).toEqual(['true', 'false', 'false']);
    });

    it('stores the chosen language and switches the translations to it', async () => {
      spyOn(translate, 'use').and.callThrough();
      toggles()[1].click();
      await settle();
      expect(store.uiLanguage()).toBe(UiLanguage.ZH_TW);
      expect(translate.use).toHaveBeenCalledWith(UiLanguage.ZH_TW);
    });

    it('can be chosen by code too', () => {
      component.setLanguage(UiLanguage.JP);
      expect(store.uiLanguage()).toBe(UiLanguage.JP);
    });

    it('persists the choice', async () => {
      toggles()[2].click();
      await settle();
      const saved = Object.entries(localStorage).find(([k]) =>
        k.includes('languageSetting'),
      );
      expect(saved?.[1]).toContain('jp');
    });
  });
});
