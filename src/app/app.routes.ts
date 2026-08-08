import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Route, Router } from '@angular/router';
import { ResolvedLesson } from './models/lesson.models';

export const APP_ROUTES: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/home-page/home-page.component').then(
        (m) => m.HomePageComponent,
      ),
  },
  {
    path: 'information',
    loadComponent: () =>
      import('./pages/information-page/information-page.component').then(
        (m) => m.InformationPageComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings-page/settings-page.component').then(
        (m) => m.SettingsPageComponent,
      ),
  },
  {
    path: 'lesson/:lessonId',
    loadComponent: () =>
      import('./pages/lesson-page/lesson-page.component').then(
        (m) => m.LessonPageComponent,
      ),
    resolve: {
      lesson: async (
        route: ActivatedRouteSnapshot,
      ): Promise<ResolvedLesson | null> => {
        const router = inject(Router);
        const { LESSONS } = await import('./data/lessons');
        const lessonId = route.paramMap.get('lessonId');
        const lessonIndex = LESSONS.findIndex(
          (lesson) => lesson.id === lessonId,
        );

        if (lessonIndex === -1) {
          router.navigate(['/lesson-not-found']);
          return null;
        }

        const lesson = LESSONS[lessonIndex];
        const previous = lessonIndex === 0 ? null : LESSONS[lessonIndex - 1];
        const next =
          lessonIndex === LESSONS.length - 1 ? null : LESSONS[lessonIndex + 1];

        return {
          ...lesson,
          previousLessonUrl: previous ? `/lesson/${previous.id}` : null,
          nextLessonUrl: next ? `/lesson/${next.id}` : null,
        };
      },
    },
  },
  {
    path: 'lesson-not-found',
    loadComponent: () =>
      import(
        './pages/lesson-not-found-page/lesson-not-found-page.component'
      ).then((m) => m.LessonNotFoundPageComponent),
  },
  {
    path: 'statistics',
    loadComponent: () =>
      import('./pages/statistics-page/statistics-page.component').then(
        (m) => m.StatisticsPageComponent,
      ),
  },
  {
    path: 'chord',
    loadComponent: () =>
      import('./pages/chord-page/chord-page.component').then(
        (m) => m.ChordPageComponent,
      ),
  },
  {
    path: 'layout-schematic',
    loadComponent: () =>
      import(
        './pages/layout-schematic-page/layout-schematic-page.component'
      ).then((m) => m.LayoutSchematicPageComponent),
  },
];
