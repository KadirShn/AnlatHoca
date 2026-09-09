import {
  historicalSubjectDatasetSchema,
  type HistoricalExamSource,
  type HistoricalSubjectDataset,
} from "@anlat-hoca/contracts";

export const KPSS_HISTORICAL_DATA_VERSION = "v1" as const;
export const KPSS_HISTORICAL_ADMINISTRATION_YEARS = [
  2021, 2022, 2023, 2024, 2025,
] as const;

const publisher =
  "T.C. Ölçme, Seçme ve Yerleştirme Merkezi Başkanlığı (ÖSYM)";

const sources = [
  {
    id: "osym-kpss-2021-public-booklet",
    administrationYear: 2021,
    title: "2021-KPSS Lisans Genel Yetenek-Genel Kültür kamuya açık %10 kitapçığı",
    publisher,
    url: "https://dokuman.osym.gov.tr/pdfdokuman/2021/KPSS/gy_gk_01082021.pdf",
    accessedAt: "2026-09-09",
    coverage: "partial",
  },
  {
    id: "osym-kpss-2022-public-booklet",
    administrationYear: 2022,
    title: "2022-KPSS Lisans Genel Yetenek-Genel Kültür kamuya açık %10 kitapçığı (18 Eylül yeniden uygulama)",
    publisher,
    url: "https://dokuman.osym.gov.tr/pdfdokuman/2022/KPSS/LISANS/kpss_lisans_gygk_18092022.pdf",
    accessedAt: "2026-09-09",
    coverage: "partial",
  },
  {
    id: "osym-kpss-2023-public-booklet",
    administrationYear: 2023,
    title: "2023-KPSS Lisans Genel Yetenek-Genel Kültür kamuya açık %10 kitapçığı",
    publisher,
    url: "https://dokuman.osym.gov.tr/pdfdokuman/2023/KPSS/LISANS/gygk_23072023nfy.pdf",
    accessedAt: "2026-09-09",
    coverage: "partial",
  },
  {
    id: "osym-kpss-2024-public-booklet",
    administrationYear: 2024,
    title: "2024-KPSS Lisans Genel Yetenek-Genel Kültür kamuya açık %10 kitapçığı",
    publisher,
    url: "https://dokuman.osym.gov.tr/pdfdokuman/2024/KPSS/LISANS/GYGK14072024.pdf",
    accessedAt: "2026-09-09",
    coverage: "partial",
  },
  {
    id: "osym-kpss-2025-public-booklet",
    administrationYear: 2025,
    title: "2025-KPSS A Grubu Genel Yetenek-Genel Kültür kamuya açık %10 kitapçığı",
    publisher,
    url: "https://dokuman.osym.gov.tr/pdfdokuman/2025/KPSS/GY-GK/gygk_07092025lsy.pdf",
    accessedAt: "2026-09-09",
    coverage: "partial",
  },
] as const satisfies readonly HistoricalExamSource[];

const shared = {
  examPackId: "kpss-lisans",
  historicalDataVersion: KPSS_HISTORICAL_DATA_VERSION,
  coverage: {
    administrationYears: [...KPSS_HISTORICAL_ADMINISTRATION_YEARS],
    type: "partial",
    note: "2021–2025 arasındaki beş tamamlanmış uygulamanın yalnızca ÖSYM tarafından kamuya açılan %10 örnek kitapçıkları kapsanır. Sayılar tam sınav dağılımını göstermez.",
  },
  sources: [...sources],
  methodology:
    "Her kamuya açık örnekte görülen Tarih ve Coğrafya maddesi, soru metni saklanmadan, tek bir baskın konuya elle sınıflandırıldı. Konu toplamları ve yıllık ortalamalar bu kaynak-kayıt eşleştirmelerinden deterministik olarak hesaplanır; kamuya kapalı sorular için çıkarım veya tahmin yapılmaz.",
  disclaimer:
    "Bu veriler yalnızca kamuya açık ÖSYM örneklerinde gözlenen geçmiş dağılımdır; gelecek sınav için soru olasılığı, garanti veya tam sınav konu dağılımı değildir.",
} as const;

export const KPSS_LISANS_HISTORICAL_DATASETS = [
  historicalSubjectDatasetSchema.parse({
    ...shared,
    subjectId: "tarih",
    subjectTitle: "Tarih",
    topics: [
      {
        id: "osmanli-siyasi-tarihi",
        title: "Osmanlı Siyasi Tarihi",
        aliases: ["Osmanlı tarihi", "Osmanlı siyasi gelişmeleri"],
      },
      {
        id: "ataturk-ilke-ve-inkilaplari",
        title: "Atatürk İlkeleri ve İnkılapları",
        aliases: ["Atatürk dönemi", "Cumhuriyet dönemi inkılapları"],
      },
      {
        id: "kurtulus-savasi-ve-milli-mucadele",
        title: "Kurtuluş Savaşı ve Millî Mücadele",
        aliases: ["Millî Mücadele", "Kurtuluş Savaşı diplomasisi"],
      },
      {
        id: "osmanli-kultur-ve-medeniyet",
        title: "Osmanlı Kültür ve Medeniyeti",
        aliases: ["Osmanlı kurumları", "Osmanlı ekonomik düzeni"],
      },
      {
        id: "cagdas-turk-ve-dunya-tarihi",
        title: "Çağdaş Türk ve Dünya Tarihi",
        aliases: ["Yakın dönem dünya tarihi", "20. yüzyıl dünya tarihi"],
      },
    ],
    observations: [
      { administrationYear: 2021, subjectId: "tarih", questionNumber: 12, topicId: "osmanli-siyasi-tarihi", sourceId: "osym-kpss-2021-public-booklet" },
      { administrationYear: 2021, subjectId: "tarih", questionNumber: 22, topicId: "ataturk-ilke-ve-inkilaplari", sourceId: "osym-kpss-2021-public-booklet" },
      { administrationYear: 2022, subjectId: "tarih", questionNumber: 11, topicId: "osmanli-siyasi-tarihi", sourceId: "osym-kpss-2022-public-booklet" },
      { administrationYear: 2022, subjectId: "tarih", questionNumber: 23, topicId: "ataturk-ilke-ve-inkilaplari", sourceId: "osym-kpss-2022-public-booklet" },
      { administrationYear: 2023, subjectId: "tarih", questionNumber: 3, topicId: "osmanli-siyasi-tarihi", sourceId: "osym-kpss-2023-public-booklet" },
      { administrationYear: 2023, subjectId: "tarih", questionNumber: 19, topicId: "kurtulus-savasi-ve-milli-mucadele", sourceId: "osym-kpss-2023-public-booklet" },
      { administrationYear: 2024, subjectId: "tarih", questionNumber: 9, topicId: "osmanli-kultur-ve-medeniyet", sourceId: "osym-kpss-2024-public-booklet" },
      { administrationYear: 2024, subjectId: "tarih", questionNumber: 21, topicId: "kurtulus-savasi-ve-milli-mucadele", sourceId: "osym-kpss-2024-public-booklet" },
      { administrationYear: 2025, subjectId: "tarih", questionNumber: 7, topicId: "osmanli-siyasi-tarihi", sourceId: "osym-kpss-2025-public-booklet" },
      { administrationYear: 2025, subjectId: "tarih", questionNumber: 24, topicId: "cagdas-turk-ve-dunya-tarihi", sourceId: "osym-kpss-2025-public-booklet" },
    ],
  }),
  historicalSubjectDatasetSchema.parse({
    ...shared,
    subjectId: "cografya",
    subjectTitle: "Coğrafya",
    topics: [
      {
        id: "yer-sekilleri-ve-jeoloji",
        title: "Yer Şekilleri ve Jeoloji",
        aliases: ["Jeomorfoloji", "Türkiye'nin yer şekilleri"],
      },
      {
        id: "iklim-ve-bitki-ortusu",
        title: "İklim ve Bitki Örtüsü",
        aliases: ["Türkiye iklimi", "Doğal bitki örtüsü"],
      },
      {
        id: "ekonomik-cografya",
        title: "Ekonomik Coğrafya",
        aliases: ["Sanayi coğrafyası", "Üretim faaliyetleri"],
      },
      {
        id: "nufus-ve-yerlesme",
        title: "Nüfus ve Yerleşme",
        aliases: ["Nüfus coğrafyası", "Yerleşme coğrafyası"],
      },
      {
        id: "turkiyenin-cografi-konumu",
        title: "Türkiye'nin Coğrafi Konumu",
        aliases: ["Matematik konum", "Özel konum"],
      },
      {
        id: "ulasim",
        title: "Ulaşım Coğrafyası",
        aliases: ["Ulaşım sistemleri", "Ulaşım ve çevre"],
      },
      {
        id: "turizm-ve-kulturel-cografya",
        title: "Turizm ve Kültürel Coğrafya",
        aliases: ["Turizm coğrafyası", "Kültürel miras"],
      },
    ],
    observations: [
      { administrationYear: 2021, subjectId: "cografya", questionNumber: 32, topicId: "iklim-ve-bitki-ortusu", sourceId: "osym-kpss-2021-public-booklet" },
      { administrationYear: 2021, subjectId: "cografya", questionNumber: 43, topicId: "ulasim", sourceId: "osym-kpss-2021-public-booklet" },
      { administrationYear: 2022, subjectId: "cografya", questionNumber: 32, topicId: "yer-sekilleri-ve-jeoloji", sourceId: "osym-kpss-2022-public-booklet" },
      { administrationYear: 2022, subjectId: "cografya", questionNumber: 41, topicId: "ekonomik-cografya", sourceId: "osym-kpss-2022-public-booklet" },
      { administrationYear: 2023, subjectId: "cografya", questionNumber: 32, topicId: "yer-sekilleri-ve-jeoloji", sourceId: "osym-kpss-2023-public-booklet" },
      { administrationYear: 2023, subjectId: "cografya", questionNumber: 33, topicId: "nufus-ve-yerlesme", sourceId: "osym-kpss-2023-public-booklet" },
      { administrationYear: 2024, subjectId: "cografya", questionNumber: 27, topicId: "turkiyenin-cografi-konumu", sourceId: "osym-kpss-2024-public-booklet" },
      { administrationYear: 2024, subjectId: "cografya", questionNumber: 40, topicId: "iklim-ve-bitki-ortusu", sourceId: "osym-kpss-2024-public-booklet" },
      { administrationYear: 2025, subjectId: "cografya", questionNumber: 30, topicId: "yer-sekilleri-ve-jeoloji", sourceId: "osym-kpss-2025-public-booklet" },
      { administrationYear: 2025, subjectId: "cografya", questionNumber: 42, topicId: "turizm-ve-kulturel-cografya", sourceId: "osym-kpss-2025-public-booklet" },
    ],
  }),
] as const satisfies readonly HistoricalSubjectDataset[];
