import { useState } from 'react';

function App() {
  const [userMessage, setUserMessage] = useState('');
  const [carMessage, setCarMessage] = useState('');
  const [cars, setCars] = useState([]);
  const [singleCar, setSingleCar] = useState(null);

  async function addUser() {
    try {
      const response = await fetch('/api/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avsid: '102',
          name: 'Lusine',
          email: 'lusine@example.com',
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('User added:', data);
      setUserMessage(`✅ Gebruiker toegevoegd: ${data.name}`);
    } catch (error) {
      console.error('Fout bij toevoegen gebruiker:', error);
      setUserMessage('❌ Fout bij toevoegen gebruiker.');
    }
  }

  async function addCar() {
    try {
      const response = await fetch('/api/addCar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avsid: '104',
          registration: '24-09-2017',
          car_overview: {
            brand: 'Nissan',
            model: 'Qashqai',
            body: 'SUV',
            price: 39021,
            pictures: './images/autos/004/',
            description: 'Betrouwbare SUV, ideaal voor gezinnen.',
            condition: 'Occasion',
            stock_number: 'NIS004',
            vin_number: '1BCC174-7868-4D8',
            year: 2012,
            mileage: 150593,
            transmission: 'Automaat',
            engine_size: '1.9L',
            driver_type: 'Voorwielaandrijving',
            cylinders: 4,
            fuel: 'Benzine',
            doors: 3,
            color: 'Zwart',
            seats: 4,
            pk: 200,
            variant: 'NISVARA',
            carrosserie: 'SUV',
          },
          safety_features: ['ABS', 'Achteruitrijcamera', 'Botswaarschuwing', 'Lane Assist'],
          exterior_features: ['Mistlampen', 'Elektrische spiegels', 'Lichtmetalen velgen', 'LED-koplampen'],
          interior_features: ['Navigatiesysteem', 'Climate control'],
          convenience_features: ['Bluetooth', 'Sleutelvrije toegang'],
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Car added:', data);
      setCarMessage(`✅ Auto toegevoegd: ${data.avsid}`);
    } catch (error) {
      console.error('Fout bij toevoegen auto:', error);
      setCarMessage('❌ Fout bij toevoegen auto.');
    }
  }

  async function getAllCars() {
    try {
      const response = await fetch('/api/getAllCars');
      const data = await response.json();
      setCars(data);
    } catch (error) {
      console.error('Fout bij ophalen autos:', error);
    }
  }

  async function getCar() {
    try {
      const response = await fetch('/api/getCar?avsid=004');
      const data = await response.json();
      setSingleCar(data);
    } catch (error) {
      console.error('Fout bij ophalen auto:', error);
    }
  }

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial, sans-serif' }}>
      <h2>Gebruiker</h2>
      <button onClick={addUser}>➕ Gebruiker toevoegen</button>
      <p>{userMessage}</p>

      <hr />

      <h2>Auto</h2>
      <button onClick={addCar}>➕ Auto toevoegen</button>
      <p>{carMessage}</p>

      <button onClick={getCar}>🔍 Eén auto ophalen (avsid=004)</button>
      <pre>{singleCar ? JSON.stringify(singleCar, null, 2) : 'Geen auto geladen'}</pre>

      <button onClick={getAllCars}>📋 Alle autos ophalen</button>
      <pre>{cars.length ? JSON.stringify(cars, null, 2) : 'Geen autos geladen'}</pre>
    </div>
  );
}

export default App;
