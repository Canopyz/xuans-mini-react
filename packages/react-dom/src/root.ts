import {
  createContainer,
  updateContainer,
} from '@xuans-mini-react/react-reconciler'
import { Container } from './hostConfig'
import { ReactElementType } from '@xuans-mini-react/shared'

export function createRoot(container: Container) {
  const root = createContainer(container)

  return {
    render(element: ReactElementType) {
      updateContainer(element, root)
    },
  }
}
