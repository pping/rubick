import path from "path";
import fs from "fs";
import getLocalDataFile from "./getLocalDataFile";
import { PluginHandler } from "@/core";
import { PLUGIN_INSTALL_DIR as baseDir } from "@/common/constans/main";
import { API } from "@/main/common/api";

const configPath = path.join(getLocalDataFile(), "./rubick-local-plugin.json");

let registry;
let pluginInstance;
(async () => {
  try {
    registry = (await API.dbGet({ data: { id: "rubick-localhost-config" } }))
      .data.register;
    console.log(registry);
    pluginInstance = new PluginHandler({
      baseDir,
      registry,
    });
  } catch (e) {
    pluginInstance = new PluginHandler({
      baseDir,
      registry,
    });
  }
})();

global.LOCAL_PLUGINS = {
  PLUGINS: [],
  async downloadPlugin(plugin) {
    const testPluginInfo = {
      name: "rubick-ui-plugin-demo",
      pluginName: "插件demo",
      description: "rubick ui 插件demo",
      author: "muwoo",
      main: "index.html",
      logo: "https://static.91jkys.com/attachment/kaer-admin/476bbe78674441bc8c904f6b14e450c8ba71d16f9ffe3e04b75bbd5760c8a738.png",
      version: "0.0.1",
      preload: "preload.js",
      homePage:
        "https://gitee.com/rubick-center/rubick-ui-plugin-demo/raw/master/README.md",
      pluginType: "ui",
      features: [
        {
          code: "index",
          explain: "测试插件",
          cmds: ["demo", "测试"],
        },
      ],
    };
    const testZipSrc =
      "http://47.114.175.150/file/rubick-ui-plugin-demo.tar.gz";
    await pluginInstance.installPluginFromOss(testZipSrc, testPluginInfo.name);

    // await pluginInstance.install([plugin.name], { isDev: plugin.isDev });
    if (plugin.isDev) {
      // 获取 dev 插件信息
      const pluginPath = path.resolve(
        baseDir,
        "node_modules",
        plugin.name
      );
      const pluginInfo = JSON.parse(
        fs.readFileSync(path.join(pluginPath, "./package.json"), "utf8")
      );
      plugin = {
        ...plugin,
        ...pluginInfo,
      };
    }
    global.LOCAL_PLUGINS.addPlugin(testPluginInfo);
    return global.LOCAL_PLUGINS.PLUGINS;
  },
  refreshPlugin(plugin) {
    // 获取 dev 插件信息
    const pluginPath = path.resolve(
      baseDir,
      "node_modules",
      plugin.name
    );
    const pluginInfo = JSON.parse(
      fs.readFileSync(path.join(pluginPath, "./package.json"), "utf8")
    );
    plugin = {
      ...plugin,
      ...pluginInfo,
    };
    // 刷新
    let currentPlugins = global.LOCAL_PLUGINS.getLocalPlugins();

    currentPlugins = currentPlugins.map((p) => {
      if (p.name === plugin.name) {
        return plugin;
      }
      return p;
    });

    // 存入
    global.LOCAL_PLUGINS.PLUGINS = currentPlugins;
    fs.writeFileSync(configPath, JSON.stringify(currentPlugins));
    return global.LOCAL_PLUGINS.PLUGINS;
  },
  getLocalPlugins() {
    try {
      if (!global.LOCAL_PLUGINS.PLUGINS.length) {
        global.LOCAL_PLUGINS.PLUGINS = JSON.parse(
          fs.readFileSync(configPath, "utf-8")
        );
      }
      return global.LOCAL_PLUGINS.PLUGINS;
    } catch (e) {
      global.LOCAL_PLUGINS.PLUGINS = [];
      return global.LOCAL_PLUGINS.PLUGINS;
    }
  },
  addPlugin(plugin) {
    let has = false;
    const currentPlugins = global.LOCAL_PLUGINS.getLocalPlugins();
    currentPlugins.some((p) => {
      has = p.name === plugin.name;
      return has;
    });
    if (!has) {
      currentPlugins.unshift(plugin);
      global.LOCAL_PLUGINS.PLUGINS = currentPlugins;
      fs.writeFileSync(configPath, JSON.stringify(currentPlugins));
    }
  },
  updatePlugin(plugin) {
    global.LOCAL_PLUGINS.PLUGINS = global.LOCAL_PLUGINS.PLUGINS.map(
      (origin) => {
        if (origin.name === plugin.name) {
          return plugin;
        }
        return origin;
      }
    );
    fs.writeFileSync(configPath, JSON.stringify(global.LOCAL_PLUGINS.PLUGINS));
  },
  async deletePlugin(plugin) {
    await pluginInstance.uninstall([plugin.name], { isDev: plugin.isDev });
    global.LOCAL_PLUGINS.PLUGINS = global.LOCAL_PLUGINS.PLUGINS.filter(
      (p) => plugin.name !== p.name
    );
    fs.writeFileSync(configPath, JSON.stringify(global.LOCAL_PLUGINS.PLUGINS));
    return global.LOCAL_PLUGINS.PLUGINS;
  },
};
