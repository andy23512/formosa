import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatNavList } from '@angular/material/list';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { MatTooltip } from '@angular/material/tooltip';
import {
  RouterLinkActive,
  RouterLinkWithHref,
  RouterOutlet,
} from '@angular/router';
import { HotkeysService } from '@ngneat/hotkeys';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, map, shareReplay, take } from 'rxjs/operators';
import { NAV_LINKS } from 'src/app/data/nav-links';
import { Lesson } from 'src/app/models/lesson.models';
import { IconGuardPipe } from 'src/app/pipes/icon-guard.pipe';
import { RealTitleCasePipe } from 'src/app/pipes/real-title-case.pipe';
import { LESSONS } from '../../data/lessons';

// Traditional Zhuyin chart grouping, by manner of articulation: bilabial,
// alveolar, velar, palatal, retroflex, dental sibilant, then the 3
// no-initial medial lessons. Rows are padded to 4 columns (null = empty
// cell) so every row lines up in the same grid.
const LESSON_TABLE_ROW_IDS: (string | null)[][] = [
  ['b', 'p', 'm', 'f'],
  ['d', 't', 'n', 'l'],
  ['g', 'k', 'h', null],
  ['j', 'q', 'x', null],
  ['zh', 'ch', 'sh', 'r'],
  ['z', 'c', 's', null],
  ['no-initial-i', 'no-initial-u', 'no-initial-yu', null],
];

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  standalone: true,
  imports: [
    AsyncPipe,
    MatIcon,
    MatButton,
    MatListItem,
    MatNavList,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatTooltip,
    RouterLinkActive,
    RouterLinkWithHref,
    RouterOutlet,
    IconGuardPipe,
    TranslatePipe,
    RealTitleCasePipe,
  ],
})
export class NavComponent implements OnInit, OnDestroy {
  public readonly lessonTableCells: (Lesson | null)[] = LESSON_TABLE_ROW_IDS.flat().map(
    (id) => LESSONS.find((lesson) => lesson.id === id) ?? null,
  );
  public readonly otherLessons: Lesson[] = LESSONS.filter(
    (lesson) => !LESSON_TABLE_ROW_IDS.flat().includes(lesson.id),
  );
  public navLinks = NAV_LINKS;
  public toggleSideMenuShortcut = 'meta.b';

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly matDialog = inject(MatDialog);

  @ViewChild('drawer') public drawer!: MatSidenav;

  readonly hotkeysService = inject(HotkeysService);

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay(1),
    );

  ngOnInit(): void {
    this.hotkeysService
      .addShortcut({ keys: this.toggleSideMenuShortcut })
      .subscribe(() => this.drawer.toggle());
  }

  ngOnDestroy(): void {
    this.hotkeysService.removeShortcuts([this.toggleSideMenuShortcut]);
  }

  onNavLinkClick() {
    this.isHandset$
      .pipe(
        take(1),
        filter((isHandSet) => isHandSet),
      )
      .subscribe(() => {
        this.drawer.close();
      });
  }

  async openHotkeyDialog() {
    const { HotkeyDialogComponent } = await import(
      '../hotkey-dialog/hotkey-dialog.component'
    );
    this.matDialog.open(HotkeyDialogComponent);
  }
}
