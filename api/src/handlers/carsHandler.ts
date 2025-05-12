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
      // Single car by ID
      if (avsid) {
        const { resource } = await container.item(avsid, avsid).read();
        return resource ? { status: 200, jsonBody: resource } : { status: 404, body: "Not found" };
      }

      // Fetch all cars
      const { resources: allCars } = await container.items.readAll().fetchAll();

      // Parse query parameters
      const brandArr        = request.query.getAll("brand");
      const modelArr        = request.query.getAll("model");
      const variantArr      = request.query.getAll("variant");
      const fuelArr         = request.query.getAll("fuel");
      const bodyArr         = request.query.getAll("body");
      const transmissionArr = request.query.getAll("transmission");
      const doorsArr        = request.query.getAll("doors").map(v => Number(v));
      const seatsArr        = request.query.getAll("seats").map(v => Number(v));
      const searchText      = request.query.get("search")?.toLowerCase() || "";
      const priceFrom       = Number(request.query.get("priceFrom")) || 0;
      const priceTo         = Number(request.query.get("priceTo")) || Infinity;
      const yearFrom        = Number(request.query.get("yearFrom")) || -Infinity;
      const yearTo          = Number(request.query.get("yearTo")) || Infinity;
      const kmFrom          = Number(request.query.get("kmFrom")) || 0;
      const kmTo            = Number(request.query.get("kmTo")) || Infinity;
      const pkFrom          = Number(request.query.get("pkFrom")) || 0;
      const pkTo            = Number(request.query.get("pkTo")) || Infinity;

      // In-memory filtering
      const filtered = allCars.filter(c => {
        const ov = c.car_overview;
        // Numeric ranges
        if (ov.price < priceFrom || ov.price > priceTo) return false;
        if (ov.year < yearFrom || ov.year > yearTo) return false;
        if (ov.mileage < kmFrom || ov.mileage > kmTo) return false;
        if (ov.pk < pkFrom || ov.pk > pkTo) return false;

        // Brand
        if (brandArr.length && !brandArr.includes(ov.brand)) return false;
        // Model hierarchical: only if brand selected
        if (brandArr.length && modelArr.length && !modelArr.includes(ov.model)) return false;
        // Variant hierarchical: only if model selected
        if (modelArr.length && variantArr.length && !variantArr.includes(ov.variant)) return false;

        // Other facets
        if (fuelArr.length && !fuelArr.includes(ov.fuel)) return false;
        if (bodyArr.length && !bodyArr.includes(ov.carrosserie)) return false;
        if (transmissionArr.length && !transmissionArr.includes(ov.transmission)) return false;
        if (doorsArr.length && !doorsArr.includes(ov.doors)) return false;
        if (seatsArr.length && !seatsArr.includes(ov.seats)) return false;

        // Search text
        if (searchText) {
          const haystack = [ov.brand, ov.model, ov.description].join(" ").toLowerCase();
          if (!haystack.includes(searchText)) return false;
        }

        return true;
      });

      return { status: 200, jsonBody: filtered };
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
  } catch (err: unknown) {
    context.error("/cars error", err);
    const message = err instanceof Error ? err.message : String(err);
    return { status: 500, body: `Interne fout: ${message}` };
  }
}
