import type { LessonDuration } from "@anlat-hoca/contracts";

export interface IntroLessonSlide {
  id: string;
  type: "intro";
  title: string;
  durationMinutes: LessonDuration;
  overview: string;
}

export interface ObjectivesLessonSlide {
  id: string;
  type: "objectives";
  objectives: string[];
}

export interface SectionSummaryLessonSlide {
  id: string;
  type: "section-summary";
  sectionNumber: number;
  sectionCount: number;
  title: string;
  estimatedMinutes: number;
  keyPoints: string[];
  memoryTip?: string;
}

export interface SectionExplanationLessonSlide {
  id: string;
  type: "section-explanation";
  sectionNumber: number;
  title: string;
  partNumber: number;
  partCount: number;
  explanation: string;
  narrationText: string;
}

export interface RecapLessonSlide {
  id: string;
  type: "recap";
  partNumber: number;
  partCount: number;
  items: string[];
}

export interface SkippedTopicsLessonSlide {
  id: string;
  type: "skipped-topics";
  items: string[];
}

export type LessonSlide =
  | IntroLessonSlide
  | ObjectivesLessonSlide
  | SectionSummaryLessonSlide
  | SectionExplanationLessonSlide
  | RecapLessonSlide
  | SkippedTopicsLessonSlide;
