import { default as express } from "express";
import { default as hbs } from "hbs";
import * as path from "path";
// import * as favicon from 'serve-favicon';
import { default as logger } from "morgan";
import { default as cookieParser } from "cookie-parser";
import * as http from "http";
import { default as rfs } from "rotating-file-stream";
import capcon from "capture-console";

import {
  normalizePort,
  onError,
  onListening,
  handle404,
  basicErrorHandler,
  datedFileNameGenerator,
} from "./appsupport.mjs";
import { router as indexRouter } from "./routes/index.mjs";
import { router as notesRouter } from "./routes/notes.mjs";
import { approotdir } from "./approotdir.mjs";
import { InMemoryNotesStore } from "./models/notes-memory.mjs";

const __dirname = approotdir;

capcon.startCapture(process.stderr, async (stderr) => {
  const stream = rfs.createStream(
    (time, index) => {
      return datedFileNameGenerator(time, index, "errors.txt");
    },
    {
      size: "10M",
      interval: "1d",
      compress: "gzip",
    }
  );

  stream.write(new Date() + " - " + stderr);
});

export const NotesStore = new InMemoryNotesStore();

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "partials"));

app.use(
  logger(process.env.REQUEST_LOG_FORMAT || "dev", {
    stream: process.env.REQUEST_LOG_FILE
      ? rfs.createStream(
          (time, index) => {
            return datedFileNameGenerator(
              time,
              index,
              process.env.REQUEST_LOG_FILE
            );
          },
          {
            size: "10M",
            interval: "1d",
            compress: "gzip",
          }
        )
      : process.stdout,
  })
);
if (process.env.REQUEST_LOG_FILE) {
  app.use(logger(process.env.REQUEST_LOG_FORMAT || "dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/notes", notesRouter);

app.use(handle404);
app.use(basicErrorHandler);

const port = normalizePort(process.env.PORT || "3000");

app.set("port", port);

export const server = http.createServer(app);

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

capcon.stopCapture(process.stderr);