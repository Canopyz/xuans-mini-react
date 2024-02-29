import { ReactContext } from '@xuans-mini-react/shared'

const prevContextValueStack: any[] = []

export function pushProvider<T>(context: ReactContext<T>, newValue: T) {
  prevContextValueStack.push(context._currentValue)
  context._currentValue = newValue
}

export function popProvider<T>(context: ReactContext<T>) {
  context._currentValue = prevContextValueStack.pop()
}
