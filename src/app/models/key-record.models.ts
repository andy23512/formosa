export interface KeyRecord {
  id?: number;
  timestamp: number;
  lessonId: string;
  targetKey: string;
  inputKey: string;
  isCorrect: boolean;
  intervalToPreviousCorrectKey: number | null;
  cpm: number | null;
}
