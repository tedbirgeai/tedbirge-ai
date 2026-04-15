function clean(value, fallback = "-") {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function renderMasterAttorneyContract(data) {
  const specialBlock = clean(data.caseSpecificContractBlock, "");
  const caseCategoryLine = specialBlock ? `\n\n${specialBlock}` : "";

  return `AVUKATLIK HİZMET SÖZLEŞMESİ

1. TARAFLAR
İşbu SÖZLEŞME, aşağıda bilgileri bulunan taraflar arasında ${clean(data.contract_date, "[İMZA TARİHİ]")} tarihinde akdedilmiştir.

MÜVEKKİL
Adı Soyadı / Ünvanı    : ${clean(data.client_name)}
T.C. Kimlik No / VKN   : ${clean(data.client_identity_no, "[TC KİMLİK NO]")}
Adres                  : ${clean(data.client_address, "[ADRES]")}
Telefon                : ${clean(data.client_phone)}
E-posta                : ${clean(data.client_email)}

AVUKAT / AVUKATLAR
Adı Soyadı             : ${clean(data.lawyer_name, "[AVUKAT ADI SOYADI]")}
Barosu                 : ${clean(data.bar_name, "[BARO ADI]")}
Baro Sicil No          : ${clean(data.bar_number, "[BARO SİCİL NO]")}
Adres                  : ${clean(data.lawyer_address, "[AVUKAT ADRESİ]")}
Telefon                : ${clean(data.lawyer_phone, "[AVUKAT TELEFON]")}
E-posta                : ${clean(data.lawyer_email, "[AVUKAT E-POSTA]")}

2. SÖZLEŞMENİN KONUSU
İşbu SÖZLEŞMENİN konusu, ${clean(data.case_category)} nedeniyle doğmuş veya doğacak maddi ve manevi tazminat, sigorta başvurusu, tahkim, arabuluculuk, dava, icra, sulh görüşmeleri ve bunlara bağlı tüm hukuki işlemlerde Müvekkile avukatlık hizmeti verilmesidir.${caseCategoryLine}

3. DOSYANIN TANIMI
Olay Tarihi            : ${clean(data.accident_date, "[KAZA TARİHİ]")}
Dosya Türü             : ${clean(data.case_type_label)}
Karşı Taraf / Şirket   : ${clean(data.counterparty_or_insurer, "[KARŞI TARAF]")}
Poliçe / Hasar No      : ${clean(data.policy_or_claim_no, "[POLİÇE NO]")}
Kısa Olay Özeti        : ${clean(data.case_summary)}

3.A DOSYANIN HUKUKİ NİTELİĞİ
Bu dosya, kapsamı dahilinde değerlendirilmekte olup, ilgili mevzuat, yargı içtihatları
ve uygulama esasları dikkate alınarak takip edilecektir.

4. HİZMETİN KAPSAMI
Avukatın üstlendiği hizmetler aşağıdakileri kapsar:
a) dosya incelemesi ve hukuki değerlendirme,
b) gerekli başvuru, ihtar ve dilekçelerin hazırlanması,
c) sigorta şirketi / kurum / komisyon başvurularının yürütülmesi,
d) tahkim, arabuluculuk, dava ve icra süreçlerinin takibi,
e) karşı tarafla sulh görüşmeleri,
f) tahsilat ve dosya kapatış işlemleri,
g) gerekli görülürse bilirkişi, aktüer, uzman görüşü ve ek belge süreçlerinin koordinasyonu.

5. MÜVEKKİLİN YÜKÜMLÜLÜKLERİ
Müvekkil;
a) olay ve dosyaya ilişkin bilgi ve belgeleri doğru ve eksiksiz vermeyi,
b) talep edilen ek evrakları makul sürede sunmayı,
c) iletişim bilgileri değişikliklerini derhal bildirmeyi,
d) dosyanın sonucunu etkileyebilecek hiçbir hususu gizlememeyi,
e) avukatın bilgisi dışında karşı tarafla bağlayıcı sulh / ibraya gitmemeyi,
f) dosya kapsamında gerekli olduğunda resmi kurum, sağlık kurumu, sigorta kuruluşu
   ve benzeri merciler nezdindeki bilgi ve belge teminine ilişkin iş birliğini sağlamayı
kabul eder.

6. AVUKATIN YÜKÜMLÜLÜKLERİ
Avukat;
a) dosyayı özen ve sadakatle takip etmeyi,
b) Müvekkili önemli gelişmeler hakkında makul sürelerde bilgilendirmeyi,
c) hukuki süreci meslek kuralları ve mevzuata uygun yürütmeyi,
d) dosyada hukuken veya fiilen imkânsız hale gelen talepleri Müvekkile açıklamayı
   ve alternatif hukuki yollar konusunda bilgilendirmeyi,
e) sonuç garantisi vermeksizin, mesleki özen yükümlülüğü çerçevesinde gerekli
   hukuki girişimlerde bulunmayı
kabul eder.

7. AVUKATLIK ÜCRETİ
Taraflar, işbu dosya için avukatlık ücretini aşağıdaki şekilde kararlaştırmıştır:

Sabit Ücret            : ${clean(data.fixed_fee_amount, "[SABİT ÜCRET]")} TL + KDV
Başarıya Bağlı Ücret   : Tahsil edilen / hükmedilen / sulhen alınan net tutarın
                         %${clean(data.success_fee_rate, "[BAŞARI ORANI]")}'i + KDV
Asgari Ücret Güvencesi : Uygulanacak Avukatlık Asgari Ücret Tarifesinin altına düşülmeyecektir.

Açıklama:
- Başarıya bağlı ücret, yalnızca fiili tahsilat gerçekleştiğinde doğar ve tahsil edilen
  tutar üzerinden hesaplanır.
- Mahkemece, tahkim mercii veya kurumca karşı tarafa yüklenen vekâlet ücreti Avukata
  aittir / mahsup edilir.
- Tahsil edilen bedelden masraf, harç, vergi, eksper / rapor gideri ve benzeri
  kalemlerin düşülmesinden sonra hesaplama net tutar üzerinden yapılır.
- Müvekkilin, Avukatın bilgisi ve emeği ile ilerleyen dosyada doğrudan veya dolaylı
  tahsilat sağlaması hâlinde, Avukatın ücret hakkı saklıdır.

8. MASRAF VE GİDERLER
Yargılama giderleri, başvuru harçları, noter, tebligat, dosya örneği, uzman / aktüer /
bilirkişi, tercüme, ulaşım ve benzeri dış masraflar Müvekkil tarafından karşılanacaktır.
Avukat, gerekli masraflar için Müvekilden avans talep edebilir.
Müvekkilin gerekli masraf ve avansları haklı bir neden olmaksızın karşılayamaması
hâlinde, bundan kaynaklanan usuli ve fiili sonuçlardan Avukat sorumlu tutulamaz.

9. TAHSİLAT VE ÖDEME ŞEKLİ
Tahsilatın avukat aracılığıyla yapılması hâlinde, Avukat sözleşmesel ücret ve masrafları
mahsup ederek bakiyeyi Müvekkile öder.
ÖDEME kanalı          : Banka havalesi / EFT
ÖDEME süresi          : Tahsilattan itibaren 3 iş günü

10. SULH / İBRA / FERAGAT / KABUL
Müvekkil, sulh dâhil önemli kararların kendisine bilgi verilerek yürütülmesini ister.
Avukat, vekâletnamedeki özel yetki sınırları içinde işlem yapar.
Taraflar, yazılı mutabakat olmadan dosya sonucunu etkileyen nihai mali uzlaşmanın
yapılmamasını esas alır.
Müvekkilin, Avukatın bilgisi dışında dosyayı doğrudan etkileyen bağlayıcı sulh, ibra,
feragat veya ödeme anlaşması yapması hâlinde, Avukatın ücret ve sair hakları saklıdır.

11. KİŞİSEL VERİLER VE GİZLİLİK
Taraflar, dosya kapsamında paylaşılan kişisel verilerin ve özel nitelikli verilerin yalnızca
hukuki hizmetin yürütülmesi amacıyla işleneceğini kabul eder.
Avukat, sır saklama yükümlülüğü çerçevesinde hareket eder.
Müvekkil, dosyanın gerektirdiği ölçüde sağlık verisi, sigorta verisi ve diğer gerekli
belgelerin ilgili kurum ve kuruluşlardan teminine yönelik işleme faaliyetlerine muvafakat
ettiğini kabul eder.

12. SÖZLEŞMENİN SÜRESİ VE SONA ERMESİ
İşbu SÖZLEŞME imza tarihinde yürürlüğe girer ve dosyanın kesin kapanışına kadar devam eder.
Aşağıdaki hâllerde sona erebilir:
a) işin tamamlanması,
b) tarafların yazılı anlaşması,
c) haklı nedenle fesih,
d) vekâlet ilişkisinin sona ermesi.

13. FESİH VE SONUÇLARI
Haklı nedenle fesih hâlinde, o tarihe kadar yapılmış iş ve işlemler için hak edilen
ücret ve masraflar saklıdır.
Müvekkilin tek taraflı haksız feshi hâlinde, Avukatın hak ettiği ücret ve masraflar
genel hükümlere ve Avukatlık Kanunu kapsamındaki haklara göre talep edilebilir.
Müvekkilin haklı bir neden olmaksızın dosyayı başka bir yolla sonuçlandırması, doğrudan
tahsilat sağlaması veya Avukatı devre dışı bırakması hâlinde, Avukatın emeği oranında
ücret talep hakkı saklıdır.

14. TEBLİGAT VE BİLDİRİM
Tarafların yukarıda yazılı adresleri tebligat adresidir. Adres değişikliği yazılı
bildirilmedikçe eski adrese yapılan bildirimler geçerli sayılır.
Elektronik posta ve benzeri iletişim kanalları, bilgilendirme amacıyla kullanılabilir;
resmi tebligat hükmü doğuran hâller saklıdır.

15. UYUŞMAZLIK HALİ
İşbu SÖZLEŞMEDEN doğacak uyuşmazlıklarda ${clean(data.jurisdiction, "[YETKİLİ MAHKEME]")} Mahkeme ve İcra Daireleri yetkilidir.

16. EKLER
Ek-1: Kimlik / vekâlet / ruhsat bilgileri
Ek-2: Dosya evrak listesi
Ek-3: Masraf tablosu
Ek-4: KVKK aydınlatma ve açık rıza metni (gerekiyorsa)

Taraflar, işbu SÖZLEŞMEYİ okuyup anladıklarını beyanla imzalamıştır.

MÜVEKKİL                                    AVUKAT
${clean(data.client_name).padEnd(44)}${clean(data.lawyer_name, "[AVUKAT ADI SOYADI]")}

İmza : ___________________________           İmza : ___________________________

Tarih: [İMZA TARİHİ]                         Tarih: [İMZA TARİHİ]`;
}

module.exports = { renderMasterAttorneyContract };
