import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { CarPayload } from "../types/CarPayload";

const endpoint = process.env.COSMOSDB_ENDPOINT!;
const key = process.env.COSMOSDB_KEY!;
const client = new CosmosClient({ endpoint, key });
const container = client.database("avs-db").container("avs-container");

export async function carsHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const avsid = request.params?.avsid;

    if (request.method === "GET") {
      if (avsid) {
        const { resource } = await container.item(avsid, avsid).read();
        return resource ? { status: 200, jsonBody: resource } : { status: 404, body: "Not found" };
      }

      // No filters: fetch all cars
      const { resources } = await container.items.readAll().fetchAll();
      return { status: 200, jsonBody: resources };
    }

    if (request.method === "POST") {
      const body = await request.json() as CarPayload;
      if (!body?.avsid) return { status: 400, body: "Invalid payload, 'avsid' required." };
      body.id = body.avsid;
      const { resource } = await container.items.create(body);
      return { status: 201, jsonBody: resource };
    }

    if (request.method === "PUT") {
      const body = await request.json() as CarPayload;
      if (!body?.avsid) return { status: 400, body: "Invalid payload, 'avsid' required." };
      body.id = body.avsid;
      const { resource } = await container.item(body.avsid, body.avsid).replace(body);
      return { status: 200, jsonBody: resource };
    }

    if (request.method === "DELETE") {
      const id = request.query.get("id");
      if (!id) return { status: 400, body: "ID vereist" };
      await container.item(id, id).delete();
      return { status: 204 };
    }

    return { status: 405, body: "Method not allowed" };
  } catch (err) {
    context.error("/cars error", err);
    return { status: 500, body: `Interne fout: ${err.message}` };
  }
}