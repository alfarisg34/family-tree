import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { calculateAge, formatDateID } from '../utils/dateUtils';

interface SmartDatePickerProps {
  value?: string; // YYYY-MM-DD, YYYY-MM, or YYYY
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  isDeceased?: boolean;
  referenceDateForAge?: string; // for deceased passedDate
}

const MONTHS_ID = [
  { value: '01', name: 'Januari', short: 'Jan' },
  { value: '02', name: 'Februari', short: 'Feb' },
  { value: '03', name: 'Maret', short: 'Mar' },
  { value: '04', name: 'April', short: 'Apr' },
  { value: '05', name: 'Mei', short: 'Mei' },
  { value: '06', name: 'Juni', short: 'Jun' },
  { value: '07', name: 'Juli', short: 'Jul' },
  { value: '08', name: 'Agustus', short: 'Agu' },
  { value: '09', name: 'September', short: 'Sep' },
  { value: '10', name: 'Oktober', short: 'Okt' },
  { value: '11', name: 'November', short: 'Nov' },
  { value: '12', name: 'Desember', short: 'Des' },
];

// Generate decades list from current year down to 1800
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_DECADE_START = Math.floor(CURRENT_YEAR / 10) * 10;

const DECADES = [
  { label: '2020-an', start: 2020 },
  { label: '2010-an', start: 2010 },
  { label: '2000-an', start: 2000 },
  { label: '1990-an', start: 1990 },
  { label: '1980-an', start: 1980 },
  { label: '1970-an', start: 1970 },
  { label: '1960-an', start: 1960 },
  { label: '1950-an', start: 1950 },
  { label: '1940-an', start: 1940 },
  { label: '1930-an', start: 1930 },
  { label: '1920-an', start: 1920 },
  { label: '1910-an', start: 1910 },
  { label: '1900-an', start: 1900 },
  { label: '1880-an', start: 1880 },
  { label: '1850-an', start: 1850 },
];

export const SmartDatePicker: React.FC<SmartDatePickerProps> = ({
  value = '',
  onChange,
  label,
  placeholder = 'Tahun / Tanggal',
  isDeceased = false,
  referenceDateForAge,
}) => {
  // Parse initial value
  const parseValue = (val: string) => {
    if (!val || !val.trim()) return { year: '', month: '', day: '' };
    const parts = val.trim().split('-');
    if (parts.length === 3) {
      return { year: parts[0], month: parts[1], day: parts[2] };
    }
    if (parts.length === 2) {
      return { year: parts[0], month: parts[1], day: '' };
    }
    if (parts.length === 1 && parts[0].length === 4) {
      return { year: parts[0], month: '', day: '' };
    }
    return { year: '', month: '', day: '' };
  };

  const parsed = parseValue(value);
  const [selectedYear, setSelectedYear] = useState<string>(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState<string>(parsed.month);
  const [selectedDay, setSelectedDay] = useState<string>(parsed.day);

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [activeDecadeStart, setActiveDecadeStart] = useState<number>(() => {
    const yr = parseInt(parsed.year, 10);
    if (!isNaN(yr) && yr >= 1800 && yr <= CURRENT_YEAR + 10) {
      return Math.floor(yr / 10) * 10;
    }
    return CURRENT_DECADE_START;
  });
  const [yearSearchQuery, setYearSearchQuery] = useState<string>('');

  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync state if value prop changes from outside
  useEffect(() => {
    const p = parseValue(value);
    setSelectedYear(p.year);
    setSelectedMonth(p.month);
    setSelectedDay(p.day);
    if (p.year) {
      const yr = parseInt(p.year, 10);
      if (!isNaN(yr)) {
        setActiveDecadeStart(Math.floor(yr / 10) * 10);
      }
    }
  }, [value]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPopoverOpen(false);
      }
    }
    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Compute maximum days in selected month and year
  const maxDays = useMemo(() => {
    if (!selectedMonth) return 31;
    const m = parseInt(selectedMonth, 10);
    if ([4, 6, 9, 11].includes(m)) return 30;
    if (m === 2) {
      const y = parseInt(selectedYear, 10);
      if (!isNaN(y) && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) {
        return 29;
      }
      return 28;
    }
    return 31;
  }, [selectedMonth, selectedYear]);

  // Update parent form whenever parts change
  const emitChange = (newYear: string, newMonth: string, newDay: string) => {
    const cleanYear = newYear.trim();
    if (!cleanYear) {
      onChange('');
      return;
    }

    // Auto fix day if exceeds max days
    let validDay = newDay;
    if (newDay && newMonth) {
      const dayNum = parseInt(newDay, 10);
      const m = parseInt(newMonth, 10);
      let maxD = 31;
      if ([4, 6, 9, 11].includes(m)) maxD = 30;
      else if (m === 2) {
        const y = parseInt(cleanYear, 10);
        const isLeap = !isNaN(y) && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0);
        maxD = isLeap ? 29 : 28;
      }
      if (dayNum > maxD) {
        validDay = String(maxD).padStart(2, '0');
      }
    }

    if (cleanYear && newMonth && validDay) {
      onChange(`${cleanYear}-${newMonth}-${validDay}`);
    } else if (cleanYear && newMonth) {
      onChange(`${cleanYear}-${newMonth}-01`);
    } else if (cleanYear) {
      onChange(cleanYear);
    } else {
      onChange('');
    }
  };

  const handleYearChange = (newYear: string) => {
    // Only accept numeric up to 4 digits
    const cleaned = newYear.replace(/\D/g, '').slice(0, 4);
    setSelectedYear(cleaned);
    if (cleaned.length === 4) {
      const yr = parseInt(cleaned, 10);
      if (yr >= 1800 && yr <= CURRENT_YEAR + 50) {
        setActiveDecadeStart(Math.floor(yr / 10) * 10);
      }
    }
    emitChange(cleaned, selectedMonth, selectedDay);
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    emitChange(selectedYear, newMonth, selectedDay);
  };

  const handleDayChange = (newDay: string) => {
    setSelectedDay(newDay);
    emitChange(selectedYear, selectedMonth, newDay);
  };

  const handleSelectYearFromPopover = (yr: number) => {
    const yrStr = String(yr);
    setSelectedYear(yrStr);
    setActiveDecadeStart(Math.floor(yr / 10) * 10);
    emitChange(yrStr, selectedMonth, selectedDay);
    setIsPopoverOpen(false);
  };

  const handleClear = () => {
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedDay('');
    onChange('');
    setIsPopoverOpen(false);
  };

  // Generate 10 years for current active decade
  const decadeYears = useMemo(() => {
    const years: number[] = [];
    for (let y = activeDecadeStart; y < activeDecadeStart + 10; y++) {
      if (y <= CURRENT_YEAR + 5) {
        years.push(y);
      }
    }
    return years;
  }, [activeDecadeStart]);

  // Filtered years if searching in popover
  const filteredSearchYears = useMemo(() => {
    if (!yearSearchQuery.trim()) return null;
    const q = yearSearchQuery.trim();
    const results: number[] = [];
    for (let y = CURRENT_YEAR; y >= 1800; y--) {
      if (String(y).includes(q)) {
        results.push(y);
        if (results.length >= 24) break;
      }
    }
    return results;
  }, [yearSearchQuery]);

  // Age calculation preview
  const ageDisplay = useMemo(() => {
    if (!value) return null;
    const formatted = formatDateID(value);
    const ageObj = calculateAge(value, isDeceased, referenceDateForAge);
    return {
      formatted,
      ageText: ageObj.ageText,
    };
  }, [value, isDeceased, referenceDateForAge]);

  return (
    <div className="smart-date-picker-wrapper" style={{ position: 'relative', width: '100%' }}>
      {label && <label className="form-label">{label}</label>}

      {/* Main 3-Segment Input Bar: Tanggal - Bulan - Tahun */}
      <div
        className="smart-date-input-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '72px 1fr 96px 40px',
          gap: '6px',
          alignItems: 'center',
        }}
      >
        {/* 1. Day Selector */}
        <select
          value={selectedDay}
          onChange={(e) => handleDayChange(e.target.value)}
          className="form-select smart-date-select"
          style={{
            padding: '8px 18px 8px 8px',
            fontSize: '12px',
            textAlign: 'center',
          }}
          title="Pilih Hari / Tanggal (Opsional)"
        >
          <option value="">Tgl</option>
          {Array.from({ length: maxDays }, (_, i) => {
            const d = String(i + 1).padStart(2, '0');
            return (
              <option key={d} value={d}>
                {d}
              </option>
            );
          })}
        </select>

        {/* 2. Month Selector */}
        <select
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="form-select smart-date-select"
          style={{
            padding: '8px 24px 8px 10px',
            fontSize: '12px',
          }}
          title="Pilih Bulan (Opsional)"
        >
          <option value="">-- Bulan (Opsional) --</option>
          {MONTHS_ID.map((m) => (
            <option key={m.value} value={m.value}>
              {m.name}
            </option>
          ))}
        </select>

        {/* 3. Year Direct Input (Accepts 4 digits) */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            inputMode="numeric"
            placeholder={placeholder || 'Tahun'}
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="form-input"
            style={{
              padding: '8px 8px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: selectedYear ? 'var(--text-gold)' : 'var(--text-primary)',
              textAlign: 'center',
              letterSpacing: '0.5px',
            }}
            title="Ketik 4 digit tahun secara langsung (misal: 1945, 1970, 2005)"
          />
        </div>

        {/* 4. Decade & Fast Year Picker Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsPopoverOpen(!isPopoverOpen);
            setYearSearchQuery('');
          }}
          className="btn-nav-glass"
          style={{
            height: '38px',
            width: '40px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            background: isPopoverOpen ? 'var(--accent-gold)' : 'rgba(30, 41, 59, 0.7)',
            color: isPopoverOpen ? '#0f172a' : 'var(--text-gold)',
            borderColor: isPopoverOpen ? 'var(--accent-gold)' : 'var(--border-glass)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
          title="Buka Menu Pemilih Dekade & Tahun Lampau"
        >
          <Calendar size={16} />
        </button>
      </div>

      {/* Live Badge Preview & Helper Info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 5,
          fontSize: '11px',
          color: 'var(--text-secondary)',
          minHeight: '18px',
        }}
      >
        {ageDisplay ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>
              ✨ {ageDisplay.formatted}
            </span>
            {ageDisplay.ageText && (
              <span
                style={{
                  background: isDeceased ? 'rgba(148, 163, 184, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: isDeceased ? '#cbd5e1' : '#34d399',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '10.5px',
                }}
              >
                {ageDisplay.ageText}
              </span>
            )}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            💡 Cukup isi <strong>Tahun</strong> jika tanggal/bulan tidak diketahui.
          </span>
        )}

        {value && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '10.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              padding: '1px 4px',
            }}
            title="Hapus tanggal"
          >
            <X size={11} /> Reset
          </button>
        )}
      </div>

      {/* Rich Interactive Popover: Decade Jumper & Year Matrix */}
      {isPopoverOpen && (
        <div
          ref={popoverRef}
          className="smart-date-popover scaleIn"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            left: 0,
            zIndex: 9999,
            background: 'var(--bg-glass-heavy)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid var(--accent-gold)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.2)',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxWidth: '100%',
          }}
        >
          {/* Popover Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-gold)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Pilih Dekade & Tahun Lampau
            </div>
            <button
              type="button"
              onClick={() => setIsPopoverOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#cbd5e1',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Quick Year Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Cari atau ketik tahun (misal: 1945, 1968)..."
              value={yearSearchQuery}
              onChange={(e) => setYearSearchQuery(e.target.value)}
              className="form-input"
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                background: 'rgba(15, 23, 42, 0.85)',
              }}
              autoFocus
            />
          </div>

          {/* If Searching, show search results */}
          {filteredSearchYears ? (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Hasil Pencarian Tahun ({filteredSearchYears.length}):
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 6,
                  maxHeight: '160px',
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {filteredSearchYears.map((yr) => {
                  const isSelected = selectedYear === String(yr);
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleSelectYearFromPopover(yr)}
                      className={`btn-year-pill ${isSelected ? 'active' : ''}`}
                      style={{
                        padding: '7px 4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-glass)',
                        background: isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                        color: isSelected ? '#fbbf24' : '#f8fafc',
                        cursor: 'pointer',
                      }}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Decade Selector Horizontal Pills */}
              <div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600 }}>
                  PILIH DEKADE:
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 5,
                    overflowX: 'auto',
                    paddingBottom: 4,
                    scrollbarWidth: 'thin',
                  }}
                >
                  {DECADES.map((dec) => {
                    const isActive = activeDecadeStart === dec.start;
                    return (
                      <button
                        key={dec.start}
                        type="button"
                        onClick={() => setActiveDecadeStart(dec.start)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: isActive ? 700 : 500,
                          borderRadius: 'var(--radius-sm)',
                          border: isActive ? '1px solid var(--accent-gold)' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isActive ? 'var(--accent-gold)' : 'rgba(30, 41, 59, 0.5)',
                          color: isActive ? '#0f172a' : '#cbd5e1',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                      >
                        {dec.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Decade Navigation & 10-Year Matrix Grid */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-glass)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveDecadeStart((prev) => Math.max(1800, prev - 10))}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid var(--border-glass)',
                      color: '#cbd5e1',
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ChevronLeft size={13} /> Mundur 10 Thn
                  </button>

                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-gold)' }}>
                    Dekade {activeDecadeStart} - {activeDecadeStart + 9}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveDecadeStart((prev) => Math.min(CURRENT_DECADE_START, prev + 10))}
                    disabled={activeDecadeStart >= CURRENT_DECADE_START}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: '1px solid var(--border-glass)',
                      color: activeDecadeStart >= CURRENT_DECADE_START ? '#475569' : '#cbd5e1',
                      borderRadius: 4,
                      padding: '3px 8px',
                      fontSize: '11px',
                      cursor: activeDecadeStart >= CURRENT_DECADE_START ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    Maju 10 Thn <ChevronRight size={13} />
                  </button>
                </div>

                {/* 10 Year Buttons in a 5x2 Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 6,
                  }}
                >
                  {decadeYears.map((yr) => {
                    const isSelected = selectedYear === String(yr);
                    const isCur = yr === CURRENT_YEAR;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => handleSelectYearFromPopover(yr)}
                        style={{
                          padding: '8px 2px',
                          fontSize: '12px',
                          fontWeight: isSelected ? 800 : 600,
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected
                            ? '1.5px solid var(--accent-gold)'
                            : isCur
                            ? '1px dashed #38bdf8'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          background: isSelected
                            ? 'rgba(245, 158, 11, 0.3)'
                            : isCur
                            ? 'rgba(56, 189, 248, 0.1)'
                            : 'rgba(30, 41, 59, 0.7)',
                          color: isSelected ? '#fbbf24' : isCur ? '#38bdf8' : '#f1f5f9',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
                        }}
                      >
                        {yr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Presets Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 6,
                  flexWrap: 'wrap',
                  paddingTop: 4,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', gap: 5 }}>
                  <button
                    type="button"
                    onClick={() => handleSelectYearFromPopover(CURRENT_YEAR)}
                    style={{
                      fontSize: '10.5px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '3px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Tahun Ini ({CURRENT_YEAR})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectYearFromPopover(1970)}
                    style={{
                      fontSize: '10.5px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      padding: '3px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    1970
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectYearFromPopover(1950)}
                    style={{
                      fontSize: '10.5px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      padding: '3px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    1950
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectYearFromPopover(1930)}
                    style={{
                      fontSize: '10.5px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      padding: '3px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    1930
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPopoverOpen(false)}
                  style={{
                    fontSize: '11px',
                    background: 'var(--accent-gold)',
                    border: 'none',
                    color: '#0f172a',
                    padding: '3px 10px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Selesai
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
