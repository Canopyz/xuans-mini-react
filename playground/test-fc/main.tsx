import React, { useState } from '../../packages/react/src'
import ReactDOM from '../../packages/react-dom/src'

const App = () => {
  const [num, setNum] = useState(100)

  const arr =
    num % 2 === 0
      ? [<li key="1">1</li>, <li key="2">2</li>, <li key="3">3</li>]
      : [<li key="2">2</li>, <li key="1">1</li>]

  return (
    <ul
      onClick={() => {
        setNum(num + 1)
      }}
    >
      {arr}
    </ul>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
