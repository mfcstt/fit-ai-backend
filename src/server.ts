import { env } from "./env";
import { app } from "./app";

app.listen(
  {
    port: env.PORT,
  },
  () => app.log.info(`Server is running on http://localhost:${env.PORT}`),
);
