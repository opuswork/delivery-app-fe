import { toDateKey } from "@/lib/date";
import type { ParsedDelivery } from "@/types/recording";

/**
 * Turns a spoken delivery ("납품처 -> 상품명 -> 수량 -> 납품일") into fields.
 * The result is a best-effort suggestion: the user always confirms/edits it.
 */

const COUNT_UNITS =
  "박스|상자|봉지|묶음|세트|포대|케이스|통|개|병|봉|팩|캔|포|판|짝|박|말";
const MEASURE_UNITS = "kg|KG|킬로그램|킬로|키로|ml|ML|리터|L|l|g";
const NATIVE_NUMBERS: Record<string, number> = {
  한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4, 다섯: 5,
  여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10,
};
const SINO_DIGITS: Record<string, number> = {
  일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 칠: 7, 팔: 8, 구: 9,
};

const ARROW = /\s*(?:->|→|=>)\s*/;
const TOKEN_END = String.raw`(?=$|\s|[.,!?]|에|까지)`;
const QUANTITY = new RegExp(
  String.raw`(?:^|\s)(\d+(?:\.\d+)?)\s*(${COUNT_UNITS})${TOKEN_END}`,
  "g",
);
const MEASURE = new RegExp(
  String.raw`(?:^|\s)(\d+(?:\.\d+)?)\s*(${MEASURE_UNITS})${TOKEN_END}`,
  "g",
);
const MONTH_DAY = /(?:^|\s)(\d{1,2})\s*월\s*(\d{1,2})\s*일(?=$|\s|[.,!?]|에|까지)/g;
const DAY_ONLY = /(?:^|\s)(\d{1,2})\s*일(?=$|\s|[.,!?]|에|까지)/g;
const RELATIVE_DAY = /(?:^|\s)(오늘|내일|모레)(?=$|\s|[.,!?]|에|까지)/g;
const SINO_DAY = /(?:^|\s)([이삼]?십[일이삼사오육칠팔구]?|[일이삼사오육칠팔구])\s*일(?=$|\s|[.,!?]|에|까지)/g;

function normalizeNativeQuantities(text: string): string {
  const words = Object.keys(NATIVE_NUMBERS)
    .sort((a, b) => b.length - a.length)
    .join("|");
  const pattern = new RegExp(
    String.raw`(^|\s)(${words})\s*(${COUNT_UNITS})${TOKEN_END}`,
    "g",
  );
  return text.replace(
    pattern,
    (_, lead: string, word: string, unit: string) =>
      `${lead}${NATIVE_NUMBERS[word]}${unit}`,
  );
}

function sinoToNumber(word: string): number {
  if (!word.includes("십")) return SINO_DIGITS[word] ?? 0;
  const [tens, ones] = word.split("십");
  return (tens ? SINO_DIGITS[tens] : 1) * 10 + (ones ? SINO_DIGITS[ones] : 0);
}

function normalizeSinoDays(text: string): string {
  return text.replace(SINO_DAY, (match, word: string) => {
    const lead = match.startsWith(" ") ? " " : "";
    return `${lead}${sinoToNumber(word)}일`;
  });
}

/** Spoken month names → digits: "시월 삼일" → "10월 3일". Longest names first. */
const MONTH_NAMES: [string, number][] = [
  ["십이월", 12], ["십일월", 11], ["시월", 10], ["구월", 9], ["팔월", 8],
  ["칠월", 7], ["유월", 6], ["오월", 5], ["사월", 4], ["삼월", 3], ["이월", 2], ["일월", 1],
];
const MONTH_NAME = new RegExp(
  String.raw`(^|\s)(${MONTH_NAMES.map(([name]) => name).join("|")})(?=$|\s|\d|[일이삼사오육칠팔구십])`,
  "g",
);

function normalizeMonthNames(text: string): string {
  const months = new Map(MONTH_NAMES);
  // Trailing space lets "시월삼일" become "10월 삼일" for the day conversion.
  return text.replace(
    MONTH_NAME,
    (_, lead: string, name: string) => `${lead}${months.get(name)}월 `,
  );
}

/** "10개10월 3일" → "10개 10월 3일" (recognition sometimes drops the space). */
const UNIT_BEFORE_DIGIT = new RegExp(String.raw`(\d(?:${COUNT_UNITS}))(?=\d)`, "g");

/** Trailing words people say to finish a recording ("…30일 끝"). */
const CLOSING_WORDS = /(?:^|\s)(?:끝|이상|끝입니다|이상입니다)[.!]?$/;

function normalize(text: string): string {
  const cleaned = text
    .replace(/[,，。]|\.(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(CLOSING_WORDS, "")
    .replace(UNIT_BEFORE_DIGIT, "$1 ")
    .trim();
  return normalizeSinoDays(
    normalizeMonthNames(normalizeNativeQuantities(cleaned)),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function lastMatch(text: string, pattern: RegExp): RegExpExecArray | null {
  let last: RegExpExecArray | null = null;
  for (const match of text.matchAll(pattern)) last = match as RegExpExecArray;
  return last;
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

function resolveMonthDay(month: number, day: number, today: Date): Date | null {
  const thisYear = validDate(today.getFullYear(), month - 1, day);
  if (!thisYear) return null;
  return thisYear >= today
    ? thisYear
    : validDate(today.getFullYear() + 1, month - 1, day);
}

interface Extracted {
  value: string;
  rest: string;
}

function extractDate(text: string, today: Date): Extracted {
  const monthDay = lastMatch(text, MONTH_DAY);
  if (monthDay) {
    const date = resolveMonthDay(Number(monthDay[1]), Number(monthDay[2]), today);
    return { value: date ? toDateKey(date) : "", rest: remove(text, monthDay) };
  }
  const relative = lastMatch(text, RELATIVE_DAY);
  const dayOnly = lastMatch(text, DAY_ONLY);
  const pick =
    relative && (!dayOnly || relative.index > dayOnly.index) ? relative : dayOnly;
  if (!pick) return { value: "", rest: text };
  if (pick === relative) {
    const offset = { 오늘: 0, 내일: 1, 모레: 2 }[pick[1] as "오늘" | "내일" | "모레"];
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    return { value: toDateKey(date), rest: remove(text, pick) };
  }
  const date = resolveDayOnly(Number(pick[1]), today);
  return { value: date ? toDateKey(date) : "", rest: remove(text, pick) };
}

function extractQuantity(text: string): Extracted {
  const match = lastMatch(text, QUANTITY) ?? lastMatch(text, MEASURE);
  if (!match) return { value: "", rest: text };
  return { value: `${match[1]}${match[2]}`, rest: remove(text, match) };
}

function remove(text: string, match: RegExpExecArray): string {
  return `${text.slice(0, match.index)} ${text.slice(match.index + match[0].length)}`
    .replace(/\s+/g, " ")
    .trim();
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
 * 납품처 vs 상품명. Pause positions are not used: people pause inside names
 * ("신선유통 깔끔한 … 국간장"). Order of preference:
 * 1. explicit "->" separators,
 * 2. a company name used before (longest match, spaces ignored: "우리식당" = "우리 식당"),
 * 3. the first word.
 */
function splitCompanyProduct(
  rest: string,
  arrowParts: readonly string[],
  knownCompanies: readonly string[],
): { company: string; product: string } {
  if (arrowParts.length > 1 && rest.startsWith(`${arrowParts[0]} `)) {
    return { company: arrowParts[0], product: rest.slice(arrowParts[0].length).trim() };
  }

  const compactRest = rest.replace(/\s/g, "");
  const known = knownCompanies
    .map((name) => ({ name: name.trim(), compact: name.replace(/\s/g, "") }))
    .filter(({ compact }) => compact && compactRest.startsWith(compact))
    .sort((a, b) => b.compact.length - a.compact.length)[0];
  if (known) {
    const [, product] = splitAfterLetters(rest, known.compact.length);
    // Whole words only: a saved "하나" must not split "하나마트".
    if (product.startsWith(" ") && product.trim()) {
      return { company: known.name, product: product.trim() };
    }
  }

  const [company = "", ...product] = rest.split(" ").filter(Boolean);
  return { company, product: product.join(" ") };
}

/**
 * Date and quantity are searched in the whole sentence, so the result does
 * not depend on where the speaker paused (the order is 납품처 → 상품명 →
 * 수량 → 납품일, so the last date and last count are taken).
 *
 * @param knownCompanies company names from earlier deliveries, used to keep
 *   multi-word names ("우리 식당") together
 */
export function parseDeliveryTranscript(
  segments: readonly string[],
  now: Date = new Date(),
  knownCompanies: readonly string[] = [],
): ParsedDelivery {
  const today = startOfDay(now);
  const joined = segments.map((s) => s.trim()).filter(Boolean).join(" ");
  const arrowParts = joined.split(ARROW).map(normalize).filter(Boolean);

  const date = extractDate(normalize(joined.split(ARROW).join(" ")), today);
  const quantity = extractQuantity(date.rest);
  const { company, product } = splitCompanyProduct(
    quantity.rest,
    arrowParts,
    knownCompanies,
  );
  return {
    company_name: company,
    product_name: product,
    product_quantity: quantity.value,
    delivery_date: date.value,
  };
}
