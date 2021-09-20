import { DataTypes, Model } from "https://deno.land/x/denodb/mod.ts";
import { LAPSES, NEW_FILES, OLD_FILES } from "./utils/config.ts";

export enum Answer {
  AGAIN = "AGAIN",
  HARD = "HARD",
  GOOD = "GOOD",
  EASY = "EASY",
}
export enum Status {
  LEARNING = "LEARNING",
  REVIEWING = "REVIEWING",
  RELEARNING = "RELEARNING",
  // SUSPENDED = "SUSPENDED",
}

interface File {
  name: string;
  // interval: number;
  repetition: number;
  // ease_factor: number;
  dueDate: number;
  suspended: boolean;
  status: Status;
  steps: number;
}
const MINIMUM_EASE_FACTOR = 1.3;
const EASE_FACTOR_AGAIN_DELTA = -0.2;
const EASE_FACTOR_HARD_DELTA = -0.15;
const EASE_FACTOR_EASY_DELTA = 0.15;
const REDUCED_BONUS = OLD_FILES.EASY_BONUS - (OLD_FILES.EASY_BONUS - 1.0) / 2.0;
class File extends Model {
  /// Transform the provided hard/good/easy interval.
  /// - Apply configured interval multiplier.
  /// - Apply fuzz.
  /// - Ensure it is at least `minimum`, and at least 1.
  /// - Ensure it is at or below the configured maximum interval.
  private _interval = 1;
  get interval() {
    return this._interval;
  }
  set interval(value) {
    value *= OLD_FILES.INTERVAL_MODIFIER;
    if (value < LAPSES.MINIMUM_INTERVAL) {
      this._interval = LAPSES.MINIMUM_INTERVAL;
    } else if (value > OLD_FILES.MAXIMUM_INTERVAL) {
      this._interval = OLD_FILES.MAXIMUM_INTERVAL;
    } else {
      this._interval = value;
    }
  }
  private _ease_factor = 0;
  get ease_factor() {
    return this._ease_factor;
  }
  set ease_factor(value) {
    if (value < 1.3) this._ease_factor = MINIMUM_EASE_FACTOR;
    else this._ease_factor = value;
  }

  private _lapses = 0;
  private _leeched = false;

  get lapses() {
    return this._lapses;
  }
  set lapses(value) {
    this._lapses = value;
    // leech_threshold_met
    if (LAPSES.LEECH_THRESHOLD > 0) {
      const halfThreshold = Math.max(
        Math.ceil(LAPSES.LEECH_THRESHOLD / 2.0),
        1.0,
      );
      // at threshold, and every half threshold after that, rounding up
      this._leeched = this.lapses >= LAPSES.LEECH_THRESHOLD &&
        (this.lapses - LAPSES.LEECH_THRESHOLD) % halfThreshold == 0;
    } else this._leeched = false;
  }
  static table = "files";
  static timestamps = true;
  static fields = {
    name: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    _interval: DataTypes.INTEGER,
    repetition: DataTypes.INTEGER,
    _ease_factor: DataTypes.INTEGER,
    dueDate: DataTypes.INTEGER,
    // graduated: DataTypes.BOOLEAN,
    // suspended: DataTypes.BOOLEAN,
    status: DataTypes.TEXT,
    steps: DataTypes.INTEGER,
    _lapses: DataTypes.INTEGER,
    _leeched: DataTypes.BOOLEAN,
  };
  static defaults = {
    interval: 1,
    repetition: 0,
    ease_factor: NEW_FILES.STARTING_EASE,
    dueDate: new Date().getTime(),
    // graduated: false,
    suspended: false,
    status: Status.LEARNING,
    steps: 0,
    lapses: 0,
    leeched: true,
  };
  /// True when lapses is at threshold, or every half threshold after that.
  /// Non-even thresholds round up the half threshold.
  private leech_threshold_met() {
    if (LAPSES.LEECH_THRESHOLD > 0) {
      const halfThreshold = Math.max(
        Math.ceil(LAPSES.LEECH_THRESHOLD / 2.0),
        1.0,
      );
      // at threshold, and every half threshold after that, rounding up
      return this.lapses >= LAPSES.LEECH_THRESHOLD &&
        (this.lapses - LAPSES.LEECH_THRESHOLD) % halfThreshold == 0;
    } else return false;
  }
  practice(answer: Answer) {
    const now = new Date(this.dueDate);
    const _ = "_";
    // Interval Modifier
    // An extra multiplier that is applied to all reviews.
    // At its default of 100% it does nothing.
    // If you set it to 80%, though, for example,
    // intervals will be generated at 80% of their normal size
    // (so a 10 day interval would become 8 days).
    // You can thus use the multiplier to make Anki present cards more or less frequently than it would otherwise,
    // trading study time for retention or vice versa.
    //
    // Learning Steps
    // Controls the number of learning repetitions, and the delay between them.
    // One or more delays, separated by spaces must be entered.
    // Each time you press Good during review, the card moves to the next step.
    //
    // For example, let's say that your learning steps are 1m 10m 1d.
    //
    // When you press Again, the card goes back to first step,
    // and will be shown again approximately 1 minute later.
    // When you press Good on a new card, or a card answered Again,
    // it will move to the next step, and be shown again in approximately 10 minutes.
    // When you press Good on a card after the 10 minute step,
    // it will be delayed until the next day. When you press Good on the card the next day,
    // it will leave learning (it will graduate), and become a review card.
    // It will be shown again after the delay configured by the graduating interval.

    switch (answer + _ + this.status) {
      case Answer.AGAIN + _ + Status.LEARNING:
        this.lapses++;
        // Again
        // The card is placed into relearning mode, the ease_factor is decreased by 20 percentage points
        // (that is, 20 is subtracted from the ease_factor value, which is in units of percentage points),
        // and the current interval is multiplied by the value of new interval
        // (this interval will be used when the card exits relearning mode).
        //
        // Minimum Interval
        // Specifies a minimum number of days a card should wait after it finishes relearning.
        // The default is one day, meaning once relearning is finished, it will be shown again the next day.
        //
        // New Interval
        // The multiplier used when you use the Again button on a review card.
        // The default 0% means that a review card's delay is reset to zero when you forget it
        // (which then becomes 1 day after the minimum interval is applied).
        // If changed from the default, it is possible for forgotten cards to preserve part of their previous delay.
        // For example, if a card had a 100 day interval, and you set the New Interval to 20%, the new interval would be 20 days.
        this.steps = 0;
        this.dueDate = now.setMinutes(
          now.getMinutes() + NEW_FILES.STEPS[this.steps++],
        );
        this.ease_factor += EASE_FACTOR_AGAIN_DELTA;
        if (this.ease_factor < 1.3) this.ease_factor = MINIMUM_EASE_FACTOR;
        break;
      case Answer.AGAIN + _ + Status.REVIEWING:
        this.lapses++;
        this.interval = Math.max(
          LAPSES.MINIMUM_INTERVAL,
          LAPSES.NEW_INTERVAL * this.interval,
          1,
        );
        this.ease_factor = this.ease_factor + EASE_FACTOR_AGAIN_DELTA;
        this.dueDate = now.setDate(now.getDate() + (this.interval as number));
        this.repetition = 0;
        break;
      case Answer.HARD + _ + Status.LEARNING:
        // Hard
        // The card’s ease_factor is decreased by 15 percentage points and the current interval is multiplied by 1.2.
        //
        // Hard Interval
        // The multiplier used when you use the Hard button.
        // The percentage is relative to the previous interval with a default of 120%,
        // a card with a 10-day interval will be given 12 days.
        //
        // this.ease_factor * (1 - 0.15)
        this.dueDate = now.setMinutes(
          now.getMinutes() + NEW_FILES.STEPS[this.steps],
        );
        break;
      case Answer.HARD + _ + Status.REVIEWING:
        this.interval = this.interval *
          OLD_FILES.HARD_INTERVAL;
        this.dueDate = now.setDate(now.getDate() + (this.interval as number));
        this.ease_factor += EASE_FACTOR_HARD_DELTA;
        break;
      case Answer.GOOD + _ + Status.LEARNING:
        // Good
        // The current interval is multiplied by the current ease_factor. The ease_factor is unchanged.
        if (this.steps < NEW_FILES.STEPS.length) {
          this.dueDate = now.setMinutes(
            now.getMinutes() + NEW_FILES.STEPS[this.steps++],
          );
          // this.steps++;
        } else {
          this.status = Status.REVIEWING;
          this.interval = NEW_FILES.GRADUATING_INTERVAL;
          this.dueDate = now.setDate(
            now.getDate() + (this.interval as number),
          );
          this.steps = 0;
        }
        break;
      case Answer.GOOD + _ + Status.REVIEWING:
        this.interval = this.interval * this.ease_factor;
        this.dueDate = now.setDate(now.getDate() + (this.interval as number));
        break;
        // Easy
      // The current interval is multiplied by the current ease_factor times the easy bonus
      // and the ease_factor is increased by 15 percentage points.
      //
      // Easy Bonus
      // An extra multiplier applied to the interval when a review card is answered Easy.
      // With the default value of 130%, Easy will give an interval that is 1.3 times the Good interval.
      // this.interval = NEW_FILES.GRADUATING_INTERVAL;
      // this.status = Status.REVIEWING;
      // this.dueDate = now.setDate(now.getDate() + (this.interval as number));
      // break;
      case Answer.EASY + _ + Status.LEARNING:
      case Answer.EASY + _ + Status.REVIEWING:
        if (this.interval <= 1) {
          this.interval = NEW_FILES.EASY_INTERVAL;
        } else {
          // this.interval*=OLD_FILES.EASY_BONUS;
          this.interval = this.interval * this.ease_factor * REDUCED_BONUS;
          // this.interval*=OLD_FILES.EASY_BONUS;
          this.ease_factor += EASE_FACTOR_EASY_DELTA;
        }
        this.dueDate = now.setDate(now.getDate() + (this.interval as number));
        break;
    }
    // this.repetition = this.repetition + 1;
    // this.ease_factor = this.ease_factor +
    //   (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

    // There are a few limitations on the scheduling values that cards can take. Eases will never be decreased below 130%;
    // SuperMemo’s research has shown that eases below 130% tend to result in cards becoming due more often than is useful and annoying users.
    // Intervals will never be increased beyond the value of maximum interval.
    // Finally, all new intervals (except Again) will always be at least one day longer than the previous interval.

    console.log("\n", new Date(this.dueDate).toLocaleString());
    // this.dueDate = now.setDate(now.getDate() + (this.interval as number));
    // console.log(this.ease_factor, grade, this.repetition, this.interval);
  }
}

// If the file does not exist, delete its data
// for (const file of await File.all()) {
//   if (!existsSync(join(ROOT_PATH, file.name as string))) file.delete();
// }

export default File;
