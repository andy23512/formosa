import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { VisibilitySettingStore } from 'src/app/stores/visibility-setting.store';
import { Thumb3SwitchHelpDialogComponent } from '../thumb-3-switch-help-dialog/thumb-3-switch-help-dialog.component';
import { VisibilitySettingPanelContentComponent } from './visibility-setting-panel-content.component';

const KEYS = ['layout', 'layoutThumb3Switch', 'speedometer'] as const;

describe('VisibilitySettingPanelContentComponent', () => {
  let fixture: ComponentFixture<VisibilitySettingPanelContentComponent>;
  let store: InstanceType<typeof VisibilitySettingStore>;
  let dialog: MatDialog;

  const rows = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('mat-checkbox'),
    ) as HTMLElement[];
  const box = (i: number) =>
    rows()[i].querySelector('input[type=checkbox]') as HTMLInputElement;
  const helpButtons = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button'),
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
      imports: [VisibilitySettingPanelContentComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    store = TestBed.inject(VisibilitySettingStore);
    dialog = TestBed.inject(MatDialog);
    spyOn(dialog, 'open');
    fixture = TestBed.createComponent(VisibilitySettingPanelContentComponent);
    await settle();
  });

  afterEach(() => localStorage.clear());

  it('lists the three settings in order', () => {
    expect(rows().length).toBe(3);
    const names = rows().map((r) => r.textContent?.toLowerCase() ?? '');
    [
      'visibility-setting.layout',
      'visibility-setting.layout-thumb-3-switch',
      'visibility-setting.speedometer',
    ].forEach((name, i) => expect(names[i]).toContain(name));
  });

  it('checks each box according to the store (all on by default)', () => {
    expect(KEYS.map((_, i) => box(i).checked)).toEqual([true, true, true]);
  });

  it('writes each toggle to the store, without touching the others', async () => {
    for (let i = 0; i < KEYS.length; i++) {
      const before = KEYS.map((k) => store[k]());
      box(i).click();
      await settle();
      const after = KEYS.map((k) => store[k]());
      expect(after[i]).toBe(!before[i]);
      expect(after.filter((_, j) => j !== i)).toEqual(
        before.filter((_, j) => j !== i),
      );
    }
  });

  it('follows changes made in the store', async () => {
    store.set('speedometer', false);
    await settle();
    expect(box(2).checked).toBe(false);
  });

  describe('help button', () => {
    it('exists only in the thumb 3 switch row', () => {
      expect(helpButtons().length).toBe(1);
      expect(rows()[1].querySelector('button')).toBeTruthy();
    });

    it('opens the thumb 3 switch help dialog', () => {
      rows()[1].querySelector('button')!.click();
      expect(dialog.open).toHaveBeenCalledOnceWith(
        Thumb3SwitchHelpDialogComponent,
      );
    });

    it('does not toggle the setting when pressed', async () => {
      const before = store.layoutThumb3Switch();
      rows()[1].querySelector('button')!.click();
      await settle();
      expect(store.layoutThumb3Switch()).toBe(before);
    });
  });
});
