/**
 * Numeroloji motoru — tamamen deterministik hesaplamalar.
 * Türkçe karakterler (Ç Ğ İ Ö Ş Ü) harf haritası üzerinden desteklenir.
 */
import type { NumerologyLetterMap } from '@/lib/types/models';

export const MASTER_NUMBERS = [11, 22, 33];

/** Sayıyı tek haneye indirger; master sayılar (11/22/33) korunabilir. */
export function reduceNumber(n: number, keepMaster = true): number {
  let x = Math.abs(Math.round(n));
  while (x > 9) {
    if (keepMaster && MASTER_NUMBERS.includes(x)) return x;
    x = String(x).split('').reduce((s, d) => s + Number(d), 0);
  }
  return x;
}

/** Türkçe metni büyük harfe çevirir (İ/I dönüşümleri doğru yapılır) */
export function upperTr(s: string): string {
  return s.toLocaleUpperCase('tr-TR');
}

const VOWELS = new Set(['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü']);

export function isVowel(ch: string): boolean {
  return VOWELS.has(upperTr(ch));
}

/** Metindeki harflerin sayısal toplamı (harita dışı karakterler 0'dır) */
export function letterSum(text: string, map: NumerologyLetterMap): number {
  let sum = 0;
  for (const raw of upperTr(text)) {
    if (map[raw] !== undefined) sum += map[raw];
  }
  return sum;
}

export interface NameNumbers {
  /** Ham isim toplamı (indirgenmemiş) */
  rawTotal: number;
  /** İsim sayısı (indirgenmiş) */
  nameNumber: number;
  /** Sesli harf toplamı (ham) */
  vowelTotal: number;
  /** Ruh sayısı (sesli harflerden) */
  soulNumber: number;
  /** Sessiz harf toplamı (ham) */
  consonantTotal: number;
  /** Kişilik sayısı (sessiz harflerden) */
  personalityNumber: number;
  letterCount: number;
}

/** İsim / harf motoru: sesli + sessiz + toplam enerji */
export function computeNameNumbers(name: string, map: NumerologyLetterMap): NameNumbers {
  let vowelSum = 0;
  let consonantSum = 0;
  let count = 0;
  for (const ch of upperTr(name)) {
    const v = map[ch];
    if (v === undefined) continue;
    count++;
    if (isVowel(ch)) vowelSum += v;
    else consonantSum += v;
  }
  return {
    rawTotal: vowelSum + consonantSum,
    nameNumber: reduceNumber(vowelSum + consonantSum),
    vowelTotal: vowelSum,
    soulNumber: reduceNumber(vowelSum),
    consonantTotal: consonantSum,
    personalityNumber: reduceNumber(consonantSum),
    letterCount: count,
  };
}

export interface BirthDateParts { day: number; month: number; year: number }

export function parseBirthDate(dateStr: string): BirthDateParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return { day, month, year };
}

function digitSum(n: number): number {
  return String(Math.abs(n)).split('').reduce((s, d) => s + Number(d), 0);
}

/** Yaşam yolu sayısı: gg.aa.yyyy tüm haneleri → indirgeme (master korunur) */
export function lifePathNumber(bd: BirthDateParts): number {
  return reduceNumber(digitSum(bd.day) + digitSum(bd.month) + digitSum(bd.year));
}

/** Doğum günü sayısı */
export function birthdayNumber(bd: BirthDateParts): number {
  return reduceNumber(bd.day);
}

/** Kader sayısı: tam ismin harf toplamı (birden çok isim birleştirilir) */
export function destinyNumber(fullName: string, map: NumerologyLetterMap): number {
  return computeNameNumbers(fullName, map).nameNumber;
}

/** Kişisel yıl: doğum günü + ay + içinde bulunulan yıl */
export function personalYearNumber(bd: BirthDateParts, now: Date): number {
  return reduceNumber(digitSum(bd.day) + digitSum(bd.month) + digitSum(now.getFullYear()), false);
}

/** Kişisel ay: kişisel yıl + takvim ayı */
export function personalMonthNumber(py: number, monthIndex1: number): number {
  return reduceNumber(py + monthIndex1, false);
}

/** Kişisel gün: kişisel ay + gün */
export function personalDayNumber(pm: number, dayOfMonth: number): number {
  return reduceNumber(pm + dayOfMonth, false);
}

export interface FullNumerology {
  name?: NameNumbers;
  lifePath: number;
  birthday: number;
  destiny?: number;
  soul?: number;
  personality?: number;
  personalYear: number;
  personalMonth: number;
  personalDay: number;
}

export function computeFullNumerology(
  fullName: string | undefined,
  birthDate: string,
  map: NumerologyLetterMap,
  now: Date = new Date(),
): FullNumerology | null {
  const bd = parseBirthDate(birthDate);
  if (!bd) return null;
  const py = personalYearNumber(bd, now);
  const pm = personalMonthNumber(py, now.getMonth() + 1);
  const pd = personalDayNumber(pm, now.getDate());
  const name = fullName && fullName.trim().length >= 2
    ? computeNameNumbers(fullName, map)
    : undefined;
  return {
    name,
    lifePath: lifePathNumber(bd),
    birthday: birthdayNumber(bd),
    destiny: name?.nameNumber,
    soul: name?.soulNumber,
    personality: name?.personalityNumber,
    personalYear: py,
    personalMonth: pm,
    personalDay: pd,
  };
}

/** "isim enerjisi" tanımı: toplam sayının genel karakteri */
export function nameEnergyLabel(nameNumber: number): string {
  const map: Record<number, string> = {
    1: 'Öncü ve bağımsız bir isim enerjisi',
    2: 'Uyum ve işbirliği odaklı bir isim enerjisi',
    3: 'İfade ve yaratıcılık dolu bir isim enerjisi',
    4: 'İstikrar ve yapı kuran bir isim enerjisi',
    5: 'Hareket ve özgürlük arayan bir isim enerjisi',
    6: 'Sorumluluk ve bakım taşıyan bir isim enerjisi',
    7: 'Analiz ve derinlik taşıyan bir isim enerjisi',
    8: 'Güç ve sonuç odaklı bir isim enerjisi',
    9: 'İnsanlık ve bütünlük taşıyan bir isim enerjisi',
    11: 'Yüksek sezgi taşıyan bir isim enerjisi',
    22: 'Büyük yapılar kuran bir isim enerjisi',
    33: 'Şefkat ve rehberlik taşıyan bir isim enerjisi',
  };
  return map[nameNumber] ?? 'Dengeli bir isim enerjisi';
}
