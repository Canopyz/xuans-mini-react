export type Flags = number

export const NoFlags = 1
export const Placement = NoFlags << 1
export const Update = NoFlags << 2
export const ChildDeleted = NoFlags << 3
