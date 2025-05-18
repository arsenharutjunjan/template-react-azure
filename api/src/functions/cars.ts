import { app, HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";

app.http("cars", {
  methods: ["GET", "POST", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "cars/{avsid?}",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    // grab the optional avsid directly off of request.params
    const avsid = request.params.avsid;

    const path = avsid ? `/api/cars/${avsid}` : "/api/cars";

    // query-string behouden
    const urlParts = request.url.split("?");
    const qs = urlParts.length > 1 ? "?" + urlParts[1] : "";

    // target naar je bestaande Function App
    const target = `https://react-template-functions.azurewebsites.net${path}${qs}`;

    // headers omzetten naar plain object
    const headers: Record<string,string> = {};
    for (const [k,v] of (request.headers as any).entries()) {
      headers[k] = v as string;
    }
    delete headers["host"];

    // doorsturen
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET","HEAD"].includes(request.method)
        ? undefined
        : JSON.stringify(request.body)
    });

    // response teruggeven
    const bodyText    = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json";
    return {
      status: upstream.status,
      headers: { "Content-Type": contentType },
      body: bodyText
    };
  }
});
