const compose = (...funcs: any) =>
  funcs.reduce(
    (a: any, b: any) =>
      (...args: any[]) =>
        a(b(...args)),
    (arg: any) => arg
  )

export default compose
