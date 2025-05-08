import { useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  async function addUser() {
    try {
      const response = await fetch('http://localhost:7071/api/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avsid: '002',
          name: 'Lusine',
          email: 'lusine@example.com',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      setMessage(`Gebruiker toegevoegd: ${data.name}`);
    } catch (error) {
      console.error('Fout bij toevoegen gebruiker:', error);
      setMessage('Er ging iets mis.');
    }
  }

  return (
    <div>
      <h1>Gebruiker toevoegen</h1>
      <button onClick={addUser}>Toevoegen</button>
      <p>{message}</p>
    </div>
  );
}

export default App;
