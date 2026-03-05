import { env } from "./env";
import { app } from "./app";

try{
app.listen(
  {
    port: env.PORT,
    host: "0.0.0.0",
  },
  () => console.log(`Server is running on http://localhost:${env.PORT}`)
);
} catch (error) {
  console.error("Error starting the server:", error);
  process.exit(1);
}
