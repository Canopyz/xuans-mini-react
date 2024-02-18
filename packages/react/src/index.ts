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

export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  currentDispatcher,
}

export type { Dispatch, Dispatcher }

export default {
  version: '0.0.0',
  createElement: jsx,
}
