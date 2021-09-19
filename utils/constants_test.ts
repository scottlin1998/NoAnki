// deno run --allow-read --allow-write --unstable utils/constants_test.ts

import constants from "./constants.ts";
import { ensureDirSync } from "https://deno.land/std@0.107.0/fs/mod.ts";

ensureDirSync(constants.NOANKI_PATH);
ensureDirSync(constants.AGAIN_PATH);
ensureDirSync(constants.HARD_PATH);
ensureDirSync(constants.GOOD_PATH);
ensureDirSync(constants.EASY_PATH);

// Change the current directory to any subpath of NoAnki and execute NoAnki, you will always get the root path of NoAnki
console.table({
  RootPath: constants.ROOT_PATH,
  ExecPath: Deno.cwd(),
});
