import { env } from "./env";
import { app } from "./index";

app.listen(
  {
    port: env.PORT,
  },
  () => console.log(`Server is running on http://localhost:${env.PORT}`),
);
