/**
 * Wake phrase "오케이 배달" as speech recognition may write it:
 * "오케이 배달", "오케이배달", "OK 배달", "okay 배달", "오케 배달".
 */
const WAKE_PHRASE = /(?:오케이|오케|okay|ok)[\s,.!]*배달[\s,.!~]*/i;

export interface WakeMatch {
  /** Whatever was said after the wake phrase in the same breath. */
  rest: string;
}

export function findWakeWord(text: string): WakeMatch | null {
  const match = WAKE_PHRASE.exec(text);
  if (!match) return null;
  return { rest: text.slice(match.index + match[0].length).trim() };
}
