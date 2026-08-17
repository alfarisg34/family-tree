/**
 * Date & Age Calculation Utilities in Indonesian Locale
 */

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Parses date string (supports YYYY-MM-DD or year string)
 */
export function parseDate(dateStr?: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  // Try YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

/**
 * Format a date string to Indonesian formatted string
 * e.g. "17 Agustus 1945" or if only year "1945"
 */
export function formatDateID(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  
  // If it's just a 4 digit year
  if (/^\d{4}$/.test(dateStr.trim())) {
    return dateStr.trim();
  }

  const d = parseDate(dateStr);
  if (!d) return dateStr;

  const day = d.getDate();
  const month = MONTH_NAMES_ID[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Calculate age
 * Returns formatted string like "74 Tahun" or "Wafat pada usia 68 tahun"
 */
export function calculateAge(birthDateStr?: string, isDeceased: boolean = false, passedDateStr?: string): {
  ageNumber: number | null;
  ageText: string;
} {
  const birthDate = parseDate(birthDateStr);
  if (!birthDate) {
    return { ageNumber: null, ageText: '' };
  }

  const endDate = isDeceased && passedDateStr ? parseDate(passedDateStr) || new Date() : new Date();

  let years = endDate.getFullYear() - birthDate.getFullYear();
  const m = endDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
    years--;
  }

  if (years < 0) years = 0;

  if (isDeceased) {
    return {
      ageNumber: years,
      ageText: `Wafat pada usia ${years} tahun`
    };
  }

  return {
    ageNumber: years,
    ageText: `${years} tahun`
  };
}

/**
 * Get human-readable generation title in Indonesian family hierarchy
 */
export function getGenerationLabel(gen: number): string {
  switch (gen) {
    case 1:
      return 'Generasi I (Buyut / Leluhur)';
    case 2:
      return 'Generasi II (Kakek & Nenek)';
    case 3:
      return 'Generasi III (Orang Tua & Paman/Bibi)';
    case 4:
      return 'Generasi IV (Anak & Menantu)';
    case 5:
      return 'Generasi V (Cucu & Keponakan)';
    case 6:
      return 'Generasi VI (Cicit)';
    default:
      return `Generasi ${gen}`;
  }
}
