function clean(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function renderMasterNotaryPoa(data) {
  const caseType = String(data.case_type || "").toLowerCase();
  const tahsilPolicy = clean(
    data.tahsil_ve_ibra_policy,
    "Yalnızca vekâlet verenin bilgisi ve gerekli özel yetki kapsamında."
  );
  const caseSummary = clean(data.case_summary, "-");
  const caseTypeLabel = clean(data.case_type_label, "Tazminat Dosyası");
  const specialAuthoritySummary = clean(data.special_authority_summary, "-");

  let caseSpecificAuthorities = "";

  if (caseType === "vefat") {
    caseSpecificAuthorities = `
DOSYAYA ÖZGÜ ÖZEL YETKİLER (VEFAT DOSYASI)

13. Veraset ilamı / mirasçılık belgesi, nüfus aile kayıt tablosu, defin ruhsatı, ölüm belgesi, otopsi raporu, adli tıp evrakı, destek ilişkisini gösteren kayıtlar ve destekten yoksun kalma tazminatına esas diğer tüm bilgi ve belgeleri ilgili kurumlardan talep etmeye, almaya, sunmaya ve teslim almaya.

14. Hak sahipliği, miras payı, destekten yoksun kalma, cenaze ve defin giderleri ile manevi tazminat taleplerine ilişkin başvuru, sulh, arabuluculuk, tahkim, dava, icra ve takip işlemlerini yürütmeye.

15. Mirasçılar / hak sahipleri adına sigorta şirketleri, Güvence Hesabı, Türkiye Motorlu Taşıt Bürosu ve diğer sorumlular nezdinde her türlü başvuru, talep, mutabakat ve takip işlemini yapmaya.
`;
  } else if (caseType === "arac") {
    caseSpecificAuthorities = `
DOSYAYA ÖZGÜ ÖZEL YETKİLER (ARAÇ HASARI / DEĞER KAYBI)

13. Araç ruhsatı, trafik kayıtları, eksper raporları, servis kayıtları, onarım faturaları, parça değişim belgeleri, tramer kayıtları, hasar dosyaları ve rayiç değer tespitine esas diğer tüm evrakı talep etmeye, almaya, sunmaya ve teslim almaya.

14. Araç hasarı, pert, onarım bedeli, ikame araç, ticari kazanç kaybı ve araç değer kaybı taleplerine ilişkin başvuru, sulh, arabuluculuk, tahkim, dava, icra ve takip işlemlerini yürütmeye.

15. Ruhsat sahibi, araç sahibi veya işleten sıfatına dayalı olarak ilgili sigorta kuruluşları, eksperler, servisler ve diğer kurumlar nezdinde her türlü başvuru ve takip işlemlerini yapmaya.
`;
  } else {
    caseSpecificAuthorities = `
DOSYAYA ÖZGÜ ÖZEL YETKİLER (YARALANMA DOSYASI)

13. Hastane, sağlık kuruluşları, aile hekimliği birimleri, SGK, adli makamlar, Adli Tıp Kurumu ve ilgili tüm kurumlardan epikriz, tedavi evrakı, film / görüntüleme kayıtları, maluliyet raporları, iş göremezlik belgeleri ve diğer sağlık verilerini talep etmeye, almaya, sunmaya ve teslim almaya.

14. Geçici veya sürekli iş göremezlik, maluliyet, tedavi gideri, bakıcı gideri, ekonomik geleceğin sarsılması ve manevi tazminat taleplerine ilişkin başvuru, sulh, arabuluculuk, tahkim, dava, icra ve takip işlemlerini yürütmeye.

15. Sigorta şirketleri, SGK ve ilgili diğer kurumlar nezdinde sağlık verisine dayalı başvuru ve takip işlemlerini yürütmeye.
`;
  }

  return `
VEKÂLET HAZIRLIK TASLAĞI

DAVA / TAZMİNAT / SİGORTA SÜRECİ İÇİN VEKÂLET YETKİ TALİMAT METNİ

VEKÂLET VEREN
Adı Soyadı              : ${clean(data.principal_name)}
T.C. Kimlik No          : ${clean(data.principal_identity_no)}
Adres                   : ${clean(data.principal_address)}

VEKİL AVUKAT
Adı Soyadı              : ${clean(data.lawyer_name)}
Barosu                  : ${clean(data.bar_name)}
Sicil No                : ${clean(data.bar_number)}
Adres                   : ${clean(data.lawyer_address)}

DOSYA TÜRÜ
${caseTypeLabel}

DOSYA ÖZETİ
${caseSummary}

TALEP EDİLEN YETKİ KAPSAMI

Aşağıdaki iş ve işlemler için vekâlet düzenlenmesi talep edilmektedir:

1. Sigorta şirketleri, Güvence Hesabı, Türkiye Motorlu Taşıt Bürosu, tahkim komisyonları, arabuluculuk büroları, noterlikler, icra müdürlükleri, mahkemeler, bölge adliye mahkemeleri, Yargıtay ve ilgili tüm resmî / özel kurum ve kuruluşlar nezdinde başvuru, takip, talep, savunma ve sonuçlandırma işlemleri yapmaya.

2. Her türlü dava, karşı dava, başvuru, şikâyet, itiraz, cevap, delil sunma, dosya inceleme, talep artırımı, ıslah, beyan, kabul, feragat, sulh, ibra, temyiz, istinaf, karar düzeltme ve diğer kanun yollarına başvurmaya; bu işlemleri takip etmeye ve sonuçlandırmaya.

3. Tazminat, hasar, değer kaybı, destekten yoksun kalma, geçici / sürekli iş göremezlik, tedavi gideri, araç hasarı, bakıcı gideri, manevi tazminat ve sair tüm alacak kalemlerine ilişkin başvuru, dava, takip, tahkim ve icra işlemlerini yürütmeye.

4. UYAP, e-tebligat, resmî kayıt ve kurumsal sistemler üzerinden gerekli başvuru ve takipleri yapmaya; dosya ve evrak almaya, sunmaya, suret çıkarmaya, suret onaylatmaya ve evrak teslim almaya.

5. Bankalar, sigorta şirketleri, kamu kurumları ve diğer ilgili kuruluşlar nezdinde dosyaya ilişkin ödeme, hesap hareketi, poliçe, hasar, başvuru, dosya ve kayıt bilgilerini talep etmeye, incelemeye ve temin etmeye.

6. Gerekli olduğu ölçüde tahsil, makbuz düzenleme, sulhname, ibraname, mutabakat ve ödeme kabul işlemlerini yürütmeye: ${tahsilPolicy}

7. Dosya kapsamında gerekli görülmesi hâlinde alt vekil tayin etmeye, birlikte vekil görevlendirmeye, azletmeye ve tevkil yetkisini kullanmaya.

8. Kişisel veri, sağlık verisi, trafik kazası evrakı, hastane kayıtları, adli raporlar, eksper raporları, bilirkişi raporları ve dosya kapsamında gerekli diğer tüm kayıt ve belgeleri talep etmeye, almaya ve teslim almaya.

9. İcra müdürlükleri nezdinde takip başlatmaya, ödeme emri göndermeye, haciz talebinde bulunmaya, dosya işlemlerini takip etmeye, tahsil ve kapama işlemlerini yürütmeye.

10. Arabuluculuk ve tahkim süreçlerinde başvuru yapmaya, toplantılara katılmaya, tutanak imzalamaya, uzlaşma / anlaşma tekliflerini değerlendirmeye ve gerekli işlemleri yürütmeye.

11. Gerekli başvuru ve dava harçlarını, masraf avanslarını ve süreç giderlerini dosya kapsamında yatırmaya, mahsup taleplerinde bulunmaya ve ilgili süreç işlemlerini takip etmeye.

12. Dosya konusu talepler bakımından ilgili kurum ve kişilerle yazışma yapmaya, başvuru sonuçlarını teslim almaya, eksik evrakları tamamlamaya ve süreç yönetimini yürütmeye.

${caseSpecificAuthorities}
DOSYAYA ÖZEL YETKİ NOTU
${specialAuthoritySummary}

ÖZEL NOT
Noterlik uygulamasında kullanılacak nihai metin, ilgili noterlik düzenleme formatına göre ayrıca şekillendirilecektir. Bu metin bir hazırlık taslağıdır; nihai vekâletname düzenlenmeden önce vekâlet verenin sıfatı, dosya türü, özel yetki ihtiyacı ve tahsil / sulh / ibra kapsamı ayrıca kontrol edilmelidir.

VEKÂLET VEREN
${clean(data.principal_name)}
İmza`;
}

module.exports = { renderMasterNotaryPoa };
