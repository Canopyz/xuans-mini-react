import React, { useEffect, useState } from '../../packages/react/src'
import ReactDOM from '../../packages/react-dom/src'

function App() {
  const [num, updateNum] = useState(0)
  useEffect(() => {
    console.log('App mount')
  }, [])

  useEffect(() => {
    console.log('num change create', num)
    return () => {
      console.log('num change destroy', num)
    }
  }, [num])

  return (
    <div onClick={() => updateNum(num + 1)}>
      {num === 0 ? <Child /> : 'noop'}
    </div>
  )
}

function Child() {
  useEffect(() => {
    console.log('Child mount')
    return () => console.log('Child unmount')
  }, [])

  return 'i am child'
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
