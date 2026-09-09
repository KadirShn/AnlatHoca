import {
  examSubjectInsightsResponseSchema,
  historicalSubjectDatasetSchema,
  type ExamSubjectInsightsResponse,
  type HistoricalSubjectDataset,
} from "@anlat-hoca/contracts";

import { KPSS_LISANS_HISTORICAL_DATASETS } from "./kpss-lisans-historical-v1";

export function parseHistoricalSubjectDatasets(
  input: unknown,
): HistoricalSubjectDataset[] {
  const datasets = historicalSubjectDatasetSchema.array().min(1).parse(input);
  const keys = datasets.map(
    (dataset) => `${dataset.examPackId}:${dataset.subjectId}`,
  );

  if (new Set(keys).size !== keys.length) {
    throw new Error("Historical subject dataset keys must be unique.");
  }

  return datasets;
}

export const HISTORICAL_SUBJECT_DATASETS = parseHistoricalSubjectDatasets(
  KPSS_LISANS_HISTORICAL_DATASETS,
);

export function buildExamSubjectInsights(
  dataset: HistoricalSubjectDataset,
): ExamSubjectInsightsResponse {
  const years = [...dataset.coverage.administrationYears].sort(
    (left, right) => left - right,
  );
  const topics = dataset.topics
    .map((topic) => {
      const yearlyCounts = years.map((year) => ({
        year,
        count: dataset.observations.filter(
          (observation) =>
            observation.administrationYear === year &&
            observation.topicId === topic.id,
        ).length,
      }));
      const totalObserved = yearlyCounts.reduce(
        (total, item) => total + item.count,
        0,
      );

      return {
        topicId: topic.id,
        title: topic.title,
        totalObserved,
        averageObservedPerAdministration: Number(
          (totalObserved / years.length).toFixed(2),
        ),
        yearsAppeared: yearlyCounts.filter((item) => item.count > 0).length,
        evidenceStatus:
          dataset.coverage.type === "full" ? ("verified" as const) : ("partial" as const),
        yearlyCounts,
      };
    })
    .filter((topic) => topic.totalObserved > 0)
    .sort(
      (left, right) =>
        right.totalObserved - left.totalObserved ||
        right.yearsAppeared - left.yearsAppeared ||
        left.title.localeCompare(right.title, "tr"),
    );

  return examSubjectInsightsResponseSchema.parse({
    examPackId: dataset.examPackId,
    subjectId: dataset.subjectId,
    subjectTitle: dataset.subjectTitle,
    historicalDataVersion: dataset.historicalDataVersion,
    coverage: {
      ...dataset.coverage,
      administrationYears: years,
      administrationCount: years.length,
    },
    topics,
    sources: dataset.sources,
    methodology: dataset.methodology,
    disclaimer: dataset.disclaimer,
  });
}

export function findExamSubjectHistoricalInsights(
  examPackId: string,
  subjectId: string,
): ExamSubjectInsightsResponse | undefined {
  const dataset = HISTORICAL_SUBJECT_DATASETS.find(
    (candidate) =>
      candidate.examPackId === examPackId &&
      candidate.subjectId === subjectId,
  );

  return dataset ? buildExamSubjectInsights(dataset) : undefined;
}
