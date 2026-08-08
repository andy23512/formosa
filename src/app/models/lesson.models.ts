export interface Lesson {
  id: string;
  name: string;
  components: string[];
  componentNames: string[];
}

export interface ResolvedLesson extends Lesson {
  previousLessonUrl: string | null;
  nextLessonUrl: string | null;
}
