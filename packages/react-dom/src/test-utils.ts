import { ReactElementType } from '@xuans-mini-react/shared'
import ReactDom from '@xuans-mini-react/react-dom'

export function renderIntoDocument(element: ReactElementType) {
  const div = document.createElement('div')

  return ReactDom.createRoot(div).render(element)
}
