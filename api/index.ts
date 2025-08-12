import app from "../server/index";

export default app;

export const config = {
  runtime: "nodejs20.x",
  includeFiles: ["dist/server/public/**"],
};

