import express, { type Express } from "express";
import fs from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export function serveStatic(app: Express) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const distPath = resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(resolve(distPath, "index.html"));
  });
}
