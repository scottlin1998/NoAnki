import Learning from "../Learning.ts";
import Reviewing from "../Reviewing.ts";
import { WatcherEvents } from "../Watcher.ts";
const reviewingPaths: string[] = [];
const learningPaths: string[] = [];

function main(){
  // 从数据库中加载需要学习的内容
  console.log(85245);
}
async function fileHandler (
  event: WatcherEvents,
  path: string,
) {
  switch (event) {
    case "initial":
    case "create":
      {
        const review = await Reviewing.where("name", path).first() as Reviewing;
        if (
          review &&
          !reviewingPaths.some((reviewingPath) => reviewingPath === path)
        ) {
          reviewingPaths.push(path);
          break;
        }
        const learning = await Learning.where("name", path).first() as Learning;
        if (
          learning &&
          !learningPaths.some((learningPath) => learningPath === path)
        ) {
          reviewingPaths.push(path);
          break;
        }
      }
      break;
    case "remove":
      {
        if (reviewingPaths.some((reviewingPath) => reviewingPath === path)) {
          const index = reviewingPaths.indexOf(path);
          reviewingPaths.splice(index, 1);
        } else if (
          learningPaths.some((learningPath) => learningPath === path)
        ) {
          const index = learningPaths.indexOf(path);
          learningPaths.splice(index, 1);
        }

        // 如果数量较少则补充
      }
      break;
  }
}

export{
  main,
  fileHandler
}