import { useState, useEffect, useRef } from '../../packages/react/src'
import ReactDOM from '../../packages/react-dom/src'

function App() {
  const [isDel, del] = useState(false)
  const divRef = useRef(null)

  console.warn('render divRef', divRef.current)

  useEffect(() => {
    console.warn('useEffect divRef', divRef.current)
  }, [])

  return (
    <div ref={divRef} onClick={() => del(true)}>
      {isDel ? <div>deleted</div> : <div>click me</div>}
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
// @ts-expect-error let me do it
root.render(<App />)
