export interface HomePageBackgroundGlyph {
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  glyph: string;
}

export interface HomePageBackgroundLink {
  d: string;
}

export interface HomePageBackgroundMarker {
  x: number;
  y: number;
  lone: boolean;
}

export interface HomePageBackgroundScene {
  glyphs: HomePageBackgroundGlyph[];
  links: HomePageBackgroundLink[];
  markers: HomePageBackgroundMarker[];
}
