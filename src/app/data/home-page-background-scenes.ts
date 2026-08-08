import { HomePageBackgroundScene } from '../models/home-page-background.models';

// Each scene spells out one phrase in zhuyin: syllables with 2+ symbols are
// linked by an arc (chorded together), a lone single-symbol syllable gets a
// small glow instead of a link.
export const HOME_PAGE_BACKGROUND_SCENES: HomePageBackgroundScene[] = [
  {
    // 福爾摩沙 (Formosa)
    glyphs: [
      { x: 34, y: 58, size: 36, rotation: -8, opacity: 0.22, glyph: 'ㄈ' },
      { x: 86, y: 40, size: 28, rotation: 6, opacity: 0.2, glyph: 'ㄨ' },
      { x: 128, y: 68, size: 32, rotation: -4, opacity: 0.22, glyph: 'ㄦ' },
      { x: 222, y: 268, size: 38, rotation: 5, opacity: 0.24, glyph: 'ㄇ' },
      { x: 270, y: 242, size: 26, rotation: -7, opacity: 0.2, glyph: 'ㄛ' },
      { x: 312, y: 278, size: 34, rotation: 4, opacity: 0.22, glyph: 'ㄕ' },
      { x: 290, y: 312, size: 24, rotation: -10, opacity: 0.2, glyph: 'ㄚ' },
    ],
    links: [
      { d: 'M 34 58 Q 54 22 86 40' },
      { d: 'M 222 268 Q 267 197 270 242' },
      { d: 'M 312 278 Q 325 320 290 312' },
    ],
    markers: [
      { x: 34, y: 58, lone: false },
      { x: 86, y: 40, lone: false },
      { x: 128, y: 68, lone: true },
      { x: 222, y: 268, lone: false },
      { x: 270, y: 242, lone: false },
      { x: 312, y: 278, lone: false },
      { x: 290, y: 312, lone: false },
    ],
  },
  {
    // 注音和弦 (zhuyin chord)
    glyphs: [
      { x: 38, y: 64, size: 36, rotation: -6, opacity: 0.22, glyph: 'ㄓ' },
      { x: 90, y: 44, size: 27, rotation: 7, opacity: 0.2, glyph: 'ㄨ' },
      { x: 230, y: 50, size: 30, rotation: -5, opacity: 0.2, glyph: 'ㄧ' },
      { x: 280, y: 72, size: 26, rotation: 8, opacity: 0.2, glyph: 'ㄣ' },
      { x: 46, y: 270, size: 34, rotation: 6, opacity: 0.22, glyph: 'ㄏ' },
      { x: 96, y: 290, size: 24, rotation: -9, opacity: 0.2, glyph: 'ㄜ' },
      { x: 230, y: 250, size: 32, rotation: -4, opacity: 0.22, glyph: 'ㄒ' },
      { x: 270, y: 272, size: 22, rotation: 5, opacity: 0.18, glyph: 'ㄧ' },
      { x: 310, y: 255, size: 30, rotation: -8, opacity: 0.2, glyph: 'ㄢ' },
    ],
    links: [
      { d: 'M 38 64 Q 58 26 90 44' },
      { d: 'M 230 50 Q 255 30 280 72' },
      { d: 'M 46 270 Q 65 305 96 290' },
      { d: 'M 230 250 Q 252 232 270 272' },
      { d: 'M 270 272 Q 295 290 310 255' },
    ],
    markers: [
      { x: 38, y: 64, lone: false },
      { x: 90, y: 44, lone: false },
      { x: 230, y: 50, lone: false },
      { x: 280, y: 72, lone: false },
      { x: 46, y: 270, lone: false },
      { x: 96, y: 290, lone: false },
      { x: 230, y: 250, lone: false },
      { x: 270, y: 272, lone: false },
      { x: 310, y: 255, lone: false },
    ],
  },
  {
    // 聲韻並擊 (initial and final struck together)
    glyphs: [
      { x: 40, y: 56, size: 36, rotation: -7, opacity: 0.22, glyph: 'ㄕ' },
      { x: 92, y: 38, size: 26, rotation: 8, opacity: 0.2, glyph: 'ㄥ' },
      { x: 235, y: 46, size: 32, rotation: -5, opacity: 0.22, glyph: 'ㄩ' },
      { x: 282, y: 68, size: 24, rotation: 9, opacity: 0.2, glyph: 'ㄣ' },
      { x: 44, y: 272, size: 34, rotation: 5, opacity: 0.22, glyph: 'ㄅ' },
      { x: 84, y: 296, size: 20, rotation: -8, opacity: 0.18, glyph: 'ㄧ' },
      { x: 120, y: 278, size: 26, rotation: 6, opacity: 0.2, glyph: 'ㄥ' },
      { x: 295, y: 255, size: 32, rotation: -6, opacity: 0.22, glyph: 'ㄐ' },
      { x: 330, y: 278, size: 24, rotation: 7, opacity: 0.2, glyph: 'ㄧ' },
    ],
    links: [
      { d: 'M 40 56 Q 62 20 92 38' },
      { d: 'M 235 46 Q 262 28 282 68' },
      { d: 'M 44 272 Q 60 305 84 296' },
      { d: 'M 84 296 Q 105 312 120 278' },
      { d: 'M 295 255 Q 320 235 330 278' },
    ],
    markers: [
      { x: 40, y: 56, lone: false },
      { x: 92, y: 38, lone: false },
      { x: 235, y: 46, lone: false },
      { x: 282, y: 68, lone: false },
      { x: 44, y: 272, lone: false },
      { x: 84, y: 296, lone: false },
      { x: 120, y: 278, lone: false },
      { x: 295, y: 255, lone: false },
      { x: 330, y: 278, lone: false },
    ],
  },
];
