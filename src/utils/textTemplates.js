function serviceAgreementTemplate(lead) {
  const name    = lead.customerName  || "[MÜVEKKİL ADI SOYADI]";
  const phone   = lead.customerPhone || "[TELEFON]";
  const email   = lead.customerEmail || "[E-POSTA]";
  const city    = lead.city          || "[ŞEHİR]";

  return `HİZMET SÖZLEŞMESİ

Sözleşme Tarihi : [İMZA TARİHİ]
Başvuru Kodu    : ${lead.leadCode || "[BAŞVURU KODU]"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. TARAFLAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HİZMET ALAN (DANIŞAN)
Ad Soyad / Ünvanı   : ${name}
T.C. Kimlik No      : [TC KİMLİK NO]
Telefon             : ${phone}
E-posta             : ${email}
Adres               : ${city}

HİZMET VEREN (TEDBİRGE AI)
Ünvan               : Tedbirge Teknoloji A.Ş.
Adres               : [ŞİRKET ADRESİ]
Telefon             : 0850 303 3 724
E-posta             : info@tedbirge.ai

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. SÖZLEŞMENİN KONUSU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

İşbu sözleşmenin konusu; Danışan'ın trafik kazası veya iş kazasından kaynaklanan
maddi/manevi tazminat, sigorta başvurusu, değer kaybı ve buna bağlı hukuki
süreçlerde Tedbirge AI tarafından dijital danışmanlık ve süreç koordinasyonu
hizmetinin sunulmasıdır.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. HİZMET KAPSAMI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

a) Dosya incelemesi ve ön hukuki değerlendirme
b) Belge yükleme, analiz ve yapay zeka destekli ön değerlendirme
c) Sigorta şirketi ve ilgili kurum başvurularının koordinasyonu
d) Avukata yönlendirme ve atama süreci
e) Süreç takibi ve müvekkil bilgilendirmesi

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. GENEL HÜKÜMLER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Danışan tarafından sunulan bilgi ve belgeler esas alınır.
2. Platform üzerinden yapılan değerlendirmeler ön inceleme niteliğindedir;
   kesin hukuki tavsiye değildir.
3. Ücretlendirme ve başarı primi ayrıca belirlenerek ek sözleşmeye bağlanır.
4. Taraflar karşılıklı gizlilik yükümlülüklerine uymayı kabul eder.
5. KVKK kapsamındaki aydınlatma yükümlülüğü yerine getirilmiş sayılır.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. AVUKATLIK ÜCRETİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sabit Ücret           : [SABİT ÜCRET] TL + KDV
Başarıya Bağlı Ücret  : Tahsil edilen net tutarın %[BAŞARI ORANI]'i + KDV
Ödeme Kanalı          : Banka havalesi / EFT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. UYUŞMAZLIK HALİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

İşbu sözleşmeden doğacak uyuşmazlıklarda [YETKİLİ MAHKEME] Mahkeme ve
İcra Daireleri yetkilidir.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
İMZALAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HİZMET ALAN                          HİZMET VEREN
${name.padEnd(38)}Tedbirge Teknoloji A.Ş.

İmza : ___________________________    İmza : ___________________________

Tarih: [İMZA TARİHİ]                 Tarih: [İMZA TARİHİ]
`;
}

function powerOfAttorneyTemplate(lead) {
  const name  = lead.customerName  || "[VEKALETİ VEREN ADI SOYADI]";
  const phone = lead.customerPhone || "[TELEFON]";

  return `VEKALETNAME TASLAĞI

Düzenlenme Tarihi : [DÜZENLENME TARİHİ]
Başvuru Kodu      : ${lead.leadCode || "[BAŞVURU KODU]"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VEKALETİ VEREN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ad Soyad          : ${name}
T.C. Kimlik No    : [TC KİMLİK NO]
Telefon           : ${phone}
Adres             : ${lead.city || "[ADRES]"}
Doğum Tarihi      : [DOĞUM TARİHİ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VEKİL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ad Soyad          : [AVUKAT ADI SOYADI]
Baro Sicil No     : [BARO SİCİL NO]
Baro              : [BARO ADI]
Adres             : [AVUKAT OFİS ADRESİ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YETKİ KONUSU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Yukarıda bilgileri yazılı vekili, aşağıdaki konularda tam yetkili kılıyorum:

1. Trafik kazası / iş kazası nedeniyle doğan tazminat, sigorta başvurusu,
   değer kaybı ve buna bağlı tüm taleplerin takibi,
2. Sigorta şirketi, arabulucu, tahkim mercii ve mahkemeler nezdinde temsil,
3. Dava açma, savunma, itiraz, temyiz ve icra işlemleri,
4. Sulh, feragat ve kabul dahil tüm hukuki işlemler (özel yetki gerektiren
   hususlarda ayrıca yetkilendirme yapılacaktır),
5. Bilirkişi, aktüer ve uzman atanması taleplerinin yürütülmesi,
6. Tahsilat ve dosya kapatış işlemleri.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÖNEMLI NOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bu metin taslak niteliğindedir. Resmi vekaletname, noter onayı
gerektirmekte olup atanacak avukat tarafından gözden geçirilecektir.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
İMZA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vekalet Veren     : ${name}

İmza              : ___________________________

Tarih             : [İMZA TARİHİ]

(Resmi geçerlilik için noter onayı zorunludur)
`;
}

module.exports = {
  serviceAgreementTemplate,
  powerOfAttorneyTemplate
};
