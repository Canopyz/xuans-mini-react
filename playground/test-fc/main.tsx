import React, { useState } from '../../packages/react/src'
import ReactDOM from '../../packages/react-dom/src'

const App = () => {
  const [num, setNum] = useState(100)
  console.log(num)

  const test =
    num % 2 === 0 ? (
      <>
        <li key="1">1</li>
        <li key="2">2</li>
        <>
          <li key="3">3</li>
          <li key="4">4</li>
        </>
      </>
    ) : (
      [<div key="3">3</div>, <div key="3">4</div>]
    )

  return (
    <ul
      onClick={() => {
        setNum((num) => num + 1)
        setNum((num) => num + 1)
        setNum((num) => num + 1)
      }}
    >
      {num}
    </ul>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
