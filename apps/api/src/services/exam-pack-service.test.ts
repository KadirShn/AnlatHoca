import assert from "node:assert/strict";
import test from "node:test";

import {
  examPackCatalogResponseSchema,
  examPackDetailResponseSchema,
  examSubjectInsightsResponseSchema,
} from "@anlat-hoca/contracts";
import {
  EXAM_PACKS,
  HISTORICAL_SUBJECT_DATASETS,
  buildExamSubjectInsights,
  parseExamPackRegistry,
  parseHistoricalSubjectDatasets,
} from "@anlat-hoca/config";

import {
  ExamInsightsNotAvailableError,
  ExamPackNotFoundError,
  ExamSubjectNotFoundError,
  getExamPackDetail,
  getExamSubjectInsights,
  listExamPacks,
} from "./exam-pack-service";

test("catalog exposes the versioned TYT and KPSS Lisans packs", () => {
  const response = listExamPacks();

  assert.deepEqual(
    response.packs.map((pack) => pack.id),
    ["tyt", "kpss-lisans"],
  );
  assert.ok(response.packs.every((pack) => pack.contentVersion === "v1"));
  assert.doesNotThrow(() => examPackCatalogResponseSchema.parse(response));
});

test("registry pack and subject identifiers are unique and details validate", () => {
  const packIds = EXAM_PACKS.map((pack) => pack.id);
  assert.equal(new Set(packIds).size, packIds.length);

  for (const pack of EXAM_PACKS) {
    const subjectIds = pack.subjects.map((subject) => subject.id);
    assert.equal(new Set(subjectIds).size, subjectIds.length);
    assert.doesNotThrow(() =>
      examPackDetailResponseSchema.parse(getExamPackDetail(pack.id)),
    );
  }
});

test("unknown pack identifiers return the service's stable not-found error", () => {
  assert.throws(
    () => getExamPackDetail("bilinmeyen-paket"),
    ExamPackNotFoundError,
  );
});

test("registry rejects duplicate pack identifiers", () => {
  const firstPack = EXAM_PACKS[0];
  assert.ok(firstPack);

  assert.throws(() => parseExamPackRegistry([firstPack, firstPack]));
});

test("registry rejects duplicate subject identifiers", () => {
  const firstPack = EXAM_PACKS[0];
  const firstSubject = firstPack?.subjects[0];
  assert.ok(firstPack);
  assert.ok(firstSubject);

  assert.throws(() =>
    parseExamPackRegistry([
      { ...firstPack, subjects: [firstSubject, firstSubject] },
    ]),
  );
});

test("registry rejects empty labels and unsupported subject statuses", () => {
  const firstPack = EXAM_PACKS[0];
  const firstSubject = firstPack?.subjects[0];
  assert.ok(firstPack);
  assert.ok(firstSubject);

  assert.throws(() =>
    parseExamPackRegistry([{ ...firstPack, title: "" }]),
  );
  assert.throws(() =>
    parseExamPackRegistry([
      {
        ...firstPack,
        subjects: [{ ...firstSubject, status: "published" }],
      },
    ]),
  );
});

test("verified KPSS insights expose only Tarih and Coğrafya", () => {
  const tarih = getExamSubjectInsights("kpss-lisans", "tarih");
  const cografya = getExamSubjectInsights("kpss-lisans", "cografya");

  assert.doesNotThrow(() => examSubjectInsightsResponseSchema.parse(tarih));
  assert.doesNotThrow(() => examSubjectInsightsResponseSchema.parse(cografya));
  assert.equal(tarih.historicalDataVersion, "v1");
  assert.deepEqual(tarih.coverage.administrationYears, [
    2021, 2022, 2023, 2024, 2025,
  ]);
  assert.equal(tarih.coverage.type, "partial");
  assert.equal(cografya.coverage.type, "partial");
});

test("historical totals are derived from one primary-topic mapping per item", () => {
  for (const dataset of HISTORICAL_SUBJECT_DATASETS) {
    const response = buildExamSubjectInsights(dataset);
    const responseTotal = response.topics.reduce(
      (total, topic) =>
        total +
        (topic.evidenceStatus === "insufficient" ? 0 : topic.totalObserved),
      0,
    );

    assert.equal(responseTotal, dataset.observations.length);
    assert.equal(responseTotal, 10);
    for (const topic of response.topics) {
      assert.notEqual(topic.evidenceStatus, "insufficient");
      if (topic.evidenceStatus === "insufficient") continue;

      assert.equal(
        topic.totalObserved,
        topic.yearlyCounts.reduce((total, item) => total + item.count, 0),
      );
      assert.equal(
        topic.yearsAppeared,
        topic.yearlyCounts.filter((item) => item.count > 0).length,
      );
      assert.equal(
        topic.averageObservedPerAdministration,
        Number((topic.totalObserved / 5).toFixed(2)),
      );
    }
  }
});

test("every historical observation references a source from the same covered year", () => {
  for (const dataset of HISTORICAL_SUBJECT_DATASETS) {
    const sources = new Map(
      dataset.sources.map((source) => [source.id, source]),
    );
    for (const observation of dataset.observations) {
      const source = sources.get(observation.sourceId);
      assert.ok(source);
      assert.equal(source.administrationYear, observation.administrationYear);
      assert.ok(
        dataset.coverage.administrationYears.includes(
          observation.administrationYear,
        ),
      );
    }
  }
});

test("historical dataset validation rejects duplicate mappings and unknown topics", () => {
  const dataset = HISTORICAL_SUBJECT_DATASETS[0];
  const observation = dataset?.observations[0];
  assert.ok(dataset);
  assert.ok(observation);

  assert.throws(() =>
    parseHistoricalSubjectDatasets([
      {
        ...dataset,
        observations: [...dataset.observations, observation],
      },
    ]),
  );
  assert.throws(() =>
    parseHistoricalSubjectDatasets([
      {
        ...dataset,
        observations: [
          { ...observation, topicId: "tanimsiz-konu" },
          ...dataset.observations.slice(1),
        ],
      },
    ]),
  );
  assert.throws(() =>
    parseHistoricalSubjectDatasets([
      {
        ...dataset,
        topics: [...dataset.topics, dataset.topics[0]],
      },
    ]),
  );
  assert.throws(() =>
    parseHistoricalSubjectDatasets([
      {
        ...dataset,
        sources: dataset.sources.slice(1),
      },
    ]),
  );
});

test("metric contracts reject negative counts and duplicate years", () => {
  const response = getExamSubjectInsights("kpss-lisans", "tarih");
  const topic = response.topics[0];
  assert.ok(topic);
  assert.notEqual(topic.evidenceStatus, "insufficient");
  if (topic.evidenceStatus === "insufficient") return;

  assert.throws(() =>
    examSubjectInsightsResponseSchema.parse({
      ...response,
      topics: [
        {
          ...topic,
          totalObserved: -1,
        },
      ],
    }),
  );
  assert.throws(() =>
    examSubjectInsightsResponseSchema.parse({
      ...response,
      topics: [
        {
          ...topic,
          yearlyCounts: [topic.yearlyCounts[0], topic.yearlyCounts[0]],
        },
      ],
    }),
  );
});

test("insufficient evidence carries a reason instead of numeric zeroes", () => {
  const response = getExamSubjectInsights("kpss-lisans", "tarih");
  const parsed = examSubjectInsightsResponseSchema.parse({
    ...response,
    topics: [
      {
        topicId: "kanit-yetersiz",
        title: "Kanıtı Yetersiz Konu",
        evidenceStatus: "insufficient",
        reason: "Kamuya açık kaynak kapsamı sayısal sonuç için yeterli değil.",
      },
    ],
  });

  assert.equal(parsed.topics[0]?.evidenceStatus, "insufficient");
  assert.equal("totalObserved" in (parsed.topics[0] ?? {}), false);
});

test("topics use total, years appeared, and Turkish title as deterministic sort keys", () => {
  const response = getExamSubjectInsights("kpss-lisans", "cografya");

  for (let index = 1; index < response.topics.length; index += 1) {
    const previous = response.topics[index - 1];
    const current = response.topics[index];
    assert.ok(previous);
    assert.ok(current);
    assert.notEqual(previous.evidenceStatus, "insufficient");
    assert.notEqual(current.evidenceStatus, "insufficient");
    if (
      previous.evidenceStatus === "insufficient" ||
      current.evidenceStatus === "insufficient"
    ) {
      continue;
    }

    const comparison =
      previous.totalObserved - current.totalObserved ||
      previous.yearsAppeared - current.yearsAppeared ||
      -previous.title.localeCompare(current.title, "tr");
    assert.ok(comparison >= 0);
  }
});

test("unknown subjects and unavailable datasets return distinct stable errors", () => {
  assert.throws(
    () => getExamSubjectInsights("kpss-lisans", "bilinmeyen"),
    ExamSubjectNotFoundError,
  );
  assert.throws(
    () => getExamSubjectInsights("kpss-lisans", "turkce"),
    ExamInsightsNotAvailableError,
  );
  assert.throws(
    () => getExamSubjectInsights("bilinmeyen", "tarih"),
    ExamPackNotFoundError,
  );
});
