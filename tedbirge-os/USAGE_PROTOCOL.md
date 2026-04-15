# TEDBIRGE OS – USAGE_PROTOCOL

## Amaç
Bu dosya, Tedbirge.ai geliştirme sürecinde TEDBIRGE OS'nin nasıl kullanılacağını tanımlar.
Kural: OS okunmadan teknik işe başlanmaz.

## Temel lke
Tedbirge.ai iki katmanda yürür:
1. Proje kodu
2. TEDBIRGE OS

Kod değişiklikleri geçicidir.
OS kayıtları kalıcı hafızadır.

Bu nedenle:
- önce OS
- sonra uygulama
- sonra tekrar OS kaydı

## Her Yeni Oturumda Zorunlu Sıra
1. MASTER_OS.md
2. CURRENT_STATE.md
3. TASK_QUEUE.md
4. DECISION_LOG.md
5. TEST_PROTOCOL.md

Bu sıra tamamlanmadan görev seçilmez.

## Görev Seçme Kuralı
- ACTIVE görev varken yeni görev açılmaz
- TODO listesinden keyfi görev seçilmez
- OS kaydı yapılmadan DONE sayılmaz
- Aynı anda tek görev yürütülür

## Görev Uygulama Akışı
A. LOAD
- MASTER_OS oku
- CURRENT_STATE oku
- TASK_QUEUE oku

B. PREPARE
- backup al
- aktif görevi doğrula

C. ANALYZE
- aktif görevi tanımla
- etkilenecek dosyaları belirle
- riskleri belirle

D. EXECUTE
- tek dosya veya en küçük güvenli değişiklik
- refactor yapma
- çalışan sistemi bozma
- aktif görevin dışına çıkma

E. TEST
- TEST_PROTOCOL'e göre kontrol et
- hata varsa görev kapanmaz

F. RECORD
- CHANGELOG.md güncelle
- CURRENT_STATE.md güncelle
- TASK_QUEUE.md güncelle
- gerekiyorsa DECISION_LOG.md güncelle

G. SNAPSHOT
- stabil sonuç sonrası snapshot al

## Görev Tamamlama Kriteri
Bir görev ancak şu şartlarla tamamlanmış sayılır:
1. değişiklik uygulandı
2. test yapıldı
3. changelog yazıldı
4. current_state ve task_queue güncellendi
5. snapshot alındı

## Yasaklar
- OS dosyalarını okumadan göreve başlamak
- ACTIVE görev varken başka işe atlamak
- kayıt yapmadan yeni görev açmak
- backup almadan patch uygulamak
- aynı anda backend ve panel çekirdeğini değiştirmek
- sırf güzel görünüyor diye mimari değiştirmek
- çalışan sistemi refactor etmek

## Yeni Sohbette Kullanım Metni
TEDBIRGE OS LOAD

1. MASTER_OS aktif anayasa olarak kabul edilsin.
2. CURRENT_STATE mevcut gerçek durum olarak kabul edilsin.
3. TASK_QUEUE görev sırası olarak kabul edilsin.
4. Yalnızca ACTIVE görev ele alınsın.
5. Görev öncesi backup zorunlu olsun.
6. Görev sonunda CHANGELOG, CURRENT_STATE ve TASK_QUEUE güncellensin.
7. Stabil sonuç sonrası snapshot alınsın.
8. Refactor yapılmasın.
9. Çalışan sistem korunarak en küçük güvenli adım seçilsin.

## Son Kural
Tedbirge.ai'de artık rastgele geliştirme yoktur.

Yeni kural:
OS → Backup → Görev → Uygulama → Test → Kayıt → Snapshot → Sonraki görev
