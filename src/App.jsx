// App.jsx
import { useState } from 'react';

function App() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await fetch('/api/data');
    const json = await res.json();
    setData(json.message);
  };

  return (
    <div>
      <h1>Mijn simpele app</h1>
      <button onClick={fetchData}>Haal data op</button>
      {data && <p>{data}</p>}
    </div>
  );
}

export default App;
