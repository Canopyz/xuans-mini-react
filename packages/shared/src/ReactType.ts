import { REACT_FRAGMENT_TYPE } from './ReactSymbols'

export type ElementType =
  | string
  | ((props: any) => any)
  | typeof REACT_FRAGMENT_TYPE
  | object
export type Props = { [key: string]: any }
export type Key = string | number | null
export type Ref = { current: any } | ((instance: any) => void)

export interface ReactElementType {
  $$typeof: symbol | number
  type: ElementType
  key: Key
  props: Props
  ref: Ref
}

export type Action<State> = State | ((state: State) => State)

export type ReactContext<T> = {
  $$typeof: symbol | number
  Provider: ReactProviderType<T> | null
  _currentValue: T
}

export type ReactProviderType<T> = {
  $$typeof: symbol | number
  _context: ReactContext<T>
}

export type Usable<T> = Thenable<T> | ReactContext<T>

export type Wakeable<Result> = {
  then(
    onFulfilled: () => Result,
    onRejected: () => Result,
  ): void | Wakeable<Result>
}

export type ThenableImpl<T, Result, Err> = {
  then: (
    onFulfilled: (value: T) => Result,
    onRejected: (error: Err) => Result,
  ) => void | Wakeable<Result>
}

export interface UntrackedThenable<T, Result, Err>
  extends ThenableImpl<T, Result, Err> {
  status?: void
}

export interface PendingThenable<T, Result, Err>
  extends ThenableImpl<T, Result, Err> {
  status: 'pending'
}

export interface FulfilledThenable<T, Result, Err>
  extends ThenableImpl<T, Result, Err> {
  status: 'fulfilled'
  value: T
}

export interface RejectedThenable<T, Result, Err>
  extends ThenableImpl<T, Result, Err> {
  status: 'rejected'
  reason: Err
}

export type Thenable<T, Result = void, Err = any> =
  | UntrackedThenable<T, Result, Err>
  | PendingThenable<T, Result, Err>
  | FulfilledThenable<T, Result, Err>
  | RejectedThenable<T, Result, Err>
