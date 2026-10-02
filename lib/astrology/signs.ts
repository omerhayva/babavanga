/**
 * Astroloji motoru — temel, deterministik hesaplamalar.
 * Not: Gerçek ephemeris (gezegen pozisyonları) ileride `lib/astrology/ephemeris`
 * altına takılabilir; arayüzler bu modül üzerinden sabit kalır.
 */

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Quality = 'cardinal' | 'fixed' | 'mutable';

export interface SignDef {
  id: string;            // "koc" gibi
  nameTr: string;
  nameEn: string;
  glyph: string;
  start: [number, number]; // [ay(1-12), gün]
  end: [number, number];
  element: Element;
  quality: Quality;
  ruler: string;
  traits: string[];
}

export const SIGNS: SignDef[] = [
  { id: 'koc', nameTr: 'Koç', nameEn: 'Aries', glyph: '♈', start: [3, 21], end: [4, 19], element: 'fire', quality: 'cardinal', ruler: 'Mars', traits: ['atılganlık', 'cesaret', 'hızlı karar'] },
  { id: 'boga', nameTr: 'Boğa', nameEn: 'Taurus', glyph: '♉', start: [4, 20], end: [5, 20], element: 'earth', quality: 'fixed', ruler: 'Venüs', traits: ['istikrar', 'sabır', 'maddi güven'] },
  { id: 'ikizler', nameTr: 'İkizler', nameEn: 'Gemini', glyph: '♊', start: [5, 21], end: [6, 20], element: 'air', quality: 'mutable', ruler: 'Merkür', traits: ['iletişim', 'merak', 'çeşitlilik'] },
  { id: 'yengec', nameTr: 'Yengeç', nameEn: 'Cancer', glyph: '♋', start: [6, 21], end: [7, 22], element: 'water', quality: 'cardinal', ruler: 'Ay', traits: ['duygusallık', 'aile', 'koruma içgüdüsü'] },
  { id: 'aslan', nameTr: 'Aslan', nameEn: 'Leo', glyph: '♌', start: [7, 23], end: [8, 22], element: 'fire', quality: 'fixed', ruler: 'Güneş', traits: ['kendine güven', 'sahiplenme', 'ihtişam'] },
  { id: 'basak', nameTr: 'Başak', nameEn: 'Virgo', glyph: '♍', start: [8, 23], end: [9, 22], element: 'earth', quality: 'mutable', ruler: 'Merkür', traits: ['analiz', 'detay', 'hizmet'] },
  { id: 'terazi', nameTr: 'Terazi', nameEn: 'Libra', glyph: '♎', start: [9, 23], end: [10, 22], element: 'air', quality: 'cardinal', ruler: 'Venüs', traits: ['denge', 'ortaklık', 'estetik'] },
  { id: 'akrep', nameTr: 'Akrep', nameEn: 'Scorpio', glyph: '♏', start: [10, 23], end: [11, 21], element: 'water', quality: 'fixed', ruler: 'Mars/Plüton', traits: ['derinlik', 'dönüşüm', 'gizli güç'] },
  { id: 'yay', nameTr: 'Yay', nameEn: 'Sagittarius', glyph: '♐', start: [11, 22], end: [12, 21], element: 'fire', quality: 'mutable', ruler: 'Jüpiter', traits: ['genişleme', 'iyimserlik', 'özgürlük'] },
  { id: 'oglak', nameTr: 'Oğlak', nameEn: 'Capricorn', glyph: '♑', start: [12, 22], end: [1, 19], element: 'earth', quality: 'cardinal', ruler: 'Satürn', traits: ['disiplin', 'kariyer', 'uzun vadeli hedef'] },
  { id: 'kova', nameTr: 'Kova', nameEn: 'Aquarius', glyph: '♒', start: [1, 20], end: [2, 18], element: 'air', quality: 'fixed', ruler: 'Satürn/Uranüs', traits: ['yenilik', 'bağımsızlık', 'vizyon'] },
  { id: 'balik', nameTr: 'Balık', nameEn: 'Pisces', glyph: '♓', start: [2, 19], end: [3, 20], element: 'water', quality: 'mutable', ruler: 'Jüpiter/Neptün', traits: ['sezgi', 'empati', 'akış'] },
];

export const ELEMENTS_TR: Record<Element, string> = {
  fire: 'Ateş', earth: 'Toprak', air: 'Hava', water: 'Su',
};
export const QUALITIES_TR: Record<Quality, string> = {
  cardinal: 'Öncü', fixed: 'Sabit', mutable: 'Değişken',
};

/** Güneş burcu: ay/gün → burç (deterministik tarih aralıkları) */
export function sunSign(month: number, day: number): SignDef {
  for (const s of SIGNS) {
    const [sm, sd] = s.start;
    const [em, ed] = s.end;
    if (sm <= em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return s;
    } else {
      // Oğlak: Aralık → Ocak dilimi
      if ((month === sm && day >= sd) || (month === em && day <= ed)) return s;
    }
  }
  return SIGNS[0];
}

export function signDateRange(s: SignDef): string {
  const months = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return `${s.start[1]} ${months[s.start[0]]} – ${s.end[1]} ${months[s.end[0]]}`;
}

/**
 * Yaklaşık ay burcu.
 * Ay ~27,32 günde zodyakı dolaşır (günde ~13,2°). Bilinen bir yeni ay anından
 * (6 Ocak 2000, 18:14 UTC — Güneş boylamı ≈ 285,6°) doğrusal ilerleme ile
 * ay boylamı tahmin edilir. Hata payı ±1 burç olabilir; bu yüzden sonuç
 * "yaklaşık" olarak etiketlenir. Gerçek ephemeris ileride eklenebilir.
 */
const NEW_MOON_EPOCH_MS = Date.UTC(2000, 0, 6, 18, 14);
const MOON_LONG_AT_EPOCH = 285.6;
const SIDEREAL_MONTH_DAYS = 27.321661;

export function approxMoonSign(date: Date): { sign: SignDef; approximate: true } {
  const days = (date.getTime() - NEW_MOON_EPOCH_MS) / 86400000;
  let longitude = (MOON_LONG_AT_EPOCH + (days * 360) / SIDEREAL_MONTH_DAYS) % 360;
  if (longitude < 0) longitude += 360;
  const idx = Math.floor(longitude / 30) % 12;
  return { sign: SIGNS[idx], approximate: true };
}

/** Element uyum notları (sabit tablo) */
export function elementNote(el: Element): string {
  const notes: Record<Element, string> = {
    fire: 'Ateş elementi karar mekanizmanda hız ve cesareti öne çıkarıyor; beklemek yerine harekete geçmek sana doğal geliyor.',
    earth: 'Toprak elementi sende sağlam adım ve somut garanti arayışı yaratıyor; belirsizlik sana en çok yorulan alan.',
    air: 'Hava elementi senin seçenekleri düşünerek, konuşarak ve karşılaştırarak netleştiğini gösteriyor.',
    water: 'Su elementi kararlarını duygusal okumalarına göre veriyorsun; ilk hislerin genelde güçlü sinyal taşıyor.',
  };
  return notes[el];
}

export interface AstroSummary {
  sun: SignDef;
  dateRange: string;
  element: Element;
  elementTr: string;
  quality: Quality;
  qualityTr: string;
  moon?: SignDef;
  moonApproximate: boolean;
}

export function astroSummary(birthDate: string, birthTime?: string): AstroSummary | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!m) return null;
  const year = Number(m[1]); const month = Number(m[2]); const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(d.getTime())) return null;
  const sun = sunSign(month, day);
  const timeMatch = birthTime ? /^(\d{2}):(\d{2})$/.exec(birthTime) : null;
  if (timeMatch) {
    d.setUTCHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
  }
  const moon = approxMoonSign(d);
  return {
    sun,
    dateRange: signDateRange(sun),
    element: sun.element,
    elementTr: ELEMENTS_TR[sun.element],
    quality: sun.quality,
    qualityTr: QUALITIES_TR[sun.quality],
    moon: moon.sign,
    moonApproximate: true,
  };
}
