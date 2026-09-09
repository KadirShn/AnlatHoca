import type {
  ExamSubjectInsightsResponse,
  HistoricalTopicInsight,
} from "@anlat-hoca/contracts";

export const EXAM_STUDY_DURATIONS = [10, 30, 60] as const;

export type ExamStudyDuration = (typeof EXAM_STUDY_DURATIONS)[number];

export interface ExamStudyPlanTopic {
  topicId: string;
  title: string;
  allocatedMinutes: number;
  observedCount: number;
  yearsAppeared: number;
}

export interface ExamStudyPlan {
  durationMinutes: ExamStudyDuration;
  plannedTopics: ExamStudyPlanTopic[];
  skippedTopics: {
    topicId: string;
    title: string;
  }[];
}

const TOPIC_LIMITS: Record<ExamStudyDuration, number> = {
  10: 3,
  30: 5,
  60: Number.POSITIVE_INFINITY,
};

type MetricTopic = Extract<
  HistoricalTopicInsight,
  { evidenceStatus: "verified" | "partial" }
>;

export function createExamStudyPlan(
  insights: Pick<ExamSubjectInsightsResponse, "topics">,
  durationMinutes: ExamStudyDuration,
): ExamStudyPlan | null {
  const rankedTopics = insights.topics
    .filter(isPlannableTopic)
    .sort(compareTopics);

  if (rankedTopics.length === 0) {
    return null;
  }

  const selectedCount = Math.min(
    rankedTopics.length,
    TOPIC_LIMITS[durationMinutes],
  );
  const selectedTopics = rankedTopics.slice(0, selectedCount);
  const baseMinutes = Math.floor(durationMinutes / selectedCount);
  const remainder = durationMinutes % selectedCount;

  return {
    durationMinutes,
    plannedTopics: selectedTopics.map((topic, index) => ({
      topicId: topic.topicId,
      title: topic.title,
      allocatedMinutes: baseMinutes + (index < remainder ? 1 : 0),
      observedCount: topic.totalObserved,
      yearsAppeared: topic.yearsAppeared,
    })),
    skippedTopics: rankedTopics.slice(selectedCount).map((topic) => ({
      topicId: topic.topicId,
      title: topic.title,
    })),
  };
}

function isPlannableTopic(
  topic: HistoricalTopicInsight,
): topic is MetricTopic {
  return (
    topic.evidenceStatus !== "insufficient" &&
    topic.totalObserved > 0 &&
    topic.yearsAppeared > 0
  );
}

function compareTopics(left: MetricTopic, right: MetricTopic): number {
  return (
    right.totalObserved - left.totalObserved ||
    right.yearsAppeared - left.yearsAppeared ||
    left.title.localeCompare(right.title, "tr")
  );
}
