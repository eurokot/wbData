import log4js from "log4js";

log4js.configure({
  appenders: { console: { type: "console" } },
  categories: { default: { appenders: ["console"], level: "info" } },
});

export default function getLogger(category: string) {
  return log4js.getLogger(category);
}
