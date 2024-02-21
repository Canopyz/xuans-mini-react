import React, { useState } from '../../packages/react/src'
import ReactDOM from '../../packages/react-dom/src'

const App = () => {
  const [num, setNum] = useState(100)
  window.setNum = setNum

  return <div onClick={() => setNum(num + 1)}>{num}</div>
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
