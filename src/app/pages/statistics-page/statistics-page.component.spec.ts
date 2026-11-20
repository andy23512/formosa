import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { db } from 'src/app/db';
import { KeyRecord } from 'src/app/models/key-record.models';
import { StatisticsPageComponent } from './statistics-page.component';

const record = (timestamp: number, cpm: number | null): KeyRecord => ({
  timestamp,
  lessonId: 'b',
  targetKey: 'ㄅ',
  inputKey: 'ㄅ',
  isCorrect: true,
  intervalToPreviousCorrectKey: null,
  cpm,
});

describe('StatisticsPageComponent', () => {
  let fixture: ComponentFixture<StatisticsPageComponent>;
  let component: StatisticsPageComponent;

  async function settle() {
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 20));
      fixture.detectChanges();
    }
  }
  async function create(records: KeyRecord[] = []) {
    await db.keyRecords.clear();
    await db.keyRecords.bulkAdd(records);
    fixture = TestBed.createComponent(StatisticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
  }
  const el = () => fixture.nativeElement as HTMLElement;
  const options = () => component.chartOptions()!;
  const series = () =>
    options().series as {
      type: string;
      name: string;
      data: [number, number][];
      dataGrouping: { groupPixelWidth: number };
    }[];

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
  });

  afterEach(() => db.keyRecords.clear());

  it('is a full height column', async () => {
    await create();
    expect(el().classList).toContain('flex');
    expect(el().classList).toContain('flex-col');
    expect(el().classList).toContain('h-full');
  });

  describe('while the records are loading', () => {
    it('has no chart options and shows no chart, then shows the chart', async () => {
      fixture = TestBed.createComponent(StatisticsPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.chartOptions()).toBeNull();
      expect(el().querySelector('highcharts-chart')).toBeNull();
      await settle();
      expect(el().querySelector('highcharts-chart')).not.toBeNull();
    });
  });

  describe('without records', () => {
    it('has an empty line, but still shows a chart', async () => {
      await create();
      expect(series().length).toBe(1);
      expect(series()[0].data).toEqual([]);
      expect(el().querySelector('highcharts-chart')).not.toBeNull();
    });
  });

  describe('with records', () => {
    beforeEach(() =>
      create([
        record(1000, 300),
        record(2000, 400),
        record(3000, null),
        record(4000, 0),
        record(5000, 250),
      ]),
    );

    it('has one line, named overall', () => {
      expect(series().length).toBe(1);
      expect(series()[0].type).toBe('line');
      expect(series()[0].name).toBe('statistics-page.overall');
    });

    it('has timestamp and speed pairs, without records that have no speed', () => {
      expect(series()[0].data).toEqual([
        [1000, 300],
        [2000, 400],
        [5000, 250],
      ]);
    });

    it('groups points in 20 pixel wide ranges', () => {
      expect(series()[0].dataGrouping.groupPixelWidth).toBe(20);
    });

    it('labels the axis with the unit and shows the time in local time', () => {
      expect((options().yAxis as { title: { text: string } }).title.text).toBe(
        'general.character-entry-speed-unit',
      );
      expect(options().time).toEqual({ useUTC: false });
      expect((options().xAxis as { type: string }).type).toBe('datetime');
    });

    it('hides the legend and the scrollbar', () => {
      expect(options().legend).toEqual({ enabled: false });
      expect(options().scrollbar).toEqual({ enabled: false });
    });

    it('formats the tooltip with one decimal and the unit', () => {
      const text = (options().tooltip!.formatter as Function).call({
        series: { name: 'statistics-page.overall' },
        y: 312.345,
      });
      expect(text).toBe(
        'statistics-page.overall: 312.3 general.character-entry-speed-unit',
      );
    });
  });

  it('follows records added later', async () => {
    await create([record(1000, 300)]);
    await db.keyRecords.add(record(2000, 500));
    await settle();
    expect(series()[0].data).toEqual([
      [1000, 300],
      [2000, 500],
    ]);
  });
});
