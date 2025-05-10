// api/src/functions/cars.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

// ✅ Interface voor type safety
interface CarPayload {
  avsid: string;
  id?: string;
  [key: string]: any;
}

const endpoint = process.env.COSMOSDB_ENDPOINT!;
const key = process.env.COSMOSDB_KEY!;
const client = new CosmosClient({ endpoint, key });
const container = client.database("avs-autos").container("cars");

function parseMulti(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function carsHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const avsid = request.params?.avsid;

    // ✅ GET één auto of lijst met filters
    if (request.method === "GET") {
      if (avsid) {
        const { resource } = await container.item(avsid, avsid).read();
        return resource ? { status: 200, jsonBody: resource } : { status: 404, body: "Not found" };
      }

      const brand        = parseMulti(request.query.getAll("brand"));
      const model        = parseMulti(request.query.getAll("model"));
      const variant      = parseMulti(request.query.getAll("variant"));
      const fuel         = parseMulti(request.query.getAll("fuel"));
      const body         = parseMulti(request.query.getAll("body"));
      const transmission = parseMulti(request.query.getAll("transmission"));
      const doors        = parseMulti(request.query.getAll("doors"));
      const seats        = parseMulti(request.query.getAll("seats"));
      const searchText   = request.query.get("search") || "";
      const sortKey      = request.query.get("sort") || "price";
      const sortOrder    = request.query.get("order") === "desc" ? "DESC" : "ASC";

      const priceFrom  = Number(request.query.get("priceFrom")) || 0;
      const priceTo    = Number(request.query.get("priceTo")) || 1_000_000;
      const yearFrom   = Number(request.query.get("yearFrom")) || 1900;
      const yearTo     = Number(request.query.get("yearTo")) || 2100;
      const kmFrom     = Number(request.query.get("kmFrom")) || 0;
      const kmTo       = Number(request.query.get("kmTo")) || 999_999;
      const pkFrom     = Number(request.query.get("pkFrom")) || 0;
      const pkTo       = Number(request.query.get("pkTo")) || 2000;

      const filters: string[] = [
        "c.car_overview.price BETWEEN @priceFrom AND @priceTo",
        "c.car_overview.year BETWEEN @yearFrom AND @yearTo",
        "c.car_overview.mileage BETWEEN @kmFrom AND @kmTo",
        "c.car_overview.pk BETWEEN @pkFrom AND @pkTo"
      ];

      const params: any[] = [
        { name: "@priceFrom", value: priceFrom },
        { name: "@priceTo", value: priceTo },
        { name: "@yearFrom", value: yearFrom },
        { name: "@yearTo", value: yearTo },
        { name: "@kmFrom", value: kmFrom },
        { name: "@kmTo", value: kmTo },
        { name: "@pkFrom", value: pkFrom },
        { name: "@pkTo", value: pkTo }
      ];

      const mapArrayParam = (arr: string[], field: string) => {
        if (arr.length) {
          filters.push(`ARRAY_CONTAINS(@${field}, c.car_overview.${field})`);
          params.push({ name: `@${field}`, value: arr });
        }
      };

      mapArrayParam(brand, "brand");
      mapArrayParam(model, "model");
      mapArrayParam(variant, "variant");
      mapArrayParam(fuel, "fuel");
      mapArrayParam(body, "body");
      mapArrayParam(transmission, "transmission");
      mapArrayParam(doors, "doors");
      mapArrayParam(seats, "seats");

      if (searchText) {
        filters.push(`CONTAINS(LOWER(c.car_overview.brand), @search) OR CONTAINS(LOWER(c.car_overview.model), @search) OR CONTAINS(LOWER(c.car_overview.description), @search)`);
        params.push({ name: "@search", value: searchText.toLowerCase() });
      }

      const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
      const query = {
        query: `SELECT * FROM c ${whereClause} ORDER BY c.car_overview.${sortKey} ${sortOrder}`,
        parameters: params
      };

      const { resources } = await container.items.query(query).fetchAll();
      return { status: 200, jsonBody: resources };
    }

    // ✅ POST - nieuwe auto toevoegen
    if (request.method === "POST") {
      const body = await request.json() as CarPayload;
      if (!body || !body.avsid) {
        return { status: 400, body: "Invalid payload, 'avsid' required." };
      }
      body.id = body.avsid;
      const { resource } = await container.items.create(body);
      return { status: 201, jsonBody: resource };
    }

    // ✅ PUT - bestaande auto updaten
    if (request.method === "PUT") {
      const body = await request.json() as CarPayload;
      if (!body || !body.avsid) {
        return { status: 400, body: "Invalid payload, 'avsid' required." };
      }
      body.id = body.avsid;
      const { resource } = await container.item(body.avsid, body.avsid).replace(body);
      return { status: 200, jsonBody: resource };
    }

    // ✅ DELETE - auto verwijderen
    if (request.method === "DELETE") {
      const avsid = request.query.get("id");
      if (!avsid) return { status: 400, body: "ID vereist" };
      await container.item(avsid, avsid).delete();
      return { status: 204 };
    }

    return { status: 405, body: "Method not allowed" };
  } catch (err) {
    context.error("/cars error", err);
    return { status: 500, body: "Interne fout" };
  }
}

app.http("cars", {
  methods: ["GET", "POST", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "cars/{avsid?}",
  handler: carsHandler
});
