# OPERATING_LOOP

## Döngü
LOAD
→ MASTER_OS
→ CURRENT_STATE
→ TASK_QUEUE

PREPARE
→ backup al
→ aktif görevi doğrula

ANALYZE
→ mevcut durumu değerlendir

CHOOSE
→ en üst ACTIVE görevi seç

EXECUTE
→ tek patch / en küçük güvenli değişiklik

TEST
→ TEST_PROTOCOL kontrolü

RECORD
→ CHANGELOG güncelle
→ CURRENT_STATE güncelle
→ TASK_QUEUE güncelle
→ gerekirse DECISION_LOG güncelle

SNAPSHOT
→ stabil sonuç sonrası snapshot al

SESSION_END
→ npm run os:update çalıştır
→ TEDBIRGE OS otomatik güncellenir

REPEAT

## Zorunlu Kontrol
EXECUTE öncesi:
- CURRENT_STATE okundu mu?
- TASK_QUEUE okundu mu?
- ACTIVE görev net mi?
- Backup alındı mı?

Bunlardan biri HAYIR ise işlem durdurulur.

## RECORD Zorunluluğu
Aşağıdakiler yapılmadan görev bitmez:
- CHANGELOG güncellendi mi?
- CURRENT_STATE güncellendi mi?
- TASK_QUEUE güncellendi mi?

Eksikse görev başarısız sayılır.

## SESSION_END Zorunluluğu
Her Claude Code oturumu sonunda şu komut çalıştırılır:

```bash
npm run os:update
```

Bu komut:
- tedbirge-os/CURRENT_STATE.md tarihini ve sistem durumunu günceller
- tedbirge-os/CHANGELOG.md'ye oturum kaydı ekler
- .env dosyasındaki durumu okuyarak risk alanlarını günceller

Bu adım atlanırsa OS bilgisi eskir ve sonraki oturumda yanlış bağlam oluşur.
