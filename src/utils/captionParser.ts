import { z } from "zod";

export const WordTimestampSchema = z.object({
  word: z.string(),
  start: z.number(),
  end: z.number(),
});

export type WordTimestamp = z.infer<typeof WordTimestampSchema>;

export const CaptionSegmentSchema = z.object({
  words: z.array(WordTimestampSchema),
  startTime: z.number(),
  endTime: z.number(),
});

export type CaptionSegment = z.infer<typeof CaptionSegmentSchema>;

const MAX_WORDS_PER_LINE = 5;
const MAX_LINES = 2;
const MAX_WORDS_PER_SEGMENT = MAX_WORDS_PER_LINE * MAX_LINES;
const PAUSE_THRESHOLD_MS = 0.4; // seconds — split on natural pauses

/**
 * Groups word-level timestamps into caption segments
 * that respect speech rhythm and display constraints.
 */
export function buildCaptionSegments(
  words: WordTimestamp[]
): CaptionSegment[] {
  if (words.length === 0) return [];

  const segments: CaptionSegment[] = [];
  let currentWords: WordTimestamp[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);

    const isLastWord = i === words.length - 1;
    const reachedMax = currentWords.length >= MAX_WORDS_PER_SEGMENT;
    const nextWord = words[i + 1];
    const hasNaturalPause =
      nextWord && nextWord.start - word.end > PAUSE_THRESHOLD_MS;

    if (isLastWord || reachedMax || hasNaturalPause) {
      segments.push({
        words: [...currentWords],
        startTime: currentWords[0].start,
        endTime: currentWords[currentWords.length - 1].end,
      });
      currentWords = [];
    }
  }

  return segments;
}

/**
 * Split a segment's words into lines for display (max 2 lines).
 */
export function splitIntoLines(
  words: WordTimestamp[]
): WordTimestamp[][] {
  if (words.length <= MAX_WORDS_PER_LINE) return [words];

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint), words.slice(midpoint)];
}

/**
 * Returns the index of the currently active word based on frame time.
 */
export function getActiveWordIndex(
  words: WordTimestamp[],
  currentTimeSec: number
): number {
  for (let i = words.length - 1; i >= 0; i--) {
    if (currentTimeSec >= words[i].start) {
      return i;
    }
  }
  return -1;
}
