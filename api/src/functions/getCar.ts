import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function getCar(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const name = request.query.get("name") || "World";
  return { status: 200, body: `Hello, ${name}!` };
}

app.http("getCar", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getCar
});
