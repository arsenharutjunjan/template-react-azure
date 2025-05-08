const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key });
const container = client.database('avs-db').container('avs-container');

app.http('addCar', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const body = await request.json();

    // Zorg ervoor dat alle benodigde velden aanwezig zijn
    if (!body.avsid) {
      return {
        status: 400,
        body: "Missing required field: avsid"
      };
    }

    const avsid = body.avsid;

    // Log de request body om te begrijpen wat er wordt verzonden
    context.log(`Received request to add car with avsid: ${avsid}`);

    try {
      // Controleer of de auto al bestaat in de container
      const { resource: existingItem } = await container.item(avsid, avsid).read();
      if (existingItem) {
        context.log(`Car with avsid ${avsid} already exists.`);
        return {
          status: 409,
          body: "Car with this avsid already exists."
        };
      }
    } catch (readErr) {
      if (readErr.code !== 404) {
        // Als de fout geen 404 is (niet gevonden), log dan de fout
        context.error("Error reading car:", readErr);
        return {
          status: 500,
          body: "Internal Server Error"
        };
      }
      // Geen item gevonden, doorgaan naar de create operatie
    }

    // Voeg de auto toe als deze nog niet bestaat
    try {
      const item = {
        id: avsid,  // Gebruik avsid als de document-ID
        avsid,      // Voeg avsid toe als een veld
        ...body
      };
      
      context.log(`Creating car with avsid: ${avsid}`);
      const { resource } = await container.items.create(item);
      context.log(`Successfully added car with avsid: ${avsid}`);
      
      return {
        status: 201,
        jsonBody: resource
      };
    } catch (err) {
      context.error("Error adding car:", err);
      return {
        status: 500,
        body: "Internal Server Error"
      };
    }
  }
});
