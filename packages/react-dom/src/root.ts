import {
  createContainer,
  updateContainer,
} from '@xuans-mini-react/react-reconciler'
import { Container } from './hostConfig'
import { ReactElementType } from '@xuans-mini-react/shared'
import { initEvent } from './SyntheticEvents'

export function createRoot(container: Container) {
  const root = createContainer(container)

  return {
    render(element: ReactElementType) {
      initEvent(container, 'click')
      return updateContainer(element, root)
    },
  }
}
