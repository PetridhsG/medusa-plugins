/* Safely extracts a JS number from Medusa v2 BigNumber objects, strings, or plain numbers. */
/* BigNumber.valueOf() returns the value in major units (e.g. 30.18 for €30.18). */
export function safeNum(val: any): number {
  if (val == null) return 0
  if (typeof val === "number") return isNaN(val) ? 0 : val
  if (typeof val === "string") {
    const n = parseFloat(val)
    return isNaN(n) ? 0 : n
  }
  if (typeof val === "object") {
    const coerced = Number(val)
    if (!isNaN(coerced)) return coerced
    for (const key of ["numeric_value", "value", "numeric"] as const) {
      const raw = (val as any)[key]
      if (raw != null) {
        const m = typeof raw === "number" ? raw : parseFloat(String(raw))
        if (!isNaN(m)) return m
      }
    }
  }
  return 0
}

export function toDateString(dateValue: string | Date): string {
  return new Date(dateValue).toISOString().split("T")[0]
}
