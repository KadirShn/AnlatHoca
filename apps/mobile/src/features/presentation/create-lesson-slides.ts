import type { Lesson } from "@anlat-hoca/contracts";

import type { LessonSlide, RecapLessonSlide } from "./lesson-slide";
import { splitExplanation } from "./split-explanation";

const MAX_RECAP_ITEMS_PER_SLIDE = 5;
const MAX_RECAP_CHARACTERS_PER_SLIDE = 650;

export function createLessonSlides(lesson: Lesson): LessonSlide[] {
  const slides: LessonSlide[] = [
    {
      id: `${lesson.id}:intro`,
      type: "intro",
      title: lesson.title,
      durationMinutes: lesson.durationMinutes,
      overview: lesson.overview,
    },
  ];

  if (lesson.learningObjectives.length > 0) {
    slides.push({
      id: `${lesson.id}:objectives`,
      type: "objectives",
      objectives: [...lesson.learningObjectives],
    });
  }

  lesson.sections.forEach((section, sectionIndex) => {
    const sectionNumber = sectionIndex + 1;
    slides.push({
      id: `${lesson.id}:section:${sectionNumber}:summary`,
      type: "section-summary",
      sectionNumber,
      sectionCount: lesson.sections.length,
      title: section.title,
      estimatedMinutes: section.estimatedMinutes,
      keyPoints: [...section.keyPoints],
      ...(section.memoryTip ? { memoryTip: section.memoryTip } : {}),
    });

    const explanationChunks = splitExplanation(section.explanation);
    explanationChunks.forEach((explanation, chunkIndex) => {
      slides.push({
        id: `${lesson.id}:section:${sectionNumber}:explanation:${chunkIndex + 1}`,
        type: "section-explanation",
        sectionNumber,
        title: section.title,
        partNumber: chunkIndex + 1,
        partCount: explanationChunks.length,
        explanation,
        narrationText: explanation,
      });
    });
  });

  const recapGroups = groupRecapItems(lesson.recap);
  recapGroups.forEach((items, groupIndex) => {
    const recapSlide: RecapLessonSlide = {
      id: `${lesson.id}:recap:${groupIndex + 1}`,
      type: "recap",
      partNumber: groupIndex + 1,
      partCount: recapGroups.length,
      items,
    };
    slides.push(recapSlide);
  });

  if (lesson.skippedTopics.length > 0) {
    slides.push({
      id: `${lesson.id}:skipped-topics`,
      type: "skipped-topics",
      items: [...lesson.skippedTopics],
    });
  }

  return slides;
}

function groupRecapItems(items: string[]): string[][] {
  const groups: string[][] = [];
  let current: string[] = [];
  let currentCharacters = 0;

  for (const item of items) {
    const nextCharacters = currentCharacters + item.length;
    const exceedsLimit =
      current.length >= MAX_RECAP_ITEMS_PER_SLIDE ||
      (current.length > 0 && nextCharacters > MAX_RECAP_CHARACTERS_PER_SLIDE);

    if (exceedsLimit) {
      groups.push(current);
      current = [];
      currentCharacters = 0;
    }

    current.push(item);
    currentCharacters += item.length;
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
}
