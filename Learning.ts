import { Model } from "https://deno.land/x/denodb/mod.ts";
import { NEW_FILES } from "./utils/config.ts";
const FUZZ_FACTOR = true;
const DEFAULT_MINUTES_IF_MISSING = 1;
enum Answer {
  AGAIN,
  HARD,
  GOOD,
  EASY,
}
export enum Status {
  LEARNING = "LEARNING",
  REVIEWING = "REVIEWING",
  RELEARNING = "RELEARNING",
  // SUSPENDED = "SUSPENDED",
}
class Learning {
  current_step = 0;
  due_date = (() => {
    const now = new Date();
    return now.setMinutes(now.getMinutes() + NEW_FILES.STEPS[0]);
  })();
  scheduled_days = 0;
  status = Status.LEARNING;
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
  answer_again() {
    const delayed_seconds = this.with_learning_fuzz(
      NEW_FILES.STEPS[0] || DEFAULT_MINUTES_IF_MISSING,
    );
    const now = new Date();
    this.due_date = now.setMinutes(
      now.getMinutes() + delayed_seconds,
    );
  }

  answer_hard() {
    const current = NEW_FILES.STEPS[this.current_step];
    let next = NEW_FILES.STEPS.length > 1
      ? NEW_FILES.STEPS[this.current_step + 1] || DEFAULT_MINUTES_IF_MISSING
      : current * 2;
    next = Math.max(next, current);
    console.log(next, current);
    const delayed_seconds = FUZZ_FACTOR
      ? this.with_learning_fuzz((current + next) / 2)
      : (current + next) / 2;
    const now = new Date();
    this.due_date = now.setMinutes(
      now.getMinutes() + delayed_seconds,
    );
  }

  answer_good() {
    if (this.current_step < NEW_FILES.STEPS.length) {
      const delayed_seconds = FUZZ_FACTOR
        ? this.with_learning_fuzz(NEW_FILES.STEPS[this.current_step])
        : NEW_FILES.STEPS[this.current_step];
      //   console.log(delayed_seconds);
      const now = new Date();
      this.due_date = now.setMinutes(now.getMinutes() + delayed_seconds);
      this.current_step++;
    }

    if (this.current_step >= NEW_FILES.STEPS.length) {
      this.status = Status.REVIEWING;
      const now = new Date();
      this.due_date = now.setDate(
        now.getDate() + NEW_FILES.GRADUATING_INTERVAL,
      );
      this.scheduled_days = NEW_FILES.GRADUATING_INTERVAL;
      // this.scheduled_days=this.fuzzed_graduating_interval_good(),
    }
  }

  answer_easy() {
    const now = new Date();
    this.due_date = now.setDate(now.getDate() + NEW_FILES.EASY_INTERVAL);
    this.scheduled_days = NEW_FILES.EASY_INTERVAL;
    this.status = Status.REVIEWING;
    // this.scheduled_days=this.fuzzed_graduating_interval_easy(),
  }
  with_learning_fuzz(minutes: number) {
    const upper_exclusive = minutes + Math.round(Math.min(minutes * 0.25, 5));
    return minutes >= upper_exclusive
      ? minutes
      : Math.floor(minutes + Math.random() * (upper_exclusive - minutes));
  }
}

const l = new Learning();
// console.log(l);
l.next_states(Answer.AGAIN);
console.log(
  l,
  new Date(l.due_date).toLocaleDateString(),
  new Date(l.due_date).toLocaleTimeString(),
);
l.next_states(Answer.AGAIN);
console.log(
  l,
  new Date(l.due_date).toLocaleDateString(),
  new Date(l.due_date).toLocaleTimeString(),
);
// l.next_states(Answer.GOOD);
console.log(
  l,
  new Date(l.due_date).toLocaleDateString(),
  new Date(l.due_date).toLocaleTimeString(),
);
export default Learning;
