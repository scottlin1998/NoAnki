import { ensureDirSync } from "https://deno.land/std@0.107.0/fs/mod.ts";
import { dirname } from "https://deno.land/std@0.107.0/path/mod.ts";
import {
  fileHandler as RootPathWatcher,
  main as RootPathMain,
} from "./FolderWatchers/RootPathWatcher.ts";
import {
  fileHandler as NoAnkiPathWatcher,
  main as NoAnkiPathMain,
} from "./FolderWatchers/NoAnkiPathWatcher.ts";
import AgainPathWatcher from "./FolderWatchers/AgainPathWatcher.ts";
import EasyPathWatcher from "./FolderWatchers/EasyPathWatcher.ts";
import GoodPathWatcher from "./FolderWatchers/GoodPathWatcher.ts";
import HardPathWatcher from "./FolderWatchers/HardPathWatcher.ts";
import Watcher from "./Watcher.ts";
import {
  AGAIN_PATH,
  EASY_PATH,
  GOOD_PATH,
  HARD_PATH,
  NOANKI_PATH,
  ROOT_PATH,
} from "./utils/constants.ts";

ensureDirSync(NOANKI_PATH);
ensureDirSync(AGAIN_PATH);
ensureDirSync(HARD_PATH);
ensureDirSync(GOOD_PATH);
ensureDirSync(EASY_PATH);

RootPathMain();
NoAnkiPathMain();

const pathToWatch = [
  ROOT_PATH,
  NOANKI_PATH,
  AGAIN_PATH,
  HARD_PATH,
  GOOD_PATH,
  EASY_PATH,
];

const watcher = new Watcher(pathToWatch, { recursive: false });
watcher.all((eventName, path) => {
  switch (dirname(path)) {
    case ROOT_PATH:
      RootPathWatcher(eventName, path);
      break;
    case NOANKI_PATH:
      NoAnkiPathWatcher(eventName, path);
      break;
    case AGAIN_PATH:
      AgainPathWatcher(eventName, path);
      break;
    case HARD_PATH:
      HardPathWatcher(eventName, path);
      break;
    case GOOD_PATH:
      GoodPathWatcher(eventName, path);
      break;
    case EASY_PATH:
      EasyPathWatcher(eventName, path);
      break;
  }
});

// for await (const event of watcher) {
//   for (const path of event.paths) {
//     // Exclude monitored folders
//     if (pathToWatch.includes(path)) break;

//   }
// }
