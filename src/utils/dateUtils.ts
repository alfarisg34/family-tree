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
  
  // If it's just a 4 digit year e.g. "2000"
  if (/^\d{4}$/.test(dateStr.trim())) {
    return new Date(parseInt(dateStr.trim(), 10), 0, 1);
  }

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
 * Get compact age text badge for Node Card on tree canvas
 * e.g. "26 Thn" for living members or "1912 — 1988 (76 Thn)" for deceased members
 */
export function getMemberAgeBadgeText(member: { birthDate?: string; isDeceased?: boolean; passedDate?: string }): string {
  if (!member.birthDate && !member.passedDate) return '';
  const ageInfo = calculateAge(member.birthDate, member.isDeceased, member.passedDate);
  
  if (member.isDeceased) {
    const birthYear = member.birthDate ? member.birthDate.split('-')[0] : '';
    const passedYear = member.passedDate ? member.passedDate.split('-')[0] : '';
    if (birthYear && passedYear) {
      return `${birthYear} — ${passedYear}${ageInfo.ageNumber !== null ? ` (${ageInfo.ageNumber} Thn)` : ''}`;
    }
    if (birthYear) return `Wafat (${birthYear})`;
    if (ageInfo.ageNumber !== null) return `Wafat (${ageInfo.ageNumber} Thn)`;
    return '🎗️ Wafat';
  }

  if (ageInfo.ageNumber !== null) {
    return `${ageInfo.ageNumber} Thn`;
  }

  if (member.birthDate) {
    const birthYear = member.birthDate.split('-')[0];
    return `${birthYear}`;
  }

  return '';
}

/**
 * Get human-readable generation title in Indonesian family hierarchy
 */
export function getGenerationLabel(gen: number): string {
  switch (gen) {
    case 1:
      return 'Generasi I (Leluhur Tertua / Canggah)';
    case 2:
      return 'Generasi II (Eyang Buyut)';
    case 3:
      return 'Generasi III (Kakek & Nenek)';
    case 4:
      return 'Generasi IV (Orang Tua & Paman/Bibi)';
    case 5:
      return 'Generasi V (Anak & Menantu)';
    case 6:
      return 'Generasi VI (Cucu & Keponakan)';
    case 7:
      return 'Generasi VII (Cicit)';
    case 8:
      return 'Generasi VIII (Piut / Wareng)';
    default:
      return `Generasi ${gen}`;
  }
}

/**
 * Convert raw phone number to valid direct WhatsApp URL (https://wa.me/628xxx)
 */
export function getWhatsAppUrl(phone?: string): string {
  if (!phone || !phone.trim()) return '';
  // Clean all non-digit characters except +
  let cleaned = phone.replace(/[^0-9+]/g, '');
  
  if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('62')) {
    // Already 628...
  } else if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  
  return `https://wa.me/${cleaned}`;
}
