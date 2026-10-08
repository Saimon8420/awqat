import type { CSSProperties, ReactNode } from "react";
import { formatTime } from "@/lib/format";
import { label, toNumerals } from "@/lib/i18n";
import { weekdayName, type SpecialType } from "@/lib/calendar";
import type { MonthlyResponse } from "@/lib/miqaat";
import type { StudioState } from "@/lib/state";
import { PRAYER_ROW_KEYS, hijriMonthShort, useNow } from "./common";

/** How a design dresses the shared monthly table. */
export type TableLook = {
  font: string;
  color: string;
  headColor: string;
  headStyle?: CSSProperties;
  /** Rule under the header row. */
  headRule: string;
  /** Rules framing the whole table (Parchment's almanac lines). */
  frameTop?: string;
  frameBottom?: string;
  stripe?: (i: number) => string | undefined;
  todayStyle: CSSProperties;
  fridayStyle?: CSSProperties;
  hijriColor: string;
  fastColor: string;
  /** Background for Ramadan's highlighted nights / Eid rows. */
  specialBg: string;
  /** Rounded row ends (Daylight's pill rows). */
  pillRows?: boolean;
};

const HIGHLIGHT_TAG: Partial<Record<SpecialType, string>> = {
  "laylat-al-qadr": "Laylat al-Qadr",
  "white-day": "White day",
  "eid-al-fitr": "Eid al-Fitr",
};
const HIGHLIGHT_TYPES = Object.keys(HIGHLIGHT_TAG) as SpecialType[];

function todayISO(tz: string, now: number): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

/**
 * One row per day of the month. Columns: date · Hijri · (Sehri) · the shown
 * prayers · (Iftar). In Ramadan mode Sehri and Iftar move up front, set
 * larger, and Ramadan's special nights get a highlight + tag. Landscape pages
 * split the month into two side-by-side halves so ~31 rows fit the short page.
 */
export function MonthTable({
  monthly,
  specialDays,
  state,
  look,
  size,
}: {
  monthly: MonthlyResponse;
  specialDays: Record<string, SpecialType[]>;
  state: StudioState;
  look: TableLook;
  /** Body font size in px (header is a touch smaller). */
  size: number;
}) {
  const now = useNow(60_000);
  const { lang, numerals, hour12, ramadan } = state;
  const tz = monthly.location.timezone;
  const today = todayISO(tz, now);
  const showFast = ramadan || state.showFasting;
  const rows = PRAYER_ROW_KEYS.filter((k) => state.showRows[k] !== false);
  const fmt = (iso: string) => formatTime(iso, { hour12, lang: numerals, timezone: tz });
  const n = (v: number) => toNumerals(String(v), numerals);

  const landscape = state.orientation === "landscape";
  const half = Math.ceil(monthly.days.length / 2);
  const chunks = landscape ? [monthly.days.slice(0, half), monthly.days.slice(half)] : [monthly.days];
  const fs = landscape ? size * 0.92 : size;

  const th: CSSProperties = {
    color: look.headColor,
    fontWeight: 600,
    fontSize: fs * 0.72,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: `${fs * 0.35}px ${fs * 0.3}px`,
    borderBottom: look.headRule,
    whiteSpace: "nowrap",
    ...look.headStyle,
  };
  const cell: CSSProperties = { padding: `0 ${fs * 0.3}px`, whiteSpace: "nowrap" };
  const timeCell: CSSProperties = { ...cell, textAlign: "end", fontVariantNumeric: "tabular-nums" };
  const fastCell: CSSProperties = {
    ...timeCell,
    color: look.fastColor,
    fontWeight: ramadan ? 700 : 600,
    fontSize: ramadan ? fs * 1.08 : fs,
  };

  const fastHead = (key: "sehri" | "iftar") => (
    <th style={{ ...th, textAlign: "end", color: look.fastColor }}>{label(key, lang)}</th>
  );

  const table = (days: typeof monthly.days, offset: number) => (
    <table
      style={{
        width: "100%",
        height: "100%",
        borderCollapse: "separate",
        borderSpacing: 0,
        tableLayout: "auto",
        fontFamily: look.font,
        fontSize: fs,
        lineHeight: 1.22,
        color: look.color,
        borderTop: look.frameTop,
        borderBottom: look.frameBottom,
      }}
    >
      <thead>
        <tr>
          <th style={{ ...th, textAlign: "start" }}>{label("date", lang)}</th>
          <th style={{ ...th, textAlign: "start" }}>{label("hijri", lang)}</th>
          {showFast && ramadan && fastHead("sehri")}
          {showFast && ramadan && fastHead("iftar")}
          {showFast && !ramadan && fastHead("sehri")}
          {rows.map((k) => (
            <th key={k} style={{ ...th, textAlign: "end", opacity: ramadan ? 0.8 : 1 }}>
              {label(k, lang)}
            </th>
          ))}
          {showFast && !ramadan && fastHead("iftar")}
        </tr>
      </thead>
      <tbody>
        {days.map((day, j) => {
          const i = offset + j;
          const isToday = day.dateISO === today;
          const isFriday = new Date(`${day.dateISO}T00:00:00Z`).getUTCDay() === 5;
          const types = specialDays[day.dateISO] ?? [];
          const special = ramadan ? HIGHLIGHT_TYPES.find((t) => types.includes(t)) : undefined;
          const showMonth = j === 0 || day.hijri.day === 1;
          const rowStyle: CSSProperties = {
            background: look.stripe?.(i),
            ...(isFriday ? look.fridayStyle : null),
            ...(special ? { background: look.specialBg } : null),
            ...(isToday ? look.todayStyle : null),
          };
          const pill = (first: boolean, last: boolean): CSSProperties =>
            look.pillRows
              ? {
                  borderTopLeftRadius: first ? 8 : 0,
                  borderBottomLeftRadius: first ? 8 : 0,
                  borderTopRightRadius: last ? 8 : 0,
                  borderBottomRightRadius: last ? 8 : 0,
                }
              : {};
          type Col = { key: string; style: CSSProperties; content: ReactNode };
          const cols: Col[] = [
            {
              key: "d",
              style: cell,
              content: (
                <>
                  <span style={{ fontWeight: 600 }}>{n(Number(day.dateISO.slice(8, 10)))}</span>{" "}
                  <span style={{ opacity: 0.7 }}>{weekdayName(day.dateISO, lang)}</span>
                  {special && (
                    <span
                      style={{ marginInlineStart: 8, fontSize: fs * 0.7, fontWeight: 700, color: look.fastColor }}
                    >
                      {HIGHLIGHT_TAG[special]}
                    </span>
                  )}
                </>
              ),
            },
            {
              key: "h",
              style: { ...cell, color: isToday ? undefined : look.hijriColor },
              content: `${n(day.hijri.day)}${showMonth ? ` ${hijriMonthShort(day.hijri.monthName)}` : ""}`,
            },
          ];
          // On today's highlighted row the fasting times take the row's own colour.
          const fastStyle: CSSProperties = isToday ? { ...fastCell, color: "inherit" } : fastCell;
          const sehri: Col = { key: "s", style: fastStyle, content: fmt(day.fasting.sehri) };
          const iftar: Col = { key: "i", style: fastStyle, content: fmt(day.fasting.iftar) };
          if (showFast && ramadan) cols.push(sehri, iftar);
          if (showFast && !ramadan) cols.push(sehri);
          for (const k of rows) {
            cols.push({ key: k, style: { ...timeCell, opacity: ramadan ? 0.85 : 1 }, content: fmt(day.prayers[k]) });
          }
          if (showFast && !ramadan) cols.push(iftar);
          return (
            <tr key={day.dateISO} style={rowStyle}>
              {cols.map((c, ci) => (
                <td key={c.key} style={{ ...c.style, ...pill(ci === 0, ci === cols.length - 1) }}>
                  {c.content}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  if (monthly.days.length === 0) {
    return (
      <p style={{ flex: 1, textAlign: "center", fontSize: 28, opacity: 0.7 }}>
        No prayer times available for this month yet.
      </p>
    );
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", gap: 28, flexDirection: landscape ? "row" : "column" }}>
      {chunks.map((days, ci) => (
        <div key={ci} style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex" }}>
          {table(days, ci === 0 ? 0 : half)}
        </div>
      ))}
    </div>
  );
}
