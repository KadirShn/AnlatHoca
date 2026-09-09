import assert from "node:assert/strict";
import test from "node:test";

import {
  createExamStudyPlan,
  EXAM_STUDY_DURATIONS,
} from "../src/features/exam-study-plan/create-exam-study-plan.ts";

const metric = (topicId, title, totalObserved, yearsAppeared) => ({
  topicId,
  title,
  totalObserved,
  averageObservedPerAdministration: totalObserved / 5,
  yearsAppeared,
  evidenceStatus: "partial",
  yearlyCounts: [],
});

const insights = {
  topics: [
    metric("altinci", "Ulaşım Coğrafyası", 1, 1),
    metric("ucuncu", "Atatürk İlkeleri", 2, 2),
    metric("birinci", "Osmanlı Siyasi Tarihi", 4, 4),
    metric("besinci", "Nüfus ve Yerleşme", 1, 1),
    metric("ikinci", "Yer Şekilleri", 3, 3),
    metric("dorduncu", "Kurtuluş Savaşı", 2, 2),
    metric("yedinci", "Turizm Coğrafyası", 1, 1),
    {
      topicId: "kanit-yetersiz",
      title: "Kanıtı Yetersiz Başlık",
      evidenceStatus: "insufficient",
      reason: "Sayısal planlama için yeterli kanıt yok.",
    },
  ],
};

for (const duration of EXAM_STUDY_DURATIONS) {
  test(`${duration} minute allocations sum exactly to the budget`, () => {
    const plan = createExamStudyPlan(insights, duration);

    assert.ok(plan);
    assert.equal(
      plan.plannedTopics.reduce(
        (total, topic) => total + topic.allocatedMinutes,
        0,
      ),
      duration,
    );
    assert.ok(
      plan.plannedTopics.every((topic) => topic.allocatedMinutes > 0),
    );
  });
}

test("ranking follows observed total, years appeared, and Turkish title", () => {
  const tiedInsights = {
    topics: [
      metric("b", "Şehir Coğrafyası", 2, 2),
      metric("c", "Çevre Coğrafyası", 2, 2),
      metric("a", "Yüksek Toplam", 3, 1),
      metric("d", "Daha Çok Yıl", 2, 3),
    ],
  };
  const plan = createExamStudyPlan(tiedInsights, 60);

  assert.deepEqual(
    plan?.plannedTopics.map((topic) => topic.topicId),
    ["a", "d", "c", "b"],
  );
});

test("shorter plans report lower-ranked topics as skipped", () => {
  const tenMinutePlan = createExamStudyPlan(insights, 10);
  const thirtyMinutePlan = createExamStudyPlan(insights, 30);
  const sixtyMinutePlan = createExamStudyPlan(insights, 60);

  assert.equal(tenMinutePlan?.plannedTopics.length, 3);
  assert.equal(tenMinutePlan?.skippedTopics.length, 4);
  assert.equal(thirtyMinutePlan?.plannedTopics.length, 5);
  assert.equal(thirtyMinutePlan?.skippedTopics.length, 2);
  assert.equal(sixtyMinutePlan?.plannedTopics.length, 7);
  assert.equal(sixtyMinutePlan?.skippedTopics.length, 0);
});

test("the same input always produces the same plan", () => {
  assert.deepEqual(
    createExamStudyPlan(insights, 30),
    createExamStudyPlan(insights, 30),
  );
});

test("plans contain no future-probability field", () => {
  const plan = createExamStudyPlan(insights, 30);
  const serialized = JSON.stringify(plan);

  assert.doesNotMatch(serialized, /probability|likelihood|expected/i);
});

test("empty or entirely insufficient datasets return no plan", () => {
  assert.equal(createExamStudyPlan({ topics: [] }, 10), null);
  assert.equal(
    createExamStudyPlan(
      {
        topics: [
          {
            topicId: "kanit-yetersiz",
            title: "Kanıtı Yetersiz Başlık",
            evidenceStatus: "insufficient",
            reason: "Sayısal planlama için yeterli kanıt yok.",
          },
        ],
      },
      30,
    ),
    null,
  );
});
