const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key });
const container = client.database('avs-db').container('avs-container');

app.http('getAllCars', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (_request, context) => {
        try {
            const query = 'SELECT * FROM c WHERE IS_DEFINED(c.car_overview)';
            const { resources: cars } = await container.items.query(query).fetchAll();

            return {
                status: 200,
                jsonBody: cars
            };
        } catch (err) {
            context.error('Fout bij ophalen van auto\'s:', err);
            return {
                status: 500,
                body: 'Interne fout bij ophalen van auto\'s.'
            };
        }
    }
});
