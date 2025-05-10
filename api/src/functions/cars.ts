import { app } from "@azure/functions";
import { carsHandler } from "../handlers/carsHandler";

app.http("cars", {
  methods: ["GET", "POST", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "cars/{avsid?}",
  handler: carsHandler,
});
