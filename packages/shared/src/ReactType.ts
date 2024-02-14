export type Type = string | ((props: any) => any)
export type Props = { [key: string]: any }
export type Key = string | number | null
export type Ref = any

export interface ReactElementType {
  $$typeof: symbol | number
  type: Type
  key: Key
  props: Props
  ref: Ref
}
