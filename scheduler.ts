import { existsSync } from "https://deno.land/std@0.107.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.107.0/path/mod.ts";
import {
  Database,
  DataTypes,
  Model,
  SQLite3Connector,
} from "https://deno.land/x/denodb/mod.ts";
import { LAPSES, NEW_FILES, OLD_FILES } from "./utils/config.ts";
import { DATA_PATH, ROOT_PATH } from "./utils/constants.ts";

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
const dbConnector = new SQLite3Connector({
  filepath: DATA_PATH,
});

const db = new Database(dbConnector);
class File extends Model {
  name!: string;
  interval!: number;
  repetition!: number;
  ease!: number;
  dueDate!: number;
  // graduated!: boolean;
  suspended!: boolean;
  status!: Status;
  steps!: number;

  static table = "files";
  static timestamps = true;
  static fields = {
    name: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    interval: DataTypes.INTEGER,
    repetition: DataTypes.INTEGER,
    ease: DataTypes.INTEGER,
    dueDate: DataTypes.INTEGER,
    // graduated: DataTypes.BOOLEAN,
    suspended: DataTypes.BOOLEAN,
    status: DataTypes.TEXT,
    steps: DataTypes.INTEGER,
  };
  static defaults = {
    interval: 0,
    repetition: 0,
    ease: NEW_FILES.STARTING_EASE,
    dueDate: new Date().getTime(),
    // graduated: false,
    suspended: false,
    status: Status.LEARNING,
    steps: 0,
  };

  practice(answer: Answer) {
    const now = new Date();
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
        // Again
        // The card is placed into relearning mode, the ease is decreased by 20 percentage points
        // (that is, 20 is subtracted from the ease value, which is in units of percentage points),
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
        break;
      case Answer.AGAIN + _ + Status.REVIEWING:
        this.interval = LAPSES.MINIMUM_INTERVAL +
          LAPSES.NEW_INTERVAL * this.interval;
        this.dueDate = now.setDate(now.getDate() + (this.interval as number));
        this.repetition = 0;
        break;
      case Answer.HARD + _ + Status.LEARNING:
        // Hard
        // The card’s ease is decreased by 15 percentage points and the current interval is multiplied by 1.2.
        //
        // Hard Interval
        // The multiplier used when you use the Hard button.
        // The percentage is relative to the previous interval with a default of 120%,
        // a card with a 10-day interval will be given 12 days.
        //
        // this.ease * (1 - 0.15)

        break;
      case Answer.HARD + _ + Status.REVIEWING:
        this.interval = this.interval * this.ease *
          OLD_FILES.HARD_INTERVAL * OLD_FILES.INTERVAL_MODIFIER;
        this.dueDate = now.setDate(now.getDate() + (this.interval as number));
        break;
      case Answer.GOOD + _ + Status.LEARNING:
        // Good
        // The current interval is multiplied by the current ease. The ease is unchanged.
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
        this.interval = this.interval * this.ease *
          OLD_FILES.INTERVAL_MODIFIER;
        this.dueDate = now.setDate(now.getDate() + (this.interval as number));
        break;
      case Answer.EASY + _ + Status.LEARNING:
        // Easy
        // The current interval is multiplied by the current ease times the easy bonus
        // and the ease is increased by 15 percentage points.
        //
        // Easy Bonus
        // An extra multiplier applied to the interval when a review card is answered Easy.
        // With the default value of 130%, Easy will give an interval that is 1.3 times the Good interval.
        this.interval = NEW_FILES.GRADUATING_INTERVAL;
        this.dueDate = now.setDate(now.getDate() + (this.interval as number));
        break;
      case Answer.EASY + _ + Status.REVIEWING:
        this.interval = this.interval * this.ease *
          OLD_FILES.INTERVAL_MODIFIER * OLD_FILES.EASY_BONUS;
        this.dueDate = now.setDate(now.getDate() + (this.interval as number));
        break;
    }
    // this.repetition = this.repetition + 1;

    // this.ease = this.ease +
    //   (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    // this.ease *= OLD_FILES.EASY_BONUS;

    // There are a few limitations on the scheduling values that cards can take. Eases will never be decreased below 130%;
    // SuperMemo’s research has shown that eases below 130% tend to result in cards becoming due more often than is useful and annoying users.
    // Intervals will never be increased beyond the value of maximum interval.
    // Finally, all new intervals (except Again) will always be at least one day longer than the previous interval.
    if (this.ease < 1.3) this.ease = 1.3;

    // this.dueDate = now.setDate(now.getDate() + (this.interval as number));
    // console.log(this.ease, grade, this.repetition, this.interval);
  }
}

db.link([File]);
db.sync();

// If the file does not exist, delete its data
for (const file of await File.all()) {
  if (!existsSync(join(ROOT_PATH, file.name as string))) file.delete();
}

export default db;
export { dbConnector, File };
