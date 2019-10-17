import React, { useState } from 'react';
import Header from './components/header'
import axios from 'axios'
import './App.scss';

const App = () => {

  const [vendors, setVendors] = useState([])
  const [click, isClicked] = useState(false)

  const fetchData = async () => {
    const response = await axios.get('http://localhost:5000/statuses');
    const data = await response.data;
    console.log(data)
    setVendors(data)
    isClicked(true)
  }

  return (
    <div className="App">
      <Header />
      <button onClick={fetchData}>Fetch Data</button>
      {click ?
        <ul>
          {Array.from(vendors).map((vendor, index) => {
            return <li key={index}>
              <img src={vendor.logo} alt={vendor.title} />
              <h2>{vendor.title}</h2>
              <h3 style={vendor.status === 'Operational' ? { background: 'green', color: '#fff' } : { background: 'red', color: '#fff' }}>{vendor.status}</h3>
            </li>
          })}
        </ul> : ''
      }
    </div>
  );
}

export default App;
