import { describe, it, expect } from 'vitest';
import { schedule, isValidGrade, INITIAL_EASE_FACTOR } from './spacedRepetition';

describe('schedule', () => {
  it('rejects an unknown grade', () => {
    expect(() => schedule(undefined, 'meh')).toThrow('Invalid grade');
  });

  it('starts a never-reviewed card from the SM-2 defaults', () => {
    const result = schedule(undefined, 'good');
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBeCloseTo(INITIAL_EASE_FACTOR, 5);
  });

  it('walks the 1 -> 6 -> interval*ease ladder on repeated "good"', () => {
    const afterFirst = schedule(undefined, 'good');
    expect(afterFirst.intervalDays).toBe(1);

    const afterSecond = schedule(afterFirst, 'good');
    expect(afterSecond.intervalDays).toBe(6);

    const afterThird = schedule(afterSecond, 'good');
    expect(afterThird.intervalDays).toBe(Math.round(afterSecond.intervalDays * afterSecond.easeFactor));
  });

  it('resets repetitions and interval to 1 day on "again", regardless of history', () => {
    let progress = schedule(undefined, 'good');
    progress = schedule(progress, 'good');
    expect(progress.repetitions).toBe(2);

    const afterAgain = schedule(progress, 'again');
    expect(afterAgain.repetitions).toBe(0);
    expect(afterAgain.intervalDays).toBe(1);
  });

  it('increases ease factor on "easy" and decreases it on "hard"', () => {
    const afterEasy = schedule(undefined, 'easy');
    const afterHard = schedule(undefined, 'hard');
    expect(afterEasy.easeFactor).toBeGreaterThan(INITIAL_EASE_FACTOR);
    expect(afterHard.easeFactor).toBeLessThan(INITIAL_EASE_FACTOR);
  });

  it('never lets ease factor drop below 1.3', () => {
    let progress;
    for (let i = 0; i < 20; i++) {
      progress = schedule(progress, 'hard');
    }
    expect(progress.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('sets dueDate intervalDays in the future', () => {
    const before = Date.now();
    const result = schedule(undefined, 'good');
    const expectedMs = before + result.intervalDays * 86400000;
    expect(Math.abs(result.dueDate.getTime() - expectedMs)).toBeLessThan(5000);
  });
});

describe('isValidGrade', () => {
  it('accepts the four SM-2 grades and rejects anything else', () => {
    expect(isValidGrade('again')).toBe(true);
    expect(isValidGrade('hard')).toBe(true);
    expect(isValidGrade('good')).toBe(true);
    expect(isValidGrade('easy')).toBe(true);
    expect(isValidGrade('perfect')).toBe(false);
  });
});
