const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs');
const path = require('path');

async function uploadCars() {
  const carsPath = path.join(__dirname, '..', '..', 'cars.json');
  const cars = JSON.parse(fs.readFileSync(carsPath, 'utf-8'));

  for (const car of cars) {
    const res = await fetch('http://localhost:7071/api/addCar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(car),
    });

    if (res.ok) {
      console.log(`✅ Toegevoegd: ${car.avsid}`);
    } else {
      const err = await res.text();
      console.error(`❌ Fout bij ${car.avsid}: ${err}`);
    }
  }
}

uploadCars();
