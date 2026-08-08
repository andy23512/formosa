import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { VisibleDirective } from 'src/app/directives/visible.directive';
import { HighlightKeyCombination, KeyLabel } from 'tangent-cc-lib';
import { LiteLayoutKeyComponent } from '../lite-layout-key/lite-layout-key.component';

const KEY_SIZE = 10;
const GAP = 1;
const KEYBOARD_WIDTH = 163;
const KEYBOARD_HEIGHT = 5 * KEY_SIZE + 4 * GAP;
// Row-stagger increment (á la a physical keyboard): each row's leading key
// widens by one more STEP than the row above it, so that a letter key N rows
// down lines up exactly with the letter N columns further right in the row
// above (e.g. key 55 lines up with key 13, 3 rows / 1 column away).
const STEP = (KEY_SIZE + GAP) / 3;

// CharaChorder Lite switch matrix (row 0 = top, row 4 = bottom)
const CCLITE_SWITCH_MATRIX: number[][] = [
  [53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66], // row 0 (top, number row)
  [39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52], // row 1 (QWERTY row)
  [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38], // row 2 (home row)
  [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25], // row 3 (ZXCV row)
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // row 4 (bottom, space row)
];

// keyboardWidth = 163 (all rows sum to 163 including gaps). Only each row's
// leading key needs an explicit width (per the STEP stagger above); every
// other key defaults to KEY_SIZE, and each row's trailing key absorbs
// whatever residual width is left over via getAlignedRowWidths below.
const CCLITE_KEY_WIDTH_MAP: Partial<Record<number, number>> = {
  39: KEY_SIZE + STEP, // Tab
  26: KEY_SIZE + 2 * STEP, // CapsLock
  12: KEY_SIZE + 3 * STEP, // ShiftLeft
  3: 24, // Space 1 (left thumb cluster)
  6: 27, // Space 2 (right thumb cluster)
  11: 11, // ControlRight
};

function getAlignedRowWidths(row: number[]): number[] {
  if (row.length === 0) {
    return [];
  }

  const widths = row.map((positionCode) => {
    return CCLITE_KEY_WIDTH_MAP[positionCode] ?? KEY_SIZE;
  });
  const totalGap = (row.length - 1) * GAP;
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  const delta = KEYBOARD_WIDTH - (totalWidth + totalGap);

  // Apply residual width to the last key so every row ends at KEYBOARD_WIDTH.
  widths[widths.length - 1] += delta;
  return widths;
}

function generateCCLiteKeyboard() {
  const keys: Array<{
    positionCode: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }> = [];

  let y = 0;
  for (const row of CCLITE_SWITCH_MATRIX) {
    const rowWidths = getAlignedRowWidths(row);
    let x = 0;
    row.forEach((positionCode, index) => {
      const width = rowWidths[index];
      keys.push({ positionCode, x, y, width, height: KEY_SIZE });
      x += width + GAP;
    });
    y += KEY_SIZE + GAP;
  }

  return { width: KEYBOARD_WIDTH, height: KEYBOARD_HEIGHT, keys };
}

const KEYBOARD = generateCCLiteKeyboard();

@Component({
  selector: 'app-lite-layout',
  standalone: true,
  imports: [VisibleDirective, LiteLayoutKeyComponent],
  templateUrl: './lite-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiteLayoutComponent {
  public readonly alwaysShowLayout = input<boolean>(false);
  public readonly keyLabelMap = input<Record<number, KeyLabel[]>>({});
  readonly highlightKeyCombination = input<HighlightKeyCombination | null>(
    null,
  );
  readonly secondaryHighlightPositions = input<number[]>([]);

  readonly keyboard = KEYBOARD;
}
