export function parseMulti(value?: string | string[]) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
  