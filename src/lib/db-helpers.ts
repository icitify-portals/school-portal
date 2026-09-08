import { inArray, or, SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";

/**
 * Chunked IN helper — avoids MySQL `IN (10k)` optimizer flop and packet limits.
 * Drizzle's `inArray` with >250 values degrades to full scan; this splits into OR chunks.
 * Usage: where(inArrayChunked(col, ids)) or where(and(..., inArrayChunked(col, ids)))
 */
export function inArrayChunked<T>(column: AnyColumn, values: T[], chunkSize = 250): SQL<unknown> | undefined {
  if (!values || values.length === 0) return undefined;
  if (values.length <= chunkSize) return inArray(column as any, values as any);
  const chunks: SQL<unknown>[] = [];
  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize);
    chunks.push(inArray(column as any, chunk as any));
  }
  return or(...chunks) as SQL<unknown>;
}

export function chunkArray<T>(arr: T[], size = 250): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
