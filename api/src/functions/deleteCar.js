const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key });
const container = client.database('avs-db').container('avs-container');

app.http('deleteCar', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const avsid = request.query.get('avsid');

        if (!avsid) {
            return {
                status: 400,
                body: "Missing 'avsid' query parameter."
            };
        }

        try {
            // eerst checken of het bestaat
            await container.item(avsid, avsid).read(); // id en partition key zijn beide avsid

            // dan verwijderen
            await container.item(avsid, avsid).delete();

            return {
                status: 200,
                body: `Auto met avsid '${avsid}' is succesvol verwijderd.`
            };
        } catch (err) {
            if (err.code === 404) {
                return {
                    status: 404,
                    body: `Auto met avsid '${avsid}' bestaat niet.`
                };
            }

            context.error("Fout bij verwijderen:", err);
            return {
                status: 500,
                body: `Interne fout bij verwijderen van auto '${avsid}'.`
            };
        }
    }
});
