/**
 * Tema çıkarımı: skorlardan insan-okur etiketler üretir (deterministik).
 */
import type { ReadingScoreSet, ScoreKey } from '@/lib/types/models';
import type { DrawnCard } from '@/lib/tarot/draw';
import { timingWeight } from '@/lib/tarot/draw';

export interface ThemeResult { label: string; body: string }

/** ŞU ANDAKİ ENERJİ */
export function energyTheme(scores: ReadingScoreSet): ThemeResult {
  const s = scores;
  const rules: Array<{ test: boolean; label: string; body: string }> = [
    {
      test: s.change >= 65 && s.urgency >= 55,
      label: 'Hareket ve Değişim',
      body: 'Şu anki enerjin sıkışmışlıktan çok harekete geçme isteği taşıyor. İçinde bir "artık bir şey değişmeli" basıncı var ve bu baskı seni yeni bir düzene doğru itiyor.',
    },
    {
      test: s.patience >= 62 && s.urgency <= 45,
      label: 'Bekleyiş ve Olgunlaşma',
      body: 'Şu anki enerjin bir şeyin olgunlaşmasını beklediğin bir dönemde. Acele etmemen gereken bir süreç içindesin; şu an olan şey, toprağın altında kök salmak.',
    },
    {
      test: s.relationship >= 65,
      label: 'Bağlar ve Yakınlık',
      body: 'Enerjin büyük ölçüde bir bağa odaklı: bir ilişki, bir yakınlık ya da karşı tarafın sana karşı tutumu şu an hayatının merkezinde yer alıyor.',
    },
    {
      test: s.risk >= 65 && s.confidence <= 50,
      label: 'Sınanma ve Belirsizlik',
      body: 'Şu anki enerjinde belirsizlik ağır basıyor. Seçenekler var ama net görüntü henüz oluşmadı; içsel olarak bir "emin değilim" sesi duyuyorsun.',
    },
    {
      test: s.opportunity >= 65 && s.hope >= 55,
      label: 'Fırsat Penceresi',
      body: 'Şu anki enerjin yeni bir ihtimalin eşiğinde. Kapılar aralanıyor; sana kalan, hangi kapının gerçekten senin olduğunu ayırt etmek.',
    },
    {
      test: s.money >= 65,
      label: 'Maddi Düzen Arayışı',
      body: 'Enerjin maddi dünyaya dönük: güvenlik, bütçe, kazanım ya da bir maddi karar seni meşgul eden ana konulardan biri.',
    },
    {
      test: s.career >= 65,
      label: 'Kariyer Odaklı Bir Dönem',
      body: 'Enerjin işin, konumun ve ürettiğin değerle ilgili. Profesyonel kimliğin şu an sorgulanan alanların başında geliyor.',
    },
    {
      test: s.confidence <= 38,
      label: 'Netlik Arayışı',
      body: 'Şu anki enerjide en çok ihtiyaç duyduğun şey netlik. Ne hissettiğini biliyorsun ama ne yapacağını tam göremiyorsun.',
    },
    {
      test: s.hope >= 68,
      label: 'Yükselen Umut',
      body: 'İçinde umudun yüksek olduğu bir dönemdesin; bu, önündeki adımları daha kolay atmanı sağlayacak bir yakıt.',
    },
  ];
  for (const r of rules) if (r.test) return { label: r.label, body: r.body };
  return {
    label: 'Dengelenme',
    body: 'Şu anki enerjin iki farklı eğilim arasında denge kurmaya çalışıyor; ne tam bekleyiş ne tam hareket dönemindesin.',
  };
}

/** GÜÇLÜ ETKİ (gizli/arka plan faktörü) */
export function influenceTheme(scores: ReadingScoreSet): ThemeResult {
  const s = scores;
  const rules: Array<{ test: boolean; label: string; body: string }> = [
    {
      test: s.patience >= 60 && s.change >= 55,
      label: 'Geçmişten Gelen Bir Karar',
      body: 'Arka planda etkili olan güç, geçmişte tam verilmemiş bir karar. Eski bir "keşke" ya da yarım kalmış bir tercih şu anki adımlarını yönlendiriyor.',
    },
    {
      test: s.urgency >= 62,
      label: 'Zaman Baskısı',
      body: 'Arka planda belirgin olan etki, zamana dair bir baskı: "geç kalıyorum" hissi. Bu baskı kararlarını hızlandırıyor ama aynı zamanda netliğini azaltabiliyor.',
    },
    {
      test: s.relationship >= 60,
      label: 'Karşı Tarafın Dengesi',
      body: 'Bu tabloda etkili olan ana unsur, senin değil karşı tarafın konumu. Sorunun gidişatı büyük ölçüde diğer kişinin vereceği tepkiye bağlı.',
    },
    {
      test: s.risk >= 60 && s.money >= 55,
      label: 'Maddi Güvenlik Hesabı',
      body: 'Arka planda maddi güvenlik kaygısı belirgin. Kararlarının önündeki en büyük filtre, "sonrasında geçinirim mi" sorusu.',
    },
    {
      test: s.hope <= 38,
      label: 'Yorgunluk Şeridi',
      body: 'Bu dönemde seni en çok etkileyen faktör duygusal yorgunluk. Motivasyonun düşük değil; sadece uzun süredir aynı döngüde kalmanın ağırlığını taşıyorsun.',
    },
    {
      test: s.confidence >= 62 && s.opportunity >= 55,
      label: 'İç Sesin Netliği',
      body: 'Aslında iç sesin bu konuda net; etkili olan güç, senin kendi doğruyu bilme hissin. Sorun bilememek değil, çevrenin sesleri arasında kendi sesini kaybetmek.',
    },
  ];
  return {
    label: 'İç ve Dışın Kesişimi',
    body: 'Bu tabloda tek bir baskın etki yok; iç sesin ile dış koşulların aynı anda şekil değiştirdiği bir kesişim noktasındasın.',
  };
}

/** ZAMANLAMA */
export interface TimingResult { label: string; body: string }

export function timingHorizon(
  scores: ReadingScoreSet,
  cards: DrawnCard[],
  personalYear?: number,
): TimingResult {
  const urgency = scores.urgency;
  const cardTiming = cards.length
    ? cards.reduce((sum, c) => sum + timingWeight(c.card.timing), 0) / cards.length
    : 1.5;
  let pyFactor = 0.5; // nötr
  if (personalYear && [1, 5, 9].includes(personalYear)) pyFactor = 0.85;
  if (personalYear && [2, 4, 7].includes(personalYear)) pyFactor = 0.3;

  const timingScore =
    urgency * 0.4 + (cardTiming / 3) * 100 * 0.35 + pyFactor * 100 * 0.25;

  if (timingScore >= 62) {
    return {
      label: 'Yakın Dönem',
      body: 'İşaretler yakın dönemde bir hareketliliğa işaret ediyor. Bu, sonucun kesinleşeceği anlamına gelmiyor; ancak önümüzdeki haftalarda konuyla ilgili somut bir gelişme ya da netleştirici bir sinyal öne çıkabilir.',
    };
  }
  if (timingScore >= 45) {
    return {
      label: '1-3 Ay',
      body: 'Bu konuda olgunlaşma süreci 1-3 aylık bir pencereye işaret ediyor. Bu süreçte aceleci adımlar yerine bilgi toplamak ve koşulları netleştirmek daha destekleyici olacak.',
    };
  }
  if (timingScore >= 30) {
    return {
      label: '3-6 Ay',
      body: 'Tablo, orta vadede şekillenecek bir sürece işaret ediyor. Şu an atılacak adımların etkisi 3-6 ay sonrasında daha net görünebilir; sabır bu okumada güçlü bir öğe.',
    };
  }
  return {
    label: '6 Ay ve Ötesi / Olgunlaşma Dönemi',
    body: 'Bu konu uzun soluklu bir olgunlaşma döneminde. Ani bir sonuç yerine, adım adım gelişecek bir süreç görünüyor; bu süreçte asıl iş, hazırlığını sağlamlaştırmak.',
  };
}
