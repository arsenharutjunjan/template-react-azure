import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export async function todos(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const endpoint = process.env.COSMOSDB_ENDPOINT;
  const key = process.env.COSMOSDB_KEY;

  if (!endpoint || !key) {
    return { status: 500, body: "Missing Cosmos DB config" };
  }

  const client = new CosmosClient({ endpoint, key });
  const container = client.database("avs-db").container("avs-container");

  if (request.method === "GET") {
    const { resources } = await container.items.readAll().fetchAll();
    return { status: 200, jsonBody: resources };
  }

  return { status: 405, body: "Method not allowed" };
}

app.http("todos", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: todos
});
