// api/src/functions/cars.ts

import { app, HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";

app.http("cars", {
  methods: ["GET", "POST", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "cars/{avsid?}",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    // 1) Haal optionele route-param op uit request.params
    const avsid = request.params?.avsid;
    const path = avsid ? `/api/cars/${avsid}` : "/api/cars";

    // 2) Query-string behouden
    const urlParts = request.url.split("?");
    const qs = urlParts.length > 1 ? "?" + urlParts[1] : "";

    const target = `https://react-template-functions.azurewebsites.net${path}${qs}`;

    // 3) Zet request.headers om naar een plain object voor fetch
    const headers: Record<string, string> = {};
    // request.headers is een Headers-achtig object, dus:
    for (const [key, value] of (request.headers as any).entries()) {
      headers[key] = value;
    }
    delete headers["host"];

    // 4) Forward het request naar je externe Function App
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : JSON.stringify(request.body),
    });

    // 5) Lees response en return een HttpResponseInit
    const contentType = upstream.headers.get("content-type") || "application/json";
    const bodyText = await upstream.text();

    return {
      status: upstream.status,
      headers: { "Content-Type": contentType },
      body: bodyText,
    };
  },
});
