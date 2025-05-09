import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

interface Todo {
    id: string;
    title: string;
    completed: boolean;
}

export async function todos(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const endpoint = process.env.COSMOSDB_ENDPOINT;
    const key = process.env.COSMOSDB_KEY;
    
    if (!endpoint || !key) {
        return {
            status: 500,
            body: "Database configuration is missing"
        };
    }

    const client = new CosmosClient({ endpoint, key });
    const database = client.database("avs-db");
    const container = database.container("avs-container");

    try {
        switch (request.method) {
            case "GET":
                const { resources: items } = await container.items.readAll().fetchAll();
                return {
                    status: 200,
                    jsonBody: items
                };

            case "POST":
                const newItem = await request.json() as Todo;
                const { resource: createdItem } = await container.items.create(newItem);
                return {
                    status: 201,
                    jsonBody: createdItem
                };

            case "PUT":
                const updatedItem = await request.json() as Todo;
                const { resource: modifiedItem } = await container.item(updatedItem.id).replace(updatedItem);
                return {
                    status: 200,
                    jsonBody: modifiedItem
                };

            case "DELETE":
                const id = request.query.get('id');
                if (!id) {
                    return {
                        status: 400,
                        body: "ID is required for deletion"
                    };
                }
                await container.item(id).delete();
                return {
                    status: 204
                };

            default:
                return {
                    status: 405,
                    body: "Method not allowed"
                };
        }
    } catch (error) {
        context.error('Error processing request:', error);
        return {
            status: 500,
            body: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
} 