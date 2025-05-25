export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {};

export type LooseIntersection<I, T> = I | (T & {});