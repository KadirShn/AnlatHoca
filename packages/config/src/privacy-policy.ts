export const PUBLIC_PRIVACY_POLICY_URL =
  "https://anlat-hoca-api.shnkadir.workers.dev/privacy" as const;

export const PRIVACY_POLICY_LAST_UPDATED = "10 Eylül 2026" as const;

export const PRIVACY_POLICY_INTRO =
  "Bu politika, Anlat Hoca V1'in hangi verileri hangi amaçlarla işlediğini sade bir dille açıklar." as const;

export interface PrivacyPolicySection {
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export const PRIVACY_POLICY_SECTIONS: readonly PrivacyPolicySection[] = [
  {
    title: "Hesapsız kullanım ve kurulum kimliği",
    paragraphs: [
      "Anlat Hoca V1'de kullanıcı hesabı veya giriş sistemi yoktur. Uygulama, çalışmalarını aynı kurulumla ilişkilendirebilmek için rastgele bir anonim kurulum UUID'si oluşturur. Bu değer yerel cihazda güvenli saklama alanında tutulur ve sunucuya gönderilir.",
      "Kurulum UUID'si güçlü bir kimlik doğrulama yöntemi, gerçek kimlik veya donanım kimliği değildir. Yalnızca misafir verilerini kurulum kapsamında ayırmak için kullanılır.",
    ],
  },
  {
    title: "PDF yükleme ve yapay zekâ işlemleri",
    paragraphs: [
      "Bir PDF yüklemek isteğe bağlıdır. Yüklediğin belge, talep ettiğin analiz ve ders oluşturma işlemleri için Anlat Hoca'nın Cloudflare üzerindeki sunucusundan Google'ın Gemini hizmetine gönderilir.",
      "Belgenin ham PDF baytları Anlat Hoca'nın D1 veritabanında saklanmaz. Uygulanan analiz ve ders akışlarında Gemini'nin geçici dosya işleme özelliği kullanılır. Belge adı, boyutu, dosya türü ve geçici hizmet referansı gibi işlem metadatası D1'de tutulabilir.",
      "Kişisel, gizli, çok hassas veya işlem için gereksiz kişisel bilgiler içeren belgeleri yüklememeni öneririz.",
    ],
  },
  {
    title: "Kaydedilen çalışma verileri",
    paragraphs: [
      "Üretilen analizler, dersler, quiz içeriği, quiz cevapları ve sonuçları ile Hocaya Sor konuşmaları Cloudflare D1'de saklanabilir. Bunun amacı, aynı kurulumda çalışmalarını ve geçmişini yeniden açabilmendir.",
      "Hocaya Sor kullandığında sorun, ilgili ders içeriği ve sınırlı yakın konuşma bağlamı yanıt üretmek için yapay zekâ hizmetine gönderilir. Başarılı soru ve yanıt çiftleri konuşma geçmişinde saklanır.",
    ],
  },
  {
    title: "Sınava Hazırlan verileri",
    paragraphs: [
      "KPSS geçmiş konu gözlemleri, uygulamayla birlikte sunulan statik ve özenle hazırlanmış ürün verileridir. Bu ekranları görüntülemek veya yerel çalışma planı oluşturmak kullanıcı verisini yapay zekâ hizmetine göndermez.",
    ],
  },
  {
    title: "Hizmet sağlayıcılar ve kullanım amacı",
    paragraphs: [
      "Anlat Hoca, uygulama sunucusu ve veritabanı için Cloudflare hizmetlerini; istenen yapay zekâ işlemleri için Google Gemini'yi kullanır. Veriler yalnızca uygulamanın çalışması, istenen içeriğin oluşturulması ve kaydedilmiş çalışmaların yeniden açılması amaçlarıyla bu altyapılarda işlenir.",
      "V1; reklam, reklam kimliği, analiz/izleme SDK'sı veya kullanıcı hesabı içermez. Bu politika, hizmet sağlayıcıların kendi koşulları ve veri işleme uygulamaları yerine geçmez.",
    ],
  },
  {
    title: "Saklama ve silme sınırlaması",
    paragraphs: [
      "V1'de kurulum kapsamındaki tüm sunucu verilerini uygulama içinden topluca silme özelliği bulunmaz. Uygulamayı kaldırmak veya cihazdaki kurulum UUID'sini temizlemek, daha önce D1'de saklanan kayıtları otomatik olarak silmez. Bu sınırlama mağaza yayını öncesinde ayrıca değerlendirilecektir.",
      "Gemini'ye aktarılan geçici dosyalar sağlayıcının geçici dosya yaşam döngüsüne tabidir. Anlat Hoca, kısmi yükleme hatalarında geçici sağlayıcı kaynağını temizlemeyi dener; ancak kesin saklama süreleri için ilgili sağlayıcının güncel koşulları dikkate alınmalıdır.",
    ],
  },
  {
    title: "Seçimlerin ve politika değişiklikleri",
    paragraphs: [
      "PDF yüklememeyi, Hocaya Sor'u kullanmamayı veya yalnızca kullanıcı verisi göndermeyen Sınava Hazırlan içeriklerini kullanmayı seçebilirsin.",
      "Uygulamanın veri işleme davranışı değişirse bu politika da güncellenir. Politikanın güncel sürümü Ayarlar ekranında ve halka açık bağlantıda sunulur.",
    ],
  },
] as const;
