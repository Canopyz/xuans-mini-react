import { REACT_ELEMENT_TYPE, ReactElementType } from '@xuans-mini-react/shared'
import { FiberNode, createFiberFromElement } from './fiber'
import { HostText } from './workTags'
import { Placement } from './fiberFlags'

function ChildReconciler(shouldTrackSideEffects: boolean) {
  function reconcileSingleElement(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    element: ReactElementType,
  ) {
    console.log(currentFiber)
    const fiber = createFiberFromElement(element)
    fiber.return = returnFiber
    return fiber
  }

  function reconcileSingleTextNode(
    returnFiber: FiberNode,
    currentFiber: FiberNode | null,
    content: string | number,
  ) {
    console.log(currentFiber)
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

    if (__DEV__) {
      console.warn('Unknown child type', newChild)
    }

    return null
  }
}

export const reconcileChildFibers = ChildReconciler(true)
export const mountChildFibers = ChildReconciler(false)
