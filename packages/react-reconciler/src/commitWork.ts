import { Container, appendChildToContainer } from 'hostConfig'
import { FiberNode, FiberRootNode } from './fiber'
import { MutationMask, NoFlags, Placement } from './fiberFlags'
import { HostComponent, HostRoot, HostText } from './workTags'

let nextEffect: FiberNode | null = null

export const commitMutationEffects = (finishedWork: FiberNode) => {
  nextEffect = finishedWork

  while (nextEffect !== null) {
    const child: FiberNode | null = nextEffect.child

    if ((nextEffect.subtreeFlags & MutationMask) !== NoFlags && child) {
      nextEffect = child
    } else {
      commitMutationEffectsOnFiber(nextEffect)
      up: while (nextEffect !== null) {
        const sibling: FiberNode | null = nextEffect.sibling
        if (sibling !== null) {
          nextEffect = sibling
          break up
        }
        nextEffect = nextEffect.return
      }
    }
  }
}

function commitMutationEffectsOnFiber(finishedWork: FiberNode) {
  const flags = finishedWork.flags

  if ((flags & Placement) !== NoFlags) {
    console.warn('Placement')
    commitPlacement(finishedWork)
    finishedWork.flags &= ~Placement
  }
}

function commitPlacement(finishedWork: FiberNode) {
  if (__DEV__) {
    console.log('commit Placement')
  }

  const hostParent = getHostParent(finishedWork)
  if (hostParent) {
    appendPlacementNodeIntoContainer(finishedWork, hostParent)
  }
}

function getHostParent(fiber: FiberNode): Container | null {
  let parent = fiber.return

  while (parent) {
    const parentTag = parent.tag
    if (parentTag === HostComponent) {
      return parent.stateNode
    }
    if (parentTag === HostRoot) {
      return (parent.stateNode as FiberRootNode).container
    }
    parent = parent.return
  }

  if (__DEV__) {
    console.warn('No host parent')
  }

  return null
}

function appendPlacementNodeIntoContainer(
  finishedWork: FiberNode,
  hostParent: Container,
) {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    return appendChildToContainer(hostParent, finishedWork.stateNode)
  }

  const child = finishedWork.child
  if (child) {
    appendPlacementNodeIntoContainer(child, hostParent)

    let sibling = child.sibling
    while (sibling) {
      appendPlacementNodeIntoContainer(sibling, hostParent)
      sibling = sibling.sibling
    }
  }
}
