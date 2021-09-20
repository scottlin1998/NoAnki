// deno-lint-ignore-file camelcase
import { LAPSES, NEW_FILES, OLD_FILES } from "./utils/config.ts";
const INITIAL_EASE_FACTOR = 2.5;
const MINIMUM_EASE_FACTOR = 1.3;
const EASE_FACTOR_AGAIN_DELTA = -0.2;
const EASE_FACTOR_HARD_DELTA = -0.15;
const EASE_FACTOR_EASY_DELTA = 0.15;
class Review {
  scheduled_days = 0;
  elapsed_days = 0;
  ease_factor = INITIAL_EASE_FACTOR;
  lapses = 0;
  leeched = false;
  get days_late() {
    return this.elapsed_days - this.scheduled_days;
  }

  next_states() {
    const [hard_interval, good_interval, easy_interval] = this
      .passing_review_intervals();

    // this.answer_again();
    // this.answer_hard(hard_interval);
    this.answer_good(good_interval);
    // this.answer_easy(easy_interval);
    console.log(easy_interval);
    // console.log(easy_interval);
  }
  get failing_review_interval() {
    // fixme: floor() is for python
    return Math.max(
      Math.floor(this.scheduled_days * LAPSES.NEW_INTERVAL),
      LAPSES.MINIMUM_INTERVAL,
      1,
    );
  }

  answer_again() {
    this.lapses = this.lapses + 1;
    this.leeched = this.leech_threshold_met(
      this.lapses,
      LAPSES.LEECH_THRESHOLD,
    );

    this.scheduled_days = this.failing_review_interval;
    this.elapsed_days = 0;
    this.ease_factor = Math.max(
      this.ease_factor + EASE_FACTOR_AGAIN_DELTA,
      MINIMUM_EASE_FACTOR,
    );
  }

  answer_hard(scheduled_days: number) {
    this.scheduled_days = scheduled_days;
    this.elapsed_days = 0;
    this.ease_factor = Math.max(
      this.ease_factor + EASE_FACTOR_HARD_DELTA,
      MINIMUM_EASE_FACTOR,
    );
  }

  answer_good(scheduled_days: number) {
    this.scheduled_days = scheduled_days;
    this.elapsed_days = 0;
  }

  answer_easy(scheduled_days: number) {
    this.scheduled_days = scheduled_days;
    this.elapsed_days = 0;
    this.ease_factor = this.ease_factor + EASE_FACTOR_EASY_DELTA;
  }

  passing_review_intervals() {
    // if (this.days_late < 0) {
    //   //   console.log(this.days_late);
    //   return this.passing_early_review_intervals();
    // } else {
      return this.passing_nonearly_review_intervals();
    // }
  }

  passing_nonearly_review_intervals() {
    const current_interval = this.scheduled_days;
    const days_late = Math.max(this.days_late, 0);
    const hard_factor = OLD_FILES.HARD_INTERVAL;
    const hard_minimum = hard_factor <= 1.0 ? 0 : this.scheduled_days + 1;

    // fixme: floor() is to match python
    const hard_interval = this.constrain_passing_interval(
      current_interval * hard_factor,
      hard_minimum,
      true,
    );
    const good_interval = this.constrain_passing_interval(
      (current_interval + Math.floor(days_late / 2.0)) * this.ease_factor,
      hard_interval + 1,
      true,
    );
    const easy_interval = this.constrain_passing_interval(
      (current_interval + days_late) * this.ease_factor *
        OLD_FILES.EASY_BONUS,
      good_interval + 1,
      true,
    );

    return [hard_interval, good_interval, easy_interval];
  }
  passing_early_review_intervals() {
    const scheduled = this.scheduled_days;
    const elapsed = this.scheduled_days + this.days_late;
    const hard_interval = (() => {
      const half_usual = OLD_FILES.HARD_INTERVAL / 2.0;
      return this.constrain_passing_interval(
        Math.max(elapsed * OLD_FILES.HARD_INTERVAL, scheduled * half_usual),
        0,
        false,
      );
    })();

    const good_interval = this.constrain_passing_interval(
      Math.max(elapsed * this.ease_factor, scheduled),
      0,
      false,
    );

    const easy_interval = (() => {
      // currently flooring() f64s to match python output
      const easy_mult = OLD_FILES.EASY_BONUS;
      const reduced_bonus = easy_mult - (easy_mult - 1.0) / 2.0;
      return this.constrain_passing_interval(
        Math.floor(
          (elapsed * this.ease_factor, scheduled) *
            reduced_bonus,
        ),
        0,
        false,
      );
    })();
    return [hard_interval, good_interval, easy_interval];
  }
  constrain_passing_interval(interval: number, minimum: number, fuzz: boolean) {
    // fixme: floor is to match python
    interval = Math.floor(interval) * OLD_FILES.INTERVAL_MODIFIER;
    interval = fuzz ? this.with_review_fuzz(interval) : Math.floor(interval);
    return Math.max(
      Math.min(Math.max(interval, minimum), OLD_FILES.MAXIMUM_INTERVAL),
      1,
    );
  }
  with_review_fuzz(interval: number) {
    // fixme: floor() is to match python
    interval = Math.floor(interval);
    let lower: number, upper: number;
    if (interval < 2.0) {
      [lower, upper] = [1.0, 1.0];
    } else if (interval < 3.0) {
      [lower, upper] = [2.0, 3.0];
    } else if (interval < 7.0) {
      [lower, upper] = this.fuzz_range(interval, 0.25, 0.0);
    } else if (interval < 30.0) {
      [lower, upper] = this.fuzz_range(interval, 0.15, 2.0);
    } else {
      [lower, upper] = this.fuzz_range(interval, 0.05, 4.0);
    }
    if (lower >= upper) {
      return Math.round(lower);
    } else {
      return Math.floor(lower + Math.random() * (upper - lower));
    }
  }
  fuzz_range(interval: number, factor: number, minimum: number) {
    const delta = Math.max(interval * factor, minimum, 1.0);
    return [interval - delta, interval + delta + 1.0];
  }
  // True when lapses is at threshold, or every half threshold after that.
  // Non-even thresholds round up the half threshold.
  leech_threshold_met(lapses: number, threshold: number) {
    if (threshold > 0) {
      const half_threshold = Math.max(Math.ceil(threshold / 2.0), 1.0);
      // at threshold, and every half threshold after that, rounding up
      return lapses >= threshold && (lapses - threshold) % half_threshold == 0;
    } else return false;
  }
}

const r = new Review();
r.answer_easy(4);
r.next_states();
console.log(r);
r.next_states();
console.log(r);
r.next_states();
console.log(r);
r.next_states();
console.log(r);
r.next_states();
console.log(r);
r.next_states();
console.log(r);
export default Review;
