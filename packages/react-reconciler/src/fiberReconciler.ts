import { Container } from 'hostConfig'
import { HostRoot } from './workTags'
import { FiberNode, FiberRootNode } from './fiber'
import { createUpdate, createUpdateQueue, enqueueUpdate } from './updateQueue'
import { ReactElementType } from '@xuans-mini-react/shared'
import { scheduleUpdateOnFiber } from './workLoop'

export function createContainer(container: Container) {
  const hostRootFiber = new FiberNode(HostRoot, {}, null)
  const root = new FiberRootNode(container, hostRootFiber)
  hostRootFiber.updateQueue = createUpdateQueue()
  return root
}

export function updateContainer(
  element: ReactElementType | null,
  root: FiberRootNode,
) {
  const hostRootFiber = root.current
  const update = createUpdate<ReactElementType | null>(element)
  enqueueUpdate(hostRootFiber.updateQueue!, update)
  scheduleUpdateOnFiber(hostRootFiber)

  return element
}