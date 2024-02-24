import currentDispatcher, {
  Dispatcher,
  Dispatch,
  resolveDispatcher,
} from './currentDispatcher'
import { jsx } from './jsx'

export const useState: Dispatcher['useState'] = (initialState) => {
  const dispatcher = resolveDispatcher()
  return dispatcher.useState(initialState)
}

export const useEffect: Dispatcher['useEffect'] = (create, deps) => {
  const dispatcher = resolveDispatcher()
  return dispatcher.useEffect(create, deps)
}

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher,
}

export type { Dispatch, Dispatcher }

export { isValidElement, Fragment } from './jsx'

export const version = '0.0.0'
export const createElement = jsx
