import { defineApp } from "convex/server";
import migrations from "@convex-dev/migrations/convex.config.js";
import workflow from "@convex-dev/workflow/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";

const app = defineApp();
app.use(migrations);
app.use(workflow);
app.use(aggregate);
app.use(aggregate, { name: "queueStatsAggregate" });

export default app;
