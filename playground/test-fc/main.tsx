import ReactDOM from '../../packages/react-dom/src'
import App from './App.jsx'

const root = ReactDOM.createRoot(document.getElementById('root')!)
// @ts-expect-error let me do it
root.render(<App />)
