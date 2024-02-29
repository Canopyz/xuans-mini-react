import currentDispatcher, {
  Dispatcher,
  Dispatch,
  resolveDispatcher,
} from './currentDispatcher'
import { jsx } from './jsx'
import ReactCurrentBatchConfig from './currentBatchConfig'

export const useState: Dispatcher['useState'] = (initialState) => {
  const dispatcher = resolveDispatcher()
  return dispatcher.useState(initialState)
}

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
  const dispatcher = resolveDispatcher()
  return dispatcher.useEffect(create, deps)
}

export const useRef: Dispatcher['useRef'] = (initialValue) => {
  const dispatcher = resolveDispatcher()
  return dispatcher.useRef(initialValue)
}

export const useTransition: Dispatcher['useTransition'] = () => {
  const dispatcher = resolveDispatcher()
  return dispatcher.useTransition()
}

export const useContext: Dispatcher['useContext'] = (context) => {
  const dispatcher = resolveDispatcher()
  return dispatcher.useContext(context)
}

export const use: Dispatcher['use'] = (usable) => {
  const dispatcher = resolveDispatcher()
  return dispatcher.use(usable)
}

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher,
  ReactCurrentBatchConfig,
}

export type { Dispatch, Dispatcher }

export { isValidElement, Fragment, Suspense } from './jsx'
export * from './context'

export const version = '0.0.0'
export const createElement = jsx
