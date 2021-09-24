import { existsSync } from "https://deno.land/std@0.107.0/fs/mod.ts";
import { resolve } from "https://deno.land/std@0.107.0/path/mod.ts";

type WatcherOptions = {
  recursive: boolean;
} | undefined;

type WatcherEvents = "create" | "remove" | "initial";

class Watcher {
  paths = new Set<string>();
  events = {
    initial: [] as ((path: string) => void)[],
    any: [] as ((event: WatcherEvents, path: string) => void)[],
    create: [] as ((path: string) => void)[],
    // rename: [] as ((path: string) => void)[],
    // modify: [] as ((path: string) => void)[],
    remove: [] as ((path: string) => void)[],
    // access: [] as ((path: string) => void)[],
  };
  constructor(paths: string[], options?: WatcherOptions) {
    // 将所有路径转为绝对路径
    // paths = paths.map((path) => resolve(path));
    // console.log(paths);
    (async () => {
      for (const path of paths) {
        const files = Deno.readDir(path);
        for await (const file of files) {
          const fullpath = resolve(path, file.name);
          if (file.isFile) {
            this.paths.add(fullpath);
            this.events["any"].forEach((callback) =>
              callback("initial", fullpath)
            );
            this.events["initial"].forEach((callback) => callback(fullpath));
          }
        }
      }
      const watcher = Deno.watchFs(paths, options);

      for await (const event of watcher) {
        for (let path of event.paths) {
          path = resolve(path);
          if (!paths.includes(path)) {
            try {
              switch (event.kind) {
                case "create":
                  if (Deno.statSync(path).isFile) {
                    this.paths.add(path);
                    this.events["any"].forEach((callback) =>
                      callback("create", path)
                    );
                    this.events["create"].forEach((callback) => callback(path));
                  }
                  break;
                case "modify":
                  if (this.paths.has(path)) {
                    if (!existsSync(path)) {
                      // 删除
                      this.paths.delete(path);
                      this.events["any"].forEach((callback) =>
                        callback("remove", path)
                      );
                      this.events["remove"].forEach((callback) =>
                        callback(path)
                      );
                    }
                    // else {
                    //   // 修改
                    //   this.events["any"].forEach((callback) =>
                    //     callback("modify", path)
                    //   );
                    //   this.events["modify"].forEach((callback) =>
                    //     callback(path)
                    //   );
                    // }
                  } else if (Deno.statSync(path).isFile) {
                    this.paths.add(path);
                    this.events["any"].forEach((callback) =>
                      callback("create", path)
                    );
                    this.events["create"].forEach((callback) => callback(path));
                  }
                  break;
                case "remove":
                  if (this.paths.has(path)) {
                    this.paths.delete(path);
                    this.events["any"].forEach((callback) =>
                      callback("remove", path)
                    );
                    this.events["remove"].forEach((callback) => callback(path));
                  }
                  break;
              }
            } catch {}
          }
        }
        // { kind: "create", paths: [ "/foo.txt" ] }
      }
    })();
  }
  on(
    eventName: WatcherEvents,
    callback: (path: string) => void,
  ) {
    this.events[eventName].push(callback);
  }
  all(callback: (eventName: WatcherEvents, path: string) => void) {
    this.events["any"].push(callback);
  }
}
export type { WatcherEvents, WatcherOptions };
export default Watcher;
