export type Container = any

export const createInstance = (...args: any) => {
  console.log(args)
  return {} as any
}

export const appendInitialChild = (parent: any, child: any) => {
  console.log(parent, child)
  return {} as any
}

export const createTextInstance = (text: string) => {
  console.log(text)
  return {} as any
}
