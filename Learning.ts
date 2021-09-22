import { Model } from "https://deno.land/x/denodb/mod.ts";
import { NEW_FILES } from "./utils/config.ts";

const DEFAULT_SECS_IF_MISSING = 60;
enum Answer {
  AGAIN,
  HARD,
  GOOD,
  EASY,
}
class Learning {
  remaining_steps = NEW_FILES.STEPS.length;
  scheduled_secs = 0;
  scheduled_days = (() => {
    const now = new Date();
    return now.setMinutes(now.getMinutes() + NEW_FILES.STEPS[0]);
  })();
  get remaining_for_failed() {
    return NEW_FILES.STEPS.length;
  }
  remaining_for_good(remaining: number) {
    const idx = this.get_index(remaining);
    console.log(idx,"remaining_for_good");
    return NEW_FILES.STEPS.length - (idx + 1);
  }
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
    this.remaining_steps = NEW_FILES.STEPS.length;
    this.scheduled_secs = this.with_learning_fuzz(
      this.again_delay_secs_learn(),
    );
  }

  answer_hard() {
    const hard_delay = this.hard_delay_secs(this.remaining_steps);
    if (hard_delay) {
      this.scheduled_secs = this.with_learning_fuzz(hard_delay);
    } else {
      //   this.scheduled_days= this.fuzzed_graduating_interval_good(),
    }
  }

  answer_good() {
    const good_delay = this.good_delay_secs(this.remaining_steps);
    if (good_delay) {
      this.remaining_steps = this.remaining_for_good(this.remaining_steps);
      this.scheduled_secs = this.with_learning_fuzz(good_delay);
    } else {
      // this.scheduled_days=this.fuzzed_graduating_interval_good(),
    }
  }

  answer_easy() {
    // this.scheduled_days=this.fuzzed_graduating_interval_easy(),
  }
  with_learning_fuzz(secs: number) {
    const upper_exclusive = secs + Math.round(Math.min(secs * 0.25, 300.0));
    return secs >= upper_exclusive
      ? secs
      : Math.floor(secs + Math.random() * (upper_exclusive - secs));
  }
  again_delay_secs_learn() {
    return this.secs_at_index(0) || DEFAULT_SECS_IF_MISSING;
  }
  secs_at_index(index: number) {
    // console.log(NEW_FILES.STEPS[index], index, "secs_at_index");
    return NEW_FILES.STEPS[index] * 60;
  }
  hard_delay_secs(remaining: number) {
    const idx = this.get_index(remaining);
    console.log(idx,"hard_delay_secs");
    const current = this.secs_at_index(idx) || NEW_FILES.STEPS[0];

    let next = NEW_FILES.STEPS.length > 1
      ? this.secs_at_index(idx + 1) || 60
      : current * 2;

    next = Math.max(next, current);

    return (current + next) / 2;
  }
  get_index(remaining: number) {
    const total = NEW_FILES.STEPS.length;
    const index = total - (remaining % 1000);
    return Math.min(index < 0 ? 0 : index, total - 1 < 0 ? 0 : total - 1);
  }
  //   saturating_sub(value:number){
  //       return value<0?0:value;
  //   }
  good_delay_secs(remaining: number) {
    const idx = this.get_index(remaining);
    console.log(idx,"good_delay_secs");
    // console.log(idx,"good_delay_secs");
    return this.secs_at_index(idx + 1);
  }
}

const l = new Learning();
console.log(l);
l.next_states(Answer.HARD);
console.log(l);
l.next_states(Answer.GOOD);
console.log(l);
l.next_states(Answer.GOOD);
console.log(l.with_learning_fuzz(600));
export default Learning;
