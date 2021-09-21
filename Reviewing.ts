// deno-lint-ignore-file camelcase
import { DataTypes, Model } from "https://deno.land/x/denodb/mod.ts";
import Answer from "./Answer.ts";
import { GENERAL, LAPSES, OLD_FILES } from "./utils/config.ts";
const INITIAL_EASE_FACTOR = 2.5;
const MINIMUM_EASE_FACTOR = 1.3;
const EASE_FACTOR_AGAIN_DELTA = -0.2;
const EASE_FACTOR_HARD_DELTA = -0.15;
const EASE_FACTOR_EASY_DELTA = 0.15;

class Reviewing extends Model {
  static table = 'reviews';
  
  scheduled_days = 0;
  //   elapsed_days = 0;
  get elapsed_days() {
    return (new Date().getTime() - this.due_date) / 100000000;
  }
  due_date = new Date().getTime();
  _ease_factor = INITIAL_EASE_FACTOR;
  get ease_factor() {
    return this._ease_factor;
  }
  set ease_factor(value) {
    this._ease_factor = parseFloat(value.toFixed(2));
  }
  lapses = 0;
  leeched = false;
  get days_late() {
    return this.elapsed_days - this.scheduled_days;
  }

  static fields = {
    name: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    scheduled_days: DataTypes.INTEGER,
    _ease_factor: DataTypes.INTEGER,
    dueDate: DataTypes.INTEGER,
    // graduated: DataTypes.BOOLEAN,
    // suspended: DataTypes.BOOLEAN,
    status: DataTypes.TEXT,
    lapses: DataTypes.INTEGER,
    leeched: DataTypes.BOOLEAN,
  };

  next_states(answer: Answer) {
    const [
      hard_interval,
      good_interval,
      easy_interval,
    ] = this.passing_review_intervals();
    switch (answer) {
      case Answer.AGAIN:
        this.answer_again();
        break;
      case Answer.HARD:
        this.answer_hard(hard_interval);
        break;
      case Answer.GOOD:
        this.answer_good(good_interval);
        break;
      case Answer.EASY:
        this.answer_easy(easy_interval);
        break;
    }
  }

  private answer_again() {
    this.lapses = this.lapses + 1;
    this.leeched = this.leech_threshold_met(
      this.lapses,
      LAPSES.LEECH_THRESHOLD,
    );

    this.scheduled_days = Math.max(
      Math.round(this.scheduled_days * LAPSES.NEW_INTERVAL),
      LAPSES.MINIMUM_INTERVAL,
      1,
    );

    // this.elapsed_days = 0;
    this.due_date = new Date().getTime();
    this.ease_factor = Math.max(
      this.ease_factor + EASE_FACTOR_AGAIN_DELTA,
      MINIMUM_EASE_FACTOR,
    );
  }

  private answer_hard(scheduled_days: number) {
    this.scheduled_days = scheduled_days;
    this.due_date = new Date().getTime();
    // this.elapsed_days = 0;
    this.ease_factor = Math.max(
      this.ease_factor + EASE_FACTOR_HARD_DELTA,
      MINIMUM_EASE_FACTOR,
    );
  }

  private answer_good(scheduled_days: number) {
    this.scheduled_days = scheduled_days;
    this.due_date = new Date().getTime();
    // this.elapsed_days = 0;
  }

  private answer_easy(scheduled_days: number) {
    this.scheduled_days = scheduled_days;
    this.due_date = new Date().getTime();
    // this.elapsed_days = 0;
    this.ease_factor = this.ease_factor + EASE_FACTOR_EASY_DELTA;
  }

  private passing_review_intervals() {
    if (this.days_late < 0) return this.passing_early_review_intervals();
    return this.passing_nonearly_review_intervals();
  }

  private passing_nonearly_review_intervals() {
    const current_interval = this.scheduled_days;
    const days_late = Math.max(this.days_late, 0);
    const hard_factor = OLD_FILES.HARD_INTERVAL;
    const hard_minimum = hard_factor <= 1.0 ? 0 : this.scheduled_days + 1;

    // fixme: floor() is to match python
    const hard_interval = this.constrain_passing_interval(
      current_interval * hard_factor,
      hard_minimum,
      GENERAL.FUZZ_FACTOR,
    );
    const good_interval = this.constrain_passing_interval(
      (current_interval + Math.round(days_late / 2.0)) * this.ease_factor,
      hard_interval + 1,
      GENERAL.FUZZ_FACTOR,
    );
    const easy_interval = this.constrain_passing_interval(
      (current_interval + days_late) * this.ease_factor *
        OLD_FILES.EASY_BONUS,
      good_interval + 1,
      GENERAL.FUZZ_FACTOR,
    );

    return [hard_interval, good_interval, easy_interval];
  }

  private passing_early_review_intervals() {
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
        Math.round(
          Math.max(elapsed * this.ease_factor, scheduled) *
            reduced_bonus,
        ),
        0,
        false,
      );
    })();
    return [hard_interval, good_interval, easy_interval];
  }

  private constrain_passing_interval(
    interval: number,
    minimum: number,
    fuzz: boolean,
  ) {
    // fixme: floor is to match python
    interval = interval * OLD_FILES.INTERVAL_MODIFIER;
    interval = fuzz ? this.with_review_fuzz(interval) : Math.round(interval);
    return Math.max(
      Math.min(Math.max(interval, minimum), OLD_FILES.MAXIMUM_INTERVAL),
      1,
    );
  }

  private with_review_fuzz(interval: number) {
    // fixme: floor() is to match python
    // input type might be float, but output is int
    let lower: number, upper: number;
    if (interval < 2) {
      [lower, upper] = [1, 1];
    } else if (interval < 3) {
      [lower, upper] = [2, 3];
    } else if (interval < 7) {
      [lower, upper] = this.fuzz_range(interval, 0.25, 0);
    } else if (interval < 30) {
      [lower, upper] = this.fuzz_range(interval, 0.15, 2);
    } else {
      [lower, upper] = this.fuzz_range(interval, 0.05, 4);
    }
    if (lower >= upper) return Math.round(lower);
    else return Math.floor(lower + Math.random() * (upper - lower + 1));
  }

  private fuzz_range(interval: number, factor: number, minimum: number) {
    const delta = Math.max(interval * factor, minimum, 1);
    return [Math.round(interval - delta), Math.round(interval + delta)];
  }

  // True when lapses is at threshold, or every half threshold after that.
  // Non-even thresholds round up the half threshold.
  private leech_threshold_met(lapses: number, threshold: number) {
    if (threshold > 0) {
      const half_threshold = Math.max(Math.ceil(threshold / 2.0), 1.0);
      // at threshold, and every half threshold after that, rounding up
      return lapses >= threshold && (lapses - threshold) % half_threshold == 0;
    } else return false;
  }
}

export default Reviewing;
