import { createContainer } from '@xuans-mini-react/react-reconciler'
import { Container } from './hostConfig'
import { ReactElementType } from '@xuans-mini-react/shared'
import { updateContainer } from '@xuans-mini-react/react-reconciler'

export function createRoot(container: Container) {
  const root = createContainer(container)

  return {
    render(element: ReactElementType) {
      updateContainer(element, root)
    },
  }
}
