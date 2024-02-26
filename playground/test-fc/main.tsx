import React, { useEffect, useState } from '../../packages/react/src'
import ReactDOM from '../../packages/react-dom/src'

function App() {
  const [num, update] = useState(100)
  return (
    <ul
      onClick={() => {
        console.log(1)
        update(50)
      }}
    >
      {new Array(num).fill(0).map((_, i) => (
        <Child key={i}>{i}</Child>
      ))}
    </ul>
  )
}

function Child({ children }) {
  const now = performance.now()

  while (performance.now() - now < 4) {
    // noop
  }

  return <li>{children}</li>
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
