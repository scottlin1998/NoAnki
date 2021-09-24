import { WatcherEvents } from "../Watcher.ts";

export default function (
  event: WatcherEvents,
  path: string,
) {
  switch (event) {
    case "initial":
      break;
    case "create":
      break;
    case "remove":
      break;
  }
}
