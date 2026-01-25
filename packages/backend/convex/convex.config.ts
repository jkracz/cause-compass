import { defineApp } from "convex/server";
import migrations from "@convex-dev/migrations/convex.config.js";
import workflow from "@convex-dev/workflow/convex.config";

const app = defineApp();
app.use(migrations);
app.use(workflow);

export default app;
