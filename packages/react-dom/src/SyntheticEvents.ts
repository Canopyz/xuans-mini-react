import { Props } from '@xuans-mini-react/shared'
import { Container } from 'hostConfig'
import {
  unstable_ImmediatePriority as ImmediatePriority,
  unstable_NormalPriority as NormalPriority,
  unstable_UserBlockingPriority as UserBlockingPriority,
  unstable_runWithPriority,
} from 'scheduler'

export const elementPropsKey = '__props'
const validEventTypeList = ['click']

type EventCallback = (e: Event) => void

interface SyntheticEvent extends Event {
  __stopPropagation: boolean
}

interface Paths {
  capture: EventCallback[]
  bubble: EventCallback[]
}

export interface DOMElement extends Element {
  [elementPropsKey]: Props | null
}

export function updateFiberProps(node: DOMElement, props: Props | null) {
  node[elementPropsKey] = props
}

export function initEvent(container: Container, eventType: string) {
  if (!validEventTypeList.includes(eventType)) {
    console.warn(`Invalid event type: ${eventType}`)
  }

  if (__DEV__) {
    console.log('init event: ', eventType)
  }

  container.addEventListener(eventType, (e) => {
    dispatchEvent(container, eventType, e)
  })
}

function createSyntheticEvent(e: Event) {
  const syntheticEvent = e as SyntheticEvent
  syntheticEvent.__stopPropagation = false
  const originalStopPropagation = syntheticEvent.stopPropagation

  syntheticEvent.stopPropagation = () => {
    syntheticEvent.__stopPropagation = true
    if (originalStopPropagation) {
      originalStopPropagation.call(syntheticEvent)
    }
  }
  return syntheticEvent
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
  const tagetElement = e.target

  if (tagetElement === null) {
    return
  }

  // collect events from the target to the container
  const { capture, bubble } = collectPaths(
    tagetElement as DOMElement,
    container,
    eventType,
  )
  // create synthetic event
  const se = createSyntheticEvent(e)
  // capture
  triggerEventFlow(capture, se)

  if (!se.__stopPropagation) {
    // bubble
    triggerEventFlow(bubble, se)
  }
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
  for (let i = 0; i < paths.length; i++) {
    const callback = paths[i]

    unstable_runWithPriority(eventTypeToSchedulerPriority(se.type), () => {
      callback.call(null, se)
    })

    if (se.__stopPropagation) {
      break
    }
  }
}

function getEventCallbackNameFromEventType(eventType: string): string[] {
  return {
    click: ['onClickCapture', 'onClick'],
  }[eventType] as string[]
}

function collectPaths(
  targetElement: DOMElement,
  container: Container,
  eventType: string,
) {
  const paths: Paths = {
    capture: [],
    bubble: [],
  }

  while (targetElement !== container) {
    const elementProps = targetElement[elementPropsKey]

    if (elementProps) {
      const callbackNames = getEventCallbackNameFromEventType(eventType)
      if (callbackNames) {
        callbackNames.forEach((callbackName, i) => {
          const eventCallback = elementProps[callbackName]
          if (eventCallback) {
            if (i === 0) {
              paths.capture.unshift(eventCallback)
            } else {
              paths.bubble.push(eventCallback)
            }
          }
        })
      }
    }

    targetElement = targetElement.parentNode as DOMElement
  }

  return paths
}

function eventTypeToSchedulerPriority(eventType: string) {
  switch (eventType) {
    case 'click':
    case 'keydown':
    case 'keyup':
      return ImmediatePriority
    case 'scroll':
      return UserBlockingPriority
    default:
      return NormalPriority
  }
}
