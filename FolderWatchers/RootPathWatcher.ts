import db from "../database.ts";
import Learning from "../Learning.ts";
import Reviewing from "../Reviewing.ts";
import { WatcherEvents } from "../Watcher.ts";

db.link([Learning, Reviewing]);
db.sync();

// 删除所有不存在文件的数据

// 过滤文件夹
export default async function (
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
