import * as util from "util";

import { server, port } from "./app.mjs";
import { NotesStore } from "./models/notes-store.mjs";

export function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

export function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);

      process.exit(1);
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);

      process.exit(1);
    case "ENOTESSTORE":
      console.error(
        `Notes data store initialization failure because `,
        error.error
      );

      process.exit(1);
    default:
      throw error;
  }
}

export function onListening() {
  const addr = server.address();

  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;

  console.log(`Listening on ${bind}`);
}

export function handle404(req, res, next) {
  const err = new Error("Not Found");

  err.status = 404;

  next(err);
}

export function basicErrorHandler(err, req, res, next) {
  // Defer to built-in error handler if headersSent
  // See: http://expressjs.com/en/guide/error-handling.html
  if (res.headersSent) {
    return next(err);
  }
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
}

process.on("uncaughtException", function (err) {
  console.error(`I've crashed!!! - ${err.stack || err}`);
});

process.on("unhandledRejection", (reason, p) => {
  console.error(`Unhandled Rejection at: ${util.inspect(p)} reason:
${reason}`);
});

const pad = (num) => (num > 9 ? "" : "0") + num;

export const datedFileNameGenerator = (time, index, fileName = "file.log") => {
  if (!time) return fileName;

  const month = time.getFullYear() + "" + pad(time.getMonth() + 1);
  const day = pad(time.getDate());
  const hour = pad(time.getHours());
  const minute = pad(time.getMinutes());

  return `${month}/${month}${day}-${hour}${minute}-${index}-${fileName}`;
};

async function catchProcessDeath() {
  // debug("urk...");

  await NotesStore.close();

  await server.close();

  process.exit(0);
}

process.on("SIGTERM", catchProcessDeath);
process.on("SIGINT", catchProcessDeath);
process.on("SIGHUP", catchProcessDeath);
process.on("exit", () => {
  // debug("exiting...");
});
