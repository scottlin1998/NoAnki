// deno-lint-ignore-file camelcase
import { DataTypes, Model } from "https://deno.land/x/denodb/mod.ts";
import Answer from "./Answer.ts";
import { GENERAL, NEW_FILES } from "./utils/config.ts";

const DEFAULT_MINUTES_IF_MISSING = 1;

class Learning extends Model {
  static table = "learnings";

  current_step = 0;
  due_date = (() => {
    const now = new Date();
    return now.setMinutes(now.getMinutes() + NEW_FILES.STEPS[0]);
  })();

  static fields = {
    name: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    current_step: DataTypes.INTEGER,
    due_date: DataTypes.INTEGER,
  };

  next_states(answer: Answer) {
    switch (answer) {
      case Answer.AGAIN:
        this.answer_again();
        break;
      case Answer.HARD:
        this.answer_hard();
        break;
      case Answer.GOOD:
        this.answer_good();
        break;
      case Answer.EASY:
        this.answer_easy();
        break;
    }
  }

  private answer_again() {
    const delayed_seconds = this.with_learning_fuzz(
      NEW_FILES.STEPS[0] || DEFAULT_MINUTES_IF_MISSING,
    );
    const now = new Date();
    this.due_date = now.setMinutes(
      now.getMinutes() + delayed_seconds,
    );
  }

  private answer_hard() {
    const current = NEW_FILES.STEPS[this.current_step];
    let next = NEW_FILES.STEPS.length > 1
      ? NEW_FILES.STEPS[this.current_step + 1] || DEFAULT_MINUTES_IF_MISSING
      : current * 2;
    next = Math.max(next, current);
    const delayed_seconds = GENERAL.FUZZ_FACTOR
      ? this.with_learning_fuzz((current + next) / 2)
      : (current + next) / 2;
    const now = new Date();
    this.due_date = now.setMinutes(
      now.getMinutes() + delayed_seconds,
    );
  }

  private answer_good() {
    if (this.current_step < NEW_FILES.STEPS.length) {
      const delayed_seconds = GENERAL.FUZZ_FACTOR
        ? this.with_learning_fuzz(NEW_FILES.STEPS[this.current_step])
        : NEW_FILES.STEPS[this.current_step];
      const now = new Date();
      this.due_date = now.setMinutes(now.getMinutes() + delayed_seconds);
      this.current_step++;
    }

    if (this.current_step >= NEW_FILES.STEPS.length) {
      const now = new Date();
      this.due_date = now.setDate(
        now.getDate() + NEW_FILES.GRADUATING_INTERVAL,
      );
    }
  }

  private answer_easy() {
    const now = new Date();
    this.due_date = now.setDate(now.getDate() + NEW_FILES.EASY_INTERVAL);
  }

  private with_learning_fuzz(minutes: number) {
    const upper_exclusive = minutes + Math.round(Math.min(minutes * 0.25, 5));
    return minutes >= upper_exclusive
      ? minutes
      : Math.floor(minutes + Math.random() * (upper_exclusive - minutes));
  }
}

export default Learning;
