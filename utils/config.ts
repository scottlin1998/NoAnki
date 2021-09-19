import {
  parse,
  stringify,
} from "https://deno.land/std@0.63.0/encoding/yaml.ts";
import { ensureFileSync } from "https://deno.land/std@0.107.0/fs/ensure_file.ts";
import { CONF_PATH } from "./constants.ts";

type Config = {
  GENERAL: {
    REVOCATION_TIMEOUT: number;
    MAXIMUM_DISPLAYS: number;
    DISPLAY_IN_BATCHES: boolean;
  };
  NEW_FILES: {
    ORDER: NewFilesOrder;
    MAXIMUM_PER_DAY: number;
    GRADUATING_INTERVAL: number;
    EASY_INTERVAL: number;
    STARTING_EASE: number;
    POSITION: NewFilesPosition;
    STEPS: number[];
  };
  OLD_FILES: {
    MAXIMUM_PER_DAY: number;
    EASY_BONUS: number;
    HARD_INTERVAL: number;
    INTERVAL_MODIFIER: number;
    MAXIMUM_INTERVAL: number;
  };
  LAPSES: {
    STEPS: number[];
    NEW_INTERVAL: number;
    MINIMUM_INTERVAL: number;
    LEECH_THRESHOLD: number;
    LEECH_ACTION: LapsesLeechAction;
  };
};

enum NewFilesOrder {
  Random = "RANDOM",
  Sequential = "SEQUENTIAL",
}
enum NewFilesPosition {
  Mixed = "MIXED",
  After = "AFTER",
  Before = "BEFORE",
}
enum LapsesLeechAction {
  Suspend = "SUSPEND",
  Continue = "CONTINUE",
}

const $default: Config = {
  GENERAL: {
    REVOCATION_TIMEOUT: 60,
    MAXIMUM_DISPLAYS: 5,
    DISPLAY_IN_BATCHES: true,
  },
  NEW_FILES: {
    ORDER: NewFilesOrder.Sequential,
    MAXIMUM_PER_DAY: 20,
    GRADUATING_INTERVAL: 1,
    EASY_INTERVAL: 4,
    STARTING_EASE: 2.5,
    POSITION: NewFilesPosition.Mixed,
    STEPS: [1, 10],
  },
  OLD_FILES: {
    MAXIMUM_PER_DAY: 200,
    EASY_BONUS: 1.3,
    HARD_INTERVAL: 1.2,
    INTERVAL_MODIFIER: 1.0,
    MAXIMUM_INTERVAL: 36500,
  },
  LAPSES: {
    STEPS: [10],
    NEW_INTERVAL: 0,
    MINIMUM_INTERVAL: 1,
    LEECH_THRESHOLD: 8,
    LEECH_ACTION: LapsesLeechAction.Suspend,
  },
};

const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();

ensureFileSync(CONF_PATH);
const parsedObj = parse(decoder.decode(Deno.readFileSync(CONF_PATH)));
const config = !(parsedObj instanceof Array) && (parsedObj instanceof Object)
  ? Object.assign($default, parsedObj) as Config
  : $default;
const { GENERAL, NEW_FILES, OLD_FILES, LAPSES } = config;

// Will add a value type checker and handler here in future

// Overwrite the config file
Deno.writeFileSync(CONF_PATH, encoder.encode(stringify(config)));

export default config;
export { GENERAL, LAPSES, NEW_FILES, OLD_FILES };
