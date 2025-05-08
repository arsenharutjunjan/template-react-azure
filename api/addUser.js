const { CosmosClient } = require("@azure/cosmos");

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key });
const container = client.database("avs-db").container("avs-container");

module.exports = async function (context, req) {
    const { avsid, name, email } = req.body;

    if (!avsid || !name || !email) {
        context.res = {
            status: 400,
            body: "Fields 'avsid', 'name', and 'email' are required."
        };
        return;
    }

    try {
        const item = { id: avsid, avsid, name, email };
        const { resource } = await container.items.create(item);

        context.res = {
            status: 201,
            body: resource
        };
    } catch (err) {
        context.log.error("Error writing to Cosmos DB:", err);
        context.res = {
            status: 500,
            body: "Internal Server Error"
        };
    }
};
