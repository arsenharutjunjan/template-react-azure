const { app } = require('@azure/functions');
const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key });
const container = client.database("avs-db").container("avs-container");

app.http('addUser', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Received request: ${request.method} ${request.url}`);

        const body = await request.json();
        const { avsid, name, email } = body;

        if (!avsid || !name || !email) {
            return {
                status: 400,
                body: "Fields 'avsid', 'name', and 'email' are required."
            };
        }

        try {
            const item = { id: avsid, avsid, name, email };
            const { resource } = await container.items.create(item);

            return {
                status: 201,
                jsonBody: resource
            };
        } catch (err) {
            context.log.error("Error writing to Cosmos DB:", err);
            return {
                status: 500,
                body: "Internal Server Error"
            };
        }
    }
});
