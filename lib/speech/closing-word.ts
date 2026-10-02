/**
 * The word people say to finish a delivery: "끝" (also "끝.", "끝!", "끝이요",
 * "끝입니다", or written onto the previous word: "10통끝") or "이상"/"이상입니다"
 * as a separate last word ("100개 이상 주세요" does not end with it).
 */
const ENDING = String.raw`(?:입니다|이에요|이요|요|이야)?[\s.!?~]*$`;
const CLOSING = new RegExp(String.raw`(?:\s*끝|(?:^|\s)이상)${ENDING}`);
/**
 * While speech is still interim only "끝" counts: "100개 이상" can continue
 * ("…이상 주세요"), "끝" at the end of a delivery does not.
 */
const CLOSING_INTERIM = new RegExp(String.raw`\s*끝${ENDING}`);

export function endsWithClosingWord(text: string, { interim = false } = {}): boolean {
  return (interim ? CLOSING_INTERIM : CLOSING).test(text.trim());
}

/** "… 1.8리터 10통끝!" → "… 1.8리터 10통" */
export function stripClosingWord(text: string): string {
  return text.trim().replace(CLOSING, "").trim();
}
