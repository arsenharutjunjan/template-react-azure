import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import { parseMulti } from "../utils/parseMulti";
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

      // Parse filter parameters
      const brand        = parseMulti(request.query.getAll("brand"));
      const model        = parseMulti(request.query.getAll("model"));
      const variant      = parseMulti(request.query.getAll("variant"));
      const fuel         = parseMulti(request.query.getAll("fuel"));
      const body         = parseMulti(request.query.getAll("body"));
      const transmission = parseMulti(request.query.getAll("transmission"));
      const doors        = parseMulti(request.query.getAll("doors"));
      const seats        = parseMulti(request.query.getAll("seats"));
      const searchText   = request.query.get("search") || "";
      const priceFrom    = Number(request.query.get("priceFrom")) || 0;
      const priceTo      = Number(request.query.get("priceTo")) || 1_000_000;
      const yearFrom     = Number(request.query.get("yearFrom")) || 1900;
      const yearTo       = Number(request.query.get("yearTo")) || 2100;
      const kmFrom       = Number(request.query.get("kmFrom")) || 0;
      const kmTo         = Number(request.query.get("kmTo")) || 999_999;
      const pkFrom       = Number(request.query.get("pkFrom")) || 0;
      const pkTo         = Number(request.query.get("pkTo")) || 2000;

      // Base numeric filters
      const filters: string[] = [
        "c.car_overview.price BETWEEN @priceFrom AND @priceTo",
        "c.car_overview.year BETWEEN @yearFrom AND @yearTo",
        "c.car_overview.mileage BETWEEN @kmFrom AND @kmTo",
        "c.car_overview.pk BETWEEN @pkFrom AND @pkTo",
      ];
      const params: { name: string; value: string | number }[] = [
        { name: "@priceFrom", value: priceFrom },
        { name: "@priceTo",   value: priceTo },
        { name: "@yearFrom",  value: yearFrom },
        { name: "@yearTo",    value: yearTo },
        { name: "@kmFrom",    value: kmFrom },
        { name: "@kmTo",      value: kmTo },
        { name: "@pkFrom",    value: pkFrom },
        { name: "@pkTo",      value: pkTo },
      ];

      // Helper to map array filters: 0 => skip, 1 => equals, >1 => IN clause
      const mapArrayFilter = (arr: string[], field: string) => {
        if (arr.length === 1) {
          filters.push(`c.car_overview.${field} = @${field}0`);
          params.push({ name: `@${field}0`, value: arr[0] });
        } else if (arr.length > 1) {
          const placeholders = arr.map((_, i) => `@${field}${i}`).join(", ");
          filters.push(`c.car_overview.${field} IN (${placeholders})`);
          arr.forEach((val, i) => params.push({ name: `@${field}${i}`, value: val }));
        }
      };

      // Hierarchical filters: model only if brand selected, variant only if model selected
      if (brand.length) {
        mapArrayFilter(brand, "brand");
        if (model.length) {
          mapArrayFilter(model, "model");
          if (variant.length) {
            mapArrayFilter(variant, "variant");
          }
        }
      }

      // Other facets (independent)
      mapArrayFilter(fuel, "fuel");
      mapArrayFilter(body, "body");
      mapArrayFilter(transmission, "transmission");
      mapArrayFilter(doors, "doors");
      mapArrayFilter(seats, "seats");

      // Search text filter
      if (searchText) {
        filters.push(
          `(CONTAINS(LOWER(c.car_overview.brand), @search) OR ` +
          `CONTAINS(LOWER(c.car_overview.model), @search) OR ` +
          `CONTAINS(LOWER(c.car_overview.description), @search))`
        );
        params.push({ name: "@search", value: searchText.toLowerCase() });
      }

      // Build query
      const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
      const querySpec = { query: `SELECT * FROM c ${whereClause}`, parameters: params };
      const { resources } = await container.items.query(querySpec).fetchAll();
      return { status: 200, jsonBody: resources };
    }

    if (request.method === "POST") {
      const bodyReq = await request.json() as CarPayload;
      if (!bodyReq?.avsid) return { status: 400, body: "Invalid payload, 'avsid' required." };
      bodyReq.id = bodyReq.avsid;
      const { resource } = await container.items.create(bodyReq);
      return { status: 201, jsonBody: resource };
    }

    if (request.method === "PUT") {
      const bodyReq = await request.json() as CarPayload;
      if (!bodyReq?.avsid) return { status: 400, body: "Invalid payload, 'avsid' required." };
      bodyReq.id = bodyReq.avsid;
      const { resource } = await container.item(bodyReq.avsid, bodyReq.avsid).replace(bodyReq);
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
