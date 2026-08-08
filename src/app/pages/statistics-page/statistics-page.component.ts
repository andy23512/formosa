import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostBinding,
  inject,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { liveQuery } from 'dexie';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts/highstock';
import theme from 'highcharts/themes/high-contrast-dark';
import { Observable } from 'rxjs';
import { db } from 'src/app/db';
import { KeyRecord } from 'src/app/models/key-record.models';
import { computedAsync } from 'src/app/utils/computed-async.utils';
theme(Highcharts);

@Component({
  selector: 'app-statistics-page',
  standalone: true,
  imports: [HighchartsChartModule],
  templateUrl: './statistics-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPageComponent {
  @HostBinding('class') classes = 'flex flex-col gap-2 h-full';
  private translateService = inject(TranslateService);

  Highcharts: typeof Highcharts = Highcharts;
  chartConstructor: string = 'stockChart';
  updateFlag = false;

  keyRecords = computedAsync(() => {
    return liveQuery(() => db.keyRecords.toArray()) as any as Observable<
      KeyRecord[]
    >;
  });
  chartOptions = computed<Highcharts.Options | null>(() => {
    const keyRecords = this.keyRecords();
    if (!keyRecords) {
      return null;
    }
    const cpmSeries: Highcharts.SeriesOptionsType[] = [
      {
        type: 'line' as const,
        data: keyRecords
          .filter((k) => k.cpm)
          .map((k) => [k.timestamp, k.cpm]),
        name: this.translateService.instant('statistics-page.overall'),
        dataGrouping: {
          groupPixelWidth: 20,
        },
        marker: {
          enabled: true,
          radius: 5,
        },
      },
    ];
    const unit = this.translateService.instant(
      'general.character-entry-speed-unit',
    );
    return {
      legend: { enabled: false },
      scrollbar: { enabled: false },
      series: cpmSeries,
      time: {
        useUTC: false,
      },
      tooltip: {
        formatter: function () {
          return `${this.series.name}: ${this.y?.toFixed(1)} ` + unit;
        },
      },
      yAxis: {
        title: {
          text: unit,
        },
      },
      xAxis: {
        type: 'datetime',
        ordinal: false,
        breaks: undefined,
      },
    };
  });
}
