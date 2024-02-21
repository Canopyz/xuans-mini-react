import React, { useState } from '../../packages/react/src'
import ReactDOM from '../../packages/react-dom/src'

const App = () => {
  const [num, setNum] = useState(100)
  window.setNum = setNum

  return num === 3 ? <span>{num}</span> : <div>not 3</div>
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
