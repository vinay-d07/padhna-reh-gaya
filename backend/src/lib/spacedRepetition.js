// SM-2 spaced-repetition scheduler (SuperMemo 2, Piotr Wozniak 1987), applied
// per (flashcard, user) — see backend/prisma/schema.prisma FlashcardProgress.
// Grades map to the algorithm's 0-5 quality scale; "again"/"hard" (quality <
// 3) reset the repetition count and force a same-day-ish relearn interval.
const GRADE_QUALITY = { again: 0, hard: 3, good: 4, easy: 5 };
const GRADES = Object.keys(GRADE_QUALITY);
const MIN_EASE_FACTOR = 1.3;
const INITIAL_EASE_FACTOR = 2.5;

function isValidGrade(grade) {
  return Object.prototype.hasOwnProperty.call(GRADE_QUALITY, grade);
}

// `progress` is the current { easeFactor, intervalDays, repetitions } (or
// undefined for a card never reviewed before, which starts from defaults).
// Returns the next state plus the computed `dueDate`.
function schedule(progress, grade) {
  if (!isValidGrade(grade)) {
    throw new Error(`Invalid grade "${grade}" — expected one of ${GRADES.join(', ')}`);
  }

  const quality = GRADE_QUALITY[grade];
  let easeFactor = progress?.easeFactor ?? INITIAL_EASE_FACTOR;
  let repetitions = progress?.repetitions ?? 0;
  let intervalDays = progress?.intervalDays ?? 0;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
  }

  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + intervalDays);

  return { easeFactor, intervalDays, repetitions, dueDate };
}

module.exports = { schedule, GRADES, isValidGrade, INITIAL_EASE_FACTOR };
