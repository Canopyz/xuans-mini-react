import {
  Props,
  REACT_ELEMENT_TYPE,
  ReactElementType,
} from '@xuans-mini-react/shared'
import {
  FiberNode,
  createFiberFromElement,
  createWorkInProgress,
} from './fiber'
import { HostText } from './workTags'
import { ChildDeletion, Placement } from './fiberFlags'

function ChildReconciler(shouldTrackSideEffects: boolean) {
  function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
    if (!shouldTrackSideEffects) {
      return
    }

    const deletions = returnFiber.deletions
    if (deletions === null) {
      returnFiber.deletions = [childToDelete]
      returnFiber.flags |= ChildDeletion
    } else {
      deletions.push(childToDelete)
    }
  }
  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType,
  ) {
    const key = element.key
    if (currentFiber !== null) {
      if (currentFiber.key === key) {
        if (element.$$typeof === REACT_ELEMENT_TYPE) {
          if (element.type === currentFiber.type) {
            // can reuse the existing fiber
            const existing = useFiber(currentFiber, element.props)
            existing.return = returnFiber
            return existing
          }
          deleteChild(returnFiber, currentFiber)
        } else {
          if (__DEV__) {
            console.warn('Unknown child type', element)
          }
        }
      } else {
        // delete the old child
        deleteChild(returnFiber, currentFiber)
      }
    }

    const fiber = createFiberFromElement(element)
    fiber.return = returnFiber
    return fiber
  }

  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number,
  ) {
    if (currentFiber !== null) {
      if (currentFiber.tag === HostText) {
        const existing = useFiber(currentFiber, { content })
        existing.return = returnFiber
        return existing
      }

      deleteChild(returnFiber, currentFiber)
    }
    const fiber = new FiberNode(HostText, { content }, null)
    fiber.return = returnFiber
    return fiber
  }

  function placeSingleChild(newFiber: FiberNode) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags = newFiber.flags | Placement
    }
    return newFiber
  }

  return function reconcileChildFibers(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    newChild?: ReactElementType,
  ) {
    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFiber, newChild),
          )
        default:
          if (__DEV__) {
            console.warn('Unknown child type', newChild)
          }
          break
      }
    }

    // TODO: multiple children

    // HostText
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFiber, newChild),
      )
    }

    currentFiber && deleteChild(returnFiber, currentFiber)

    if (__DEV__) {
      console.warn('Unknown child type', newChild)
    }

    return null
  }
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
  const clone = createWorkInProgress(fiber, pendingProps)
  clone.index = 0
  clone.sibling = null
  return clone
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)
