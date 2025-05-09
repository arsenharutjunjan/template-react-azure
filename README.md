# React + Azure Functions + Cosmos DB Todo App

This is a full-stack todo application built with React, Azure Functions, and Azure Cosmos DB, hosted on Azure Static Web Apps.

## Prerequisites

- Node.js (v14 or later)
- Azure account
- Azure CLI (optional, for local development)

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd api
   npm install
   ```

3. Create a `.env` file in the `api` directory with your Cosmos DB credentials:
   ```
   COSMOSDB_ENDPOINT=your_cosmos_db_endpoint
   COSMOSDB_KEY=your_cosmos_db_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Deployment

1. Create an Azure Cosmos DB account and database:
   - Create a new Cosmos DB account in the Azure Portal
   - Create a database named "todosdb"
   - Create a container named "todos"

2. Create an Azure Static Web App:
   - Go to the Azure Portal
   - Create a new Static Web App
   - Connect your GitHub repository
   - Configure the build settings:
     - App location: `/`
     - API location: `/api`
     - Output location: `build`

3. Add the following environment variables in your Static Web App settings:
   - `COSMOSDB_ENDPOINT`: Your Cosmos DB endpoint
   - `COSMOSDB_KEY`: Your Cosmos DB key

## Project Structure

```
.
├── src/                 # React frontend
├── api/                 # Azure Functions backend
│   └── src/
│       └── functions/   # Azure Functions
├── public/             # Static files
└── staticwebapp.config.json  # Azure Static Web Apps config
```

## Features

- Create, read, update, and delete todos
- Real-time updates
- Responsive design with Tailwind CSS
- Serverless backend with Azure Functions
- NoSQL database with Cosmos DB

## Security

- All database operations are performed through Azure Functions
- Database credentials are never exposed to the frontend
- API routes are protected with Azure Static Web Apps authentication

## License

MIT
