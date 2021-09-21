import {
  ensureDirSync,
  existsSync,
} from "https://deno.land/std@0.107.0/fs/mod.ts";
import db from "./database.ts";
import Learning from "./Learning.ts";
import Review from "./Review.ts";

import {
  AGAIN_PATH,
  CONF_FILENAME,
  DATA_FILENAME,
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

db.link([Learning, Review]);
db.sync();
async function processFile(filename: string) {
  // 正在复习中的文件
  const review = await Review.where("name", filename).first() as Review;
  if (review) {
    console.log(review, "复习中");
  }
  // 正在学习中的文件
  const learning = await Learning.where("name", filename).first() as Review;
  if (learning) {
    console.log(learning, "学习中");
  } // 先添加的文件
  else {
    const learning = new Learning();
    learning.name = filename;
    learning.save();
    console.log(learning, "新建文件");
  }
}

const presentFiles = new Set();
const files = Deno.readDir(ROOT_PATH);
for await (const file of files) {
  if (
    file.isFile && file.name !== DATA_FILENAME && file.name !== CONF_FILENAME
  ) {
    processFile(file.name);
    presentFiles.add(file.name);
  }
}

const watcher = Deno.watchFs(ROOT_PATH);
for await (const event of watcher) {
  for (const path of event.paths) {
    try {
      switch (event.kind) {
        case "create":
          processFile(path);
          presentFiles.add(path);
          console.log(event, "create");
          break;
        case "modify":
          if (!existsSync(path)) {
            presentFiles.delete(path);
          } // ***** Rename Handler goes here *****
          else if (!presentFiles.has(path)) {
            presentFiles.add(path);
            console.log(event, "rename");
          } // ***** Modify Handler goes here *****
          else {
          }
          break;
        case "remove":
          Review.where({ name: path }).delete();
          Learning.where({ name: path }).delete();
          console.log(event, "remove");
          break;
      }
    } catch {}
  }
}
