# Baba Vanga — Interactive Divination Engine

Tamamen kural tabanlı (rule-based / deterministic) interaktif kehanet ve soru motoru.
**Hiçbir yerde yapay zekâ / LLM / harici servis kullanılmaz.**

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme
npm run build      # üretim derlemesi
npm run start      # üretim sunucusu
```

## Ortam değişkenleri (`.env.local`)

| Değişken | Açıklama | Varsayılan |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Admin panel şifresi | `vanga-admin` (üretimde değiştirin) |
| `APP_SECRET` | Cookie imzalama anahtarı | rastgele (storage/secret otomatik üretilir) |
| `BASE_URL` | Kanonik site adresi (SEO) | `http://localhost:3000` |

## Mimari

- `lib/question-engine` — kategorik sınıflandırma + koşullu dallanan dinamik soru ağacı
- `lib/numerology` — yaşam yolu, kader, ruh, kişilik sayıları; Türkçe harf eşlemesi (configurable)
- `lib/tarot` — 22 Major Arcana veritabanı, seeded çekiliş, kategoriye göre yorum seçimi
- `lib/astrology` — güneş burcu, yaklaşık ay burcu, element/nitelik tabloları (modüler, ephemeris eklenebilir)
- `lib/symbols` — sembol seçimi ve yorum eşleştirmesi
- `lib/scoring` — cevaplardan + motorlardan birleşik skor üretimi
- `lib/reading-engine` — parça (fragment) tabanlı, deterministik sonuç üreticisi
- `lib/db` — sıfır bağımlılıklı JSON depolama katmanı (SQLite/PostgreSQL sürücüsü eklenebilir)
- `data/` — sorular, tarot, numeroloji, semboller, yorum parçaları (admin panelde düzenlenebilir)
- `storage/` — çalışma zamanı verileri (oturumlar, kullanıcılar, admin override'ları)

## Admin

`/admin` — varsayılan şifre `vanga-admin` (sadece geliştirme!). Soru, tarot kartı,
numeroloji açıklaması, yorum parçası ve kategori yönetimi + anonim istatistikler.
