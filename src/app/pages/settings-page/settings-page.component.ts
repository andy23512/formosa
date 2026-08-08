import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { UiLanguage } from 'src/app/models/language-setting.models';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { LanguageSettingStore } from 'src/app/stores/language-setting.store';
import { LayoutSettingPanelContentComponent } from '../../components/layout-setting-panel-content/layout-setting-panel-content.component';
import { MiscSettingPanelContentComponent } from '../../components/misc-setting-panel-content/misc-setting-panel-content.component';
import { VisibilitySettingPanelContentComponent } from '../../components/visibility-setting-panel-content/visibility-setting-panel-content.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    MatAccordion,
    LayoutSettingPanelContentComponent,
    VisibilitySettingPanelContentComponent,
    MiscSettingPanelContentComponent,
    MatButtonToggleModule,
    FormsModule,
    TranslatePipe,
    RealTitleCasePipe,
    MatExpansionModule,
  ],
  templateUrl: './settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent {
  private translateService = inject(TranslateService);

  @HostBinding('class') classes = 'block p-5';

  public languageSettingStore = inject(LanguageSettingStore);

  public supportedLanguages: LanguageInfo[] = [
    { id: UiLanguage.EN, name: 'English' },
    { id: UiLanguage.ZH_TW, name: '繁體中文' },
    { id: UiLanguage.JP, name: '日本語' },
  ];

  public setLanguage(languageId: LanguageInfo['id']) {
    this.languageSettingStore.set('uiLanguage', languageId);
    this.translateService.use(languageId);
  }
}

interface LanguageInfo {
  id: UiLanguage;
  name: string;
}
