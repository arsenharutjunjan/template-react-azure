const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key });
const container = client.database('avs-db').container('avs-container');

app.http('getCar', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const avsid = request.query.get('avsid');

    if (!avsid) {
      return {
        status: 400,
        body: "Missing 'avsid' query parameter.",
      };
    }

    try {
      const query = {
        query: "SELECT * FROM c WHERE c.avsid = @avsid",
        parameters: [{ name: "@avsid", value: avsid }],
      };

      const { resources } = await container.items
        .query(query, { partitionKey: avsid })
        .fetchAll();

      if (!resources || resources.length === 0) {
        return {
          status: 404,
          body: `Auto met avsid ${avsid} niet gevonden.`,
        };
      }

      return {
        status: 200,
        jsonBody: resources[0], // Er zou max 1 resultaat moeten zijn
      };
    } catch (err) {
      context.error("Fout bij ophalen auto:", err);
      return {
        status: 500,
        body: "Interne fout bij ophalen auto.",
      };
    }
  },
});
