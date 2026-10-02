import { DEFAULT_BADGE_COLOR } from "@/lib/constants/delivery";
import { toDateKey } from "@/lib/date";
import { stripClosingWord } from "@/lib/speech/closing-word";
import type { KnownCompanies } from "@/types/delivery";
import type { ParsedDelivery } from "@/types/recording";

/**
 * Turns a spoken delivery ("납품일 -> 납품처 -> 메모 -> 끝") into fields:
 * "10월 7일 홈플러스 1급진간장 1.8리터 10통 끝" →
 * { delivery_date: "2026-10-07", company_name: "홈플러스", memo: "1급진간장 1.8리터 10통" }
 * plus the 납품처's last badge colour.
 * The result is a best-effort suggestion: the user always confirms/edits it.
 */

const SINO_DIGITS: Record<string, number> = {
  일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 칠: 7, 팔: 8, 구: 9,
};
/** Spoken month names without "월": "시월" → 시, "유월" → 유. */
const SPOKEN_MONTHS: Record<string, number> = {
  십이: 12, 십일: 11, 시: 10, 구: 9, 팔: 8, 칠: 7, 유: 6, 오: 5, 사: 4, 삼: 3, 이: 2, 일: 1,
};
const RELATIVE_DAYS = { 오늘: 0, 내일: 1, 모레: 2 } as const;

const MONTH = String.raw`(\d{1,2}|${Object.keys(SPOKEN_MONTHS).join("|")})\s*월`;
const DAY = String.raw`(\d{1,2}|[이삼]?십[일이삼사오육칠팔구]?|[일이삼사오육칠팔구])\s*일`;
const DATE_END = String.raw`(?:에|까지)?(?=$|\s|[.,!?])`;
/** 납품일 said as "10월 7일", "시월 칠일", "7일", "내일" (optionally after the word "납품일"). */
const DATE = new RegExp(
  String.raw`(?:^|\s)(?:납품일\s*)?(?:(?:${MONTH}\s*)?${DAY}|(오늘|내일|모레))${DATE_END}`,
);
/** Anywhere in the text, only unambiguous forms (month + day, or digits + 일). */
const DATE_ANYWHERE = new RegExp(
  String.raw`(?:^|\s)(?:${MONTH}\s*${DAY}|(\d{1,2})\s*일)${DATE_END}`,
);

/** Collapses spaces and drops the closing "끝" ("… 10통끝!" → "… 10통"). */
function normalize(text: string): string {
  return stripClosingWord(text.replace(/\s+/g, " "));
}

function spokenNumber(word: string): number {
  if (/^\d+$/.test(word)) return Number(word);
  if (!word.includes("십")) return SINO_DIGITS[word] ?? 0;
  const [tens, ones] = word.split("십");
  return (tens ? SINO_DIGITS[tens] : 1) * 10 + (ones ? SINO_DIGITS[ones] : 0);
}

function monthNumber(word: string): number {
  return /^\d+$/.test(word) ? Number(word) : (SPOKEN_MONTHS[word] ?? 0);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function validDate(y: number, m: number, d: number): Date | null {
  const date = new Date(y, m, d);
  return date.getMonth() === ((m % 12) + 12) % 12 && date.getDate() === d
    ? date
    : null;
}

/** "29일" → next occurrence of the 29th (today included). */
function resolveDayOnly(day: number, today: Date): Date | null {
  for (let offset = 0; offset < 3; offset += 1) {
    const candidate = validDate(today.getFullYear(), today.getMonth() + offset, day);
    if (candidate && candidate >= today) return candidate;
  }
  return null;
}

/** "10월 7일" → this year, or next year when that day has already passed. */
function resolveMonthDay(month: number, day: number, today: Date): Date | null {
  if (month < 1 || month > 12) return null;
  const thisYear = validDate(today.getFullYear(), month - 1, day);
  if (!thisYear) return null;
  return thisYear >= today
    ? thisYear
    : validDate(today.getFullYear() + 1, month - 1, day);
}

function resolveDate(
  month: string | undefined,
  day: string | undefined,
  relative: string | undefined,
  today: Date,
): Date | null {
  if (relative) {
    const offset = RELATIVE_DAYS[relative as keyof typeof RELATIVE_DAYS];
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  }
  if (!day) return null;
  return month
    ? resolveMonthDay(monthNumber(month), spokenNumber(day), today)
    : resolveDayOnly(spokenNumber(day), today);
}

/** Splits `text` after its first `count` non-space characters. */
function splitAfterLetters(text: string, count: number): [string, string] {
  let seen = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== " ") seen += 1;
    if (seen === count) return [text.slice(0, i + 1), text.slice(i + 1)];
  }
  return [text, ""];
}

/**
 * 납품처 is the start of the rest: a company name used before (longest
 * match, spaces ignored: "우리식당" = "우리 식당"), otherwise the first word.
 */
function splitCompanyMemo(
  rest: string,
  knownCompanies: KnownCompanies,
): { company_name: string; memo: string } {
  const compactRest = rest.replace(/\s/g, "");
  const known = [...knownCompanies.keys()]
    .map((name) => ({ name: name.trim(), compact: name.replace(/\s/g, "") }))
    .filter(({ compact }) => compact && compactRest.startsWith(compact))
    .sort((a, b) => b.compact.length - a.compact.length)[0];
  if (known) {
    const [, memo] = splitAfterLetters(rest, known.compact.length);
    // Whole words only: a saved "하나" must not split "하나마트".
    if (!memo || memo.startsWith(" ")) {
      return { company_name: known.name, memo: memo.trim() };
    }
  }
  const [company_name = "", ...memo] = rest.split(" ").filter(Boolean);
  return { company_name, memo: memo.join(" ") };
}

/**
 * The date is expected first; if it is not, the first unambiguous date in
 * the sentence is used. The rest (without "끝") is 납품처 followed by the memo.
 * The badge colour is the one last used with that 납품처.
 *
 * @param knownCompanies 납품처 from earlier deliveries with their last colour,
 *   used to keep multi-word names ("우리 식당") together and to pick the colour
 */
export function parseDeliveryTranscript(
  segments: readonly string[],
  now: Date = new Date(),
  knownCompanies: KnownCompanies = new Map(),
): ParsedDelivery {
  const today = startOfDay(now);
  const text = normalize(segments.join(" "));

  const leading = DATE.exec(text);
  const match = leading?.index === 0 ? leading : DATE_ANYWHERE.exec(text);
  const withColor = (delivery_date: string, rest: string): ParsedDelivery => {
    const fields = splitCompanyMemo(rest, knownCompanies);
    return {
      delivery_date,
      ...fields,
      badge_color: knownCompanies.get(fields.company_name) || DEFAULT_BADGE_COLOR,
    };
  };
  if (!match) return withColor("", text);

  const [, month, day, relativeOrDigitDay] = match;
  // DATE captures (month, day, relative); DATE_ANYWHERE captures (month, day, digitDay).
  const date =
    match === leading
      ? resolveDate(month, day, relativeOrDigitDay, today)
      : resolveDate(month, day ?? relativeOrDigitDay, undefined, today);
  const rest = `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`
    .replace(/^[\s.,!?]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  return withColor(date ? toDateKey(date) : "", rest);
}
