/**
 * Tedbirge.ai Zorunlu Disclaimer Metinleri
 *
 * Bu metinler her tazminat çıktısında, her PDF raporunda, her müvekkil
 * görünümünde ZORUNLU olarak yer almalıdır. Kaldırılamaz.
 */

const TAZMINAT_DISCLAIMER = `Bu hesaplama, Tedbirge.ai yapay zeka sistemi tarafından kullanıcı tarafından yüklenen belgelerdeki veriler esas alınarak üretilmiştir. Rakam bilirkişi raporu, aktüer raporu veya mahkeme kararı yerine geçmez; yalnızca avukatın dava stratejisine temel oluşturacak bir ön-değerlendirmedir. Gerçek tazminat miktarı mahkeme, kusur tespiti, maluliyet oranı ve yargısal takdir ile belirlenir. Bu çıktıya dayanılarak alınan kararlardan Tedbirge.ai sorumlu tutulamaz. Bu bir hukuki tavsiye değildir.`;

const KVKK_DISCLAIMER = `Yüklediğiniz belgeler özel nitelikli kişisel veri (sağlık, gelir bilgisi) içerebilir. KVKK m.6 kapsamında işlenmesi için açık rızanız gerekmektedir. Belgeleriniz Tedbirge.ai'nin KVKK Aydınlatma Metni çerçevesinde işlenir; dilediğiniz zaman silme talebinde bulunabilirsiniz.`;

const BILIRKISI_YERINE_GECMEZ = `Bu değerlendirme bilirkişi raporu yerine geçmez. Mahkeme aktüer bilirkişi atayacaktır.`;

const MULUYET_AI_TAHMIN_UYARISI = `UYARI: Maluliyet oranı yapay zeka tarafından hastane belgelerindeki bulgulardan tahmin edilmiştir. Bu oran RESMİ bir sağlık kurulu raporu değildir ve dava dilekçesinde dayanak olarak kullanılamaz. Gerçek maluliyet oranı için Sağlık Bakanlığı yetkili hastanelerinden Engellilik Sağlık Kurulu Raporu alınması zorunludur.`;

const KUSUR_AI_TAHMIN_UYARISI = `UYARI: Kusur oranı yapay zeka tarafından kaza tutanağı ve ifadelerden tahmin edilmiştir. Bilirkişi kusur raporu veya kesinleşmiş mahkeme kararı olmadan bu oran bağlayıcı değildir.`;

module.exports = {
  TAZMINAT_DISCLAIMER,
  KVKK_DISCLAIMER,
  BILIRKISI_YERINE_GECMEZ,
  MULUYET_AI_TAHMIN_UYARISI,
  KUSUR_AI_TAHMIN_UYARISI,
};
