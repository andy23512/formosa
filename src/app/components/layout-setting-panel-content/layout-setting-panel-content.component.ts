import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { LAYOUT_PRESETS } from 'src/app/data/layout-presets';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { LayoutSettingStore } from 'src/app/stores/layout-setting.store';

@Component({
  selector: 'app-layout-setting-panel-content',
  standalone: true,
  imports: [MatFormField, MatLabel, MatSelect, MatOption, TranslatePipe, RealTitleCasePipe],
  templateUrl: './layout-setting-panel-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutSettingPanelContentComponent {
  public layoutSettingStore = inject(LayoutSettingStore);
  public layoutPresets = LAYOUT_PRESETS;

  public setPresetId(presetId: string) {
    this.layoutSettingStore.setPresetId(presetId);
  }
}
