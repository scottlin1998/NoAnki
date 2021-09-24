import { existsSync } from "https://deno.land/std@0.107.0/fs/mod.ts";
import db from "../database.ts";
import Learning from "../Learning.ts";
import Reviewing from "../Reviewing.ts";
import { WatcherEvents } from "../Watcher.ts";

async function main() {
  db.link([Learning, Reviewing]);
  await db.sync();

  // 删除所有不存在文件的数据
  const reviewings = await Reviewing.all() as Reviewing[];
  for (const reviewing of reviewings) {
    if (!existsSync(reviewing.name as string)) {
      reviewing.delete();
    }
  }
  const learnings = await Learning.all() as Learning[];
  for (const learning of learnings) {
    if (!existsSync(learning.name as string)) {
      learning.delete();
    }
  }
}

// 过滤文件夹
async function fileHandler(
  event: WatcherEvents,
  path: string,
) {
  switch (event) {
    case "initial":
      {
        const review = await Reviewing.where("name", path).first() as Reviewing;
        if (review) break;
        const learning = await Learning.where("name", path).first() as Learning;
        if (learning) break;
        else {
          const learning = new Learning();
          learning.name = path;
          learning.save();
        }
      }
      break;
    case "create":
      {
        const learning = new Learning();
        learning.name = path;
        await learning.save();
      }
      break;
    case "remove":
      {
        await Reviewing.where({ name: path }).delete();
        await Learning.where({ name: path }).delete();
      }
      break;
  }
}

export { fileHandler, main };
