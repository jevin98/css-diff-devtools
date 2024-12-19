export function filterJoin(...arg: Array<any>) {
  return arg.filter(Boolean).join(' $$ ')
}
