import assert from "node:assert/strict";
import test from "node:test";

import {
  examPackCatalogResponseSchema,
  examPackDetailResponseSchema,
} from "@anlat-hoca/contracts";
import { EXAM_PACKS, parseExamPackRegistry } from "@anlat-hoca/config";

import {
  ExamPackNotFoundError,
  getExamPackDetail,
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
