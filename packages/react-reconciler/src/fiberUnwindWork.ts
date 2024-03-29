import { ReactProviderType } from '@xuans-mini-react/shared'
import { FiberNode } from './fiber'
import { DidCapture, NoFlags, ShouldCapture } from './fiberFlags'
import { popSuspenseHandler } from './suspenseContext'
import { ContextProvider, SuspenseComponent } from './workTags'
import { popProvider } from './fiberContext'

export function unwindWork(wip: FiberNode) {
  const flags = wip.flags

  switch (wip.tag) {
    case SuspenseComponent:
      popSuspenseHandler()
      if (
        (flags & ShouldCapture) !== NoFlags &&
        (flags & DidCapture) === NoFlags
      ) {
        wip.flags = (flags & ~ShouldCapture) | DidCapture
        return wip
      }
      return null
    case ContextProvider:
      const context = (wip.type as ReactProviderType<any>)._context
      popProvider(context)
      return null
    default:
      return null
  }
}
