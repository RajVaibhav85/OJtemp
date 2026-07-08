import { useMemo, useState } from 'react';

const DAY_MS = 86400000;
const CELL = 11;
const GAP = 3;
const SPACER_WIDTH = CELL; // width of the blank gap column between months
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTHS_TO_SHOW = 12;

// GitHub's own scale: a neutral empty tone, then four increasingly
// saturated steps of the accent color.
function colorForCount(count) {
  if (count <= 0) return 'rgba(255, 255, 255, 0.06)';
  if (count === 1) return 'rgba(167, 139, 250, 0.35)';
  if (count === 2) return 'rgba(167, 139, 250, 0.55)';
  if (count <= 4) return 'rgba(167, 139, 250, 0.78)';
  return '#a78bfa';
}

// Local-calendar-day key (YYYY-MM-DD in the viewer's own timezone), matching
// what they'd expect "today" to mean. The backend groups heatmap entries by
// UTC day, which silently disagrees with this for part of the day in any
// timezone ahead of UTC (e.g. IST) — a problem solved this morning would
// otherwise render one cell left of where the viewer expects "today" to be.
function toLocalDayKey(utcDateStr) {
  const d = new Date(utcDateStr + 'T00:00:00Z');
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localDayKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function StreakHeatmap({ heatmap = [], currentStreak = 0, longestStreak = 0 }) {
  const [hovered, setHovered] = useState(null);

  const { columns, monthLabels, activeDays } = useMemo(() => {
    const dataByDate = new Map(heatmap.map(d => [toLocalDayKey(d.date), d]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Walk the last MONTHS_TO_SHOW real calendar months, oldest first. Each
    // month is its own self-contained block: the 1st lands on its actual
    // weekday (padded with transparent, non-interactive cells above it in
    // the first column — never a real day rendered on the wrong row), and
    // the block contains exactly that month's real day count, clipped to
    // today for the current month so no future days are drawn.
    const cols = [];
    const labels = [];
    let activeCount = 0;

    for (let offset = MONTHS_TO_SHOW - 1; offset >= 0; offset--) {
      const blockDate = new Date(today.getFullYear(), today.getMonth() - offset, 1);
      const y = blockDate.getFullYear();
      const m = blockDate.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const isCurrentMonth = y === today.getFullYear() && m === today.getMonth();
      const lastRealDay = isCurrentMonth ? today.getDate() : daysInMonth;
      const leadingBlank = new Date(y, m, 1).getDay(); // 0=Sun .. 6=Sat

      if (cols.length > 0) cols.push({ type: 'spacer' });
      labels.push({ colIndex: cols.length, label: blockDate.toLocaleString('en-US', { month: 'short' }) });

      // Slot index within the block = leadingBlank + (day - 1); every 7
      // slots is one column, so this naturally lines each day up against
      // the correct weekday row in the shared gutter on the left.
      const totalSlots = leadingBlank + daysInMonth;
      const blockCols = Math.ceil(totalSlots / 7);
      for (let c = 0; c < blockCols; c++) {
        const colDays = [];
        for (let r = 0; r < 7; r++) {
          const slot = c * 7 + r;
          const dayNum = slot - leadingBlank + 1;
          if (dayNum < 1 || dayNum > daysInMonth) {
            colDays.push(null); // no real day here — stays fully transparent
            continue;
          }
          const key = localDayKey(y, m, dayNum);
          const entry = dataByDate.get(key);
          const isFuture = dayNum > lastRealDay;
          const solved = entry?.solved || 0;
          if (!isFuture && solved > 0) activeCount++;
          colDays.push({
            date: key,
            count: entry?.count || 0,
            solved,
            empty: isFuture,
          });
        }
        cols.push({ type: 'week', days: colDays });
      }
    }

    return { columns: cols, monthLabels: labels, activeDays: activeCount };
  }, [heatmap]);

  const colWidth = (col) => (col.type === 'spacer' ? SPACER_WIDTH : CELL) + GAP;
  const gridWidth = columns.reduce((w, c) => w + colWidth(c), 0);
  const colLeft = (idx) => columns.slice(0, idx).reduce((w, c) => w + colWidth(c), 0);

  return (
    <div>
      <div style={{ display: 'flex', gap: '22px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#a78bfa' }}>🔥 {currentStreak}</span>
          <span style={{ fontSize: '11.5px', color: '#8d85ab' }}>day streak</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#f3f0ff' }}>{longestStreak}</span>
          <span style={{ fontSize: '11.5px', color: '#8d85ab' }}>longest streak</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px' }}>
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#f3f0ff' }}>{activeDays}</span>
          <span style={{ fontSize: '11.5px', color: '#8d85ab' }}>active days / yr</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: '6px' }}>
        <div style={{ display: 'flex', minWidth: gridWidth + 24 }}>
          {/* Shared weekday gutter — every month block's rows line up
              against this because each block pads its own first column to
              start on the correct weekday rather than always row 0. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: '6px', marginTop: '16px', flexShrink: 0 }}>
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} style={{ height: CELL, fontSize: '9px', lineHeight: `${CELL}px`, color: '#8d85ab' }}>
                {label}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: gridWidth }}>
            <div style={{ position: 'relative', height: '14px', marginBottom: '4px' }}>
              {monthLabels.map(m => (
                <span key={`${m.label}-${m.colIndex}`} style={{ position: 'absolute', left: colLeft(m.colIndex), fontSize: '10px', color: '#8d85ab' }}>
                  {m.label}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: GAP }}>
              {columns.map((col, cIdx) =>
                col.type === 'spacer' ? (
                  <div key={`spacer-${cIdx}`} style={{ width: SPACER_WIDTH, flexShrink: 0 }} />
                ) : (
                  <div key={`week-${cIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                    {col.days.map((day, rIdx) =>
                      day === null ? (
                        <div key={rIdx} style={{ width: CELL, height: CELL }} />
                      ) : (
                        <div
                          key={day.date}
                          onMouseEnter={() => !day.empty && setHovered(day)}
                          onMouseLeave={() => setHovered(null)}
                          title={day.empty ? '' : `${day.date}: ${day.solved} solved, ${day.count} submission(s)`}
                          style={{
                            width: CELL,
                            height: CELL,
                            borderRadius: '2px',
                            background: day.empty ? 'transparent' : colorForCount(day.solved),
                            outline: !day.empty && hovered?.date === day.date ? '1px solid #f3f0ff' : 'none',
                            outlineOffset: '-1px',
                            cursor: day.empty ? 'default' : 'pointer'
                          }}
                        />
                      )
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '11.5px', color: hovered ? '#c7bfe0' : '#6f6790', fontStyle: hovered ? 'normal' : 'italic', minHeight: '16px' }}>
          {hovered
            ? `${new Date(hovered.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} — ${hovered.solved} solved · ${hovered.count} submission${hovered.count === 1 ? '' : 's'}`
            : 'Hover a day for details'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10.5px', color: '#8d85ab', marginRight: '4px' }}>Less</span>
          {[0, 1, 2, 4, 6].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '2px', background: colorForCount(c) }} />
          ))}
          <span style={{ fontSize: '10.5px', color: '#8d85ab', marginLeft: '4px' }}>More</span>
        </div>
      </div>
    </div>
  );
}