TUR #84 T7 SMOKE — Backend Endpoint Canlilik (5 Mayis 2026)
====================================================================

[Production deploy bekliyor — Render postinstall hook 1-2 dk içinde apply edecek]

[1/8] /health
  HTTP 200 (0.488472s)

[2/8] /api/users (auth gerek — 401 beklenir)
  HTTP 401

[3/8] PATCH /api/users/:id (auth gerek — 401)
  HTTP 401

[4/8] PATCH /api/users/:id/password (auth — 401)
  HTTP 401

[5/8] PATCH /api/users/:id/status (auth — 401)
  HTTP 401

[6/8] PATCH /api/users/:id/archive (auth — 401)
  HTTP 401

[7/8] DELETE /api/users/:id (auth — 401)
  HTTP 401

[8/8] /api/auth/users (eski path geri uyumlu — 401)
  HTTP 401

====================================================================
Beklenen sonuc: hepsi 401 (auth gerek = endpoint canli, deploy basarili)
Eger 404 dönüyorsa = deploy henüz tamamlanmadı, 1-2 dk sonra tekrar test
