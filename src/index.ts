import { app } from "./app";
import { statsRoutes } from "./routes/stats";

app.register(statsRoutes, { prefix: "/stats" });

export { app };
