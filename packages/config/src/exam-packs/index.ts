import {
  examPackRegistrySchema,
  type ExamPackDefinition,
} from "@anlat-hoca/contracts";

export function parseExamPackRegistry(input: unknown): ExamPackDefinition[] {
  return examPackRegistrySchema.parse(input);
}

export const EXAM_PACKS = parseExamPackRegistry([
  {
    id: "tyt",
    title: "Temel Yeterlilik Testi",
    shortTitle: "TYT",
    description:
      "Üniversite sınavına hazırlanırken çalışabileceğin temel alanları bir araya getirir.",
    audience: "TYT oturumuna hazırlanan öğrenciler",
    contentVersion: "v1",
    subjects: [
      {
        id: "turkce",
        title: "Türkçe",
        status: "coming_soon",
      },
      {
        id: "temel-matematik",
        title: "Temel Matematik",
        status: "coming_soon",
      },
      {
        id: "sosyal-bilimler",
        title: "Sosyal Bilimler",
        status: "coming_soon",
      },
      {
        id: "fen-bilimleri",
        title: "Fen Bilimleri",
        status: "coming_soon",
      },
    ],
  },
  {
    id: "kpss-lisans",
    title: "KPSS Lisans",
    shortTitle: "KPSS Lisans",
    description:
      "Genel Yetenek ve Genel Kültür hazırlığı için temel çalışma alanlarını bir araya getirir.",
    audience: "KPSS Lisans Genel Yetenek ve Genel Kültür oturumlarına hazırlanan adaylar",
    contentVersion: "v1",
    subjects: [
      {
        id: "turkce",
        title: "Türkçe",
        status: "coming_soon",
      },
      {
        id: "matematik",
        title: "Matematik",
        status: "coming_soon",
      },
      {
        id: "tarih",
        title: "Tarih",
        status: "available",
      },
      {
        id: "cografya",
        title: "Coğrafya",
        status: "available",
      },
      {
        id: "vatandaslik",
        title: "Vatandaşlık",
        status: "coming_soon",
      },
    ],
  },
]);

export function findExamPack(packId: string): ExamPackDefinition | undefined {
  return EXAM_PACKS.find((pack) => pack.id === packId);
}
