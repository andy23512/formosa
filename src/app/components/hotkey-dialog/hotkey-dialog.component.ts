import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { HotkeysShortcutPipe } from '@ngneat/hotkeys';
import { TranslatePipe } from '@ngx-translate/core';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';

export const HOTKEY_GROUPS = [
  {
    name: 'hotkey.global.name',
    hotkeys: [
      { key: '?', description: 'hotkey.global.toggle-hotkey-dialog' },
      { key: 'meta.b', description: 'hotkey.global.toggle-side-menu' },
    ],
  },
  {
    name: 'hotkey.home-page.name',
    hotkeys: [
      { key: 'space', description: 'hotkey.home-page.go-to-the-first-lesson' },
    ],
  },
  {
    name: 'hotkey.lesson-page.name',
    hotkeys: [
      {
        key: 'meta.left',
        description: 'hotkey.lesson-page.go-to-the-previous-lesson',
      },
      {
        key: 'meta.right',
        description: 'hotkey.lesson-page.go-to-the-next-lesson',
      },
      {
        key: 'space',
        description: 'hotkey.lesson-page.start-or-resume-the-lesson',
      },
      { key: 'escape', description: 'hotkey.lesson-page.pause-the-lesson' },
    ],
  },
];

@Component({
  selector: 'app-hotkey-dialog',
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    HotkeysShortcutPipe,
    TranslatePipe,
    RealTitleCasePipe,
  ],
  templateUrl: './hotkey-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HotkeyDialogComponent {
  hotkeyGroups = HOTKEY_GROUPS;
  keyAlias = { escape: 'esc', space: 'space' };
}
