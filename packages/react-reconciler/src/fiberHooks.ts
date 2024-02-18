import { ReactElementType } from '@xuans-mini-react/shared'
import { FiberNode } from './fiber'

export function renderWithHooks(wip: FiberNode) {
  const Component = wip.type as (props: any) => ReactElementType
  const props = wip.pendingProps

  const children = Component(props)

  return children
}
