import { join, sep } from "https://deno.land/std@0.107.0/path/mod.ts";

const NOANKI_DIRNAME = "#NoAnki";
const AGAIN_DIRNAME = "1.AGAIN";
const HARD_DIRNAME = "2.HARD";
const GOOD_DIRNAME = "3.GOOD";
const EASY_DIRNAME = "4.EASY";
const CONF_FILENAME = "conf.yaml";
const DATA_FILENAME = "data.sqlite";

// Get the root path of NoAnki, no matter which folder you execute the command in
const ROOT_PATH = (() => {
  const dirnames = Deno.cwd().split(sep);
  const index = dirnames.indexOf(NOANKI_DIRNAME);
  if (index !== -1) return dirnames.slice(0, index).join(sep);
  return dirnames.join(sep);
})();

// Generate absolute paths
const NOANKI_PATH = join(ROOT_PATH, NOANKI_DIRNAME);
const GOOD_PATH = join(ROOT_PATH, NOANKI_DIRNAME, GOOD_DIRNAME);
const EASY_PATH = join(ROOT_PATH, NOANKI_DIRNAME, EASY_DIRNAME);
const HARD_PATH = join(ROOT_PATH, NOANKI_DIRNAME, HARD_DIRNAME);
const AGAIN_PATH = join(ROOT_PATH, NOANKI_DIRNAME, AGAIN_DIRNAME);
const CONF_PATH = join(ROOT_PATH, NOANKI_DIRNAME, CONF_FILENAME);
const DATA_PATH = join(ROOT_PATH, NOANKI_DIRNAME, DATA_FILENAME);

export default {
  AGAIN_DIRNAME,
  AGAIN_PATH,
  CONF_FILENAME,
  CONF_PATH,
  DATA_FILENAME,
  DATA_PATH,
  EASY_DIRNAME,
  EASY_PATH,
  GOOD_DIRNAME,
  GOOD_PATH,
  HARD_DIRNAME,
  HARD_PATH,
  NOANKI_DIRNAME,
  NOANKI_PATH,
  ROOT_PATH,
};

export {
  AGAIN_DIRNAME,
  AGAIN_PATH,
  CONF_FILENAME,
  CONF_PATH,
  DATA_FILENAME,
  DATA_PATH,
  EASY_DIRNAME,
  EASY_PATH,
  GOOD_DIRNAME,
  GOOD_PATH,
  HARD_DIRNAME,
  HARD_PATH,
  NOANKI_DIRNAME,
  NOANKI_PATH,
  ROOT_PATH,
};
