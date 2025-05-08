const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function deleteCars() {
  const filePath = path.join(__dirname, '../cars.json');
  const cars = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  for (const car of cars) {
    try {
      const res = await fetch(`http://localhost:7071/api/deleteCar?avsid=${car.avsid}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-ms-documentdb-partitionkey': `["${car.avsid}"]`  // 👈 belangrijk voor Cosmos DB
        }
      });

      const text = await res.text();
      if (res.ok) {
        console.log(`✅ Verwijderd: ${car.avsid} → ${text}`);
      } else {
        console.error(`❌ Fout bij ${car.avsid}: ${text}`);
      }
    } catch (err) {
      console.error(`❌ Netwerkfout bij ${car.avsid}: ${err.message}`);
    }
  }
}

deleteCars();
