const path = require("path");

/** @type {import("next-i18next").UserConfig} */
const config = {
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  reloadOnPrerender: process.env.NODE_ENV !== "production",
  localePath: path.resolve("./public/static/locales"),
};

module.exports = config;
