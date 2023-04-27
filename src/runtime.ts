export interface Constructable {
  new (...args: any[]): any;
}

export function Component(...options: any) {
  return function (constructable: Constructable, otro?: any) {};
}
