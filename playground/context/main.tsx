import { useContext, createContext } from '../../packages/react/src'
import ReactDOM from '../../packages/react-dom/src'

const ctxA = createContext('dA')
const ctxB = createContext('dB')

function App() {
  return (
    <ctxA.Provider value={'A0'}>
      <ctxB.Provider value={'B0'}>
        <ctxA.Provider value={'A1'}>
          <Cpn />
        </ctxA.Provider>
      </ctxB.Provider>
      <Cpn />
    </ctxA.Provider>
  )
}

function Cpn() {
  const a = useContext(ctxA)
  const b = useContext(ctxB)
  return (
    <div>
      <h1>{a}</h1>
      <h2>{b}</h2>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
// @ts-expect-error let me do it
root.render(<App />)
