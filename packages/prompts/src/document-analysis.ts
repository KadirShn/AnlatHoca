export const DOCUMENT_ANALYSIS_PROMPT_VERSION = "v1" as const;

export const DOCUMENT_ANALYSIS_PROMPT = [
  "Bu eğitim belgesini dikkatle incele ve yalnızca belgenin desteklediği bilgilere dayanarak Türkçe bir çalışma analizi üret.",
  "",
  "Kurallar:",
  "- Belgenin ana konusunu ve yapısını belirle.",
  "- Kısa, açık ve tekrar etmeyen bir belge özeti yaz.",
  "- Birbiriyle örtüşen konuları birleştir; önemsiz ayrıntıları ayrı konu yapma.",
  "- En az 1 anlamlı konu üret; mümkünse 20 konuyu aşma, hiçbir durumda 25 konuyu aşma.",
  "- Her konu için kısa bir özet ve 2-6 somut öğrenme noktası ver.",
  "- importance değerini 1-5 arasında tam sayı olarak, konunun yalnızca BU BELGE içindeki merkeziliğine göre belirle. Bu değer sınavda çıkma olasılığı değildir.",
  "- difficulty değerini 1-5 arasında tam sayı olarak, kavramsal karmaşıklığa göre belirle.",
  "- Kaynakta olmayan bilgi, çıkarım, tarih, kişi veya iddia uydurma.",
  "- Belge açıkça söylemiyorsa sınav olasılığı hakkında iddiada bulunma.",
  "- Uzun alıntılar yapma ve belgenin büyük bölümlerini yeniden üretme.",
  "- Sonucu daha sonra ders üretiminde kullanılabilecek kadar odaklı tut.",
  "- Yalnızca istenen JSON yapısını döndür; açıklama veya Markdown ekleme.",
].join("\n");
