import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';


function App() {
  const [products, setProducts] = useState(null)
  const [symbolPriceMap, setSymbolPriceMap] = useState({})

  useEffect(() => {
    axios.get('https://api.delta.exchange/v2/products', {
      params: {
        page_size: 200
      }
    }).then(res => {
      setProducts(res.data)
      const socket = new WebSocket('wss://production-esocket.delta.exchange');
      socket.onopen = function () {
        // Get markprice
        const symbolList = res.data.result.map(prod => prod.symbol)
        symbolList.forEach(symbol => symbolPriceMap[symbol] = null)
        socket.send(JSON.stringify({
          "type": "subscribe",
          "payload": {
            "channels": [
              {
                "name": "v2/ticker",
                "symbols": [
                  ...symbolList
                ]
              }
            ]
          }
        }))
      }

      socket.onmessage = function (msg) {
        const parsedData = JSON.parse(msg.data)
        if (parsedData.symbol) {
          let newData = {}
          newData[parsedData.symbol] = parsedData.mark_price
          setSymbolPriceMap(prev => ({
            ...prev,
            ...newData
          }))
        }
      }
    })
  }, [])

  return (
    <div className="App">
      <div className='table-wrapper'>
        <table className='table'>
          <thead className='table-header'>
            <tr>
              <th>Symbol</th>
              <th>Description</th>
              <th>Underlying Asset</th>
              <th>Mark Price</th>
            </tr>
          </thead>
          <tbody>
            {products && products.result.map(prod =>
            (<tr>
              <td>{prod.symbol}</td>
              <td>{prod.description}</td>
              <td>{prod.underlying_asset.symbol}</td>
              <td>{symbolPriceMap[prod.symbol]}</td>
            </tr>)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
