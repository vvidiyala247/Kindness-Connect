import { vi } from "vitest";

type Row = Record<string, unknown>;

const queue: Row[][] = [];

export function pushDbResults(...results: Row[][]): void {
  queue.push(...results);
}

export function clearDbQueue(): void {
  queue.length = 0;
}

interface Chain extends Promise<Row[]> {
  from(table: unknown): Chain;
  where(cond?: unknown): Chain;
  innerJoin(table: unknown, on: unknown): Chain;
  orderBy(...args: unknown[]): Chain;
  limit(n: number): Chain;
  offset(n: number): Chain;
  values(vals: unknown): Chain;
  returning(): Chain;
  set(vals: unknown): Chain;
}

function makeChain(): Chain {
  const resolveValue: Row[] = queue.shift() ?? [];
  const methods: Array<keyof Chain> = [
    "from",
    "where",
    "innerJoin",
    "orderBy",
    "limit",
    "offset",
    "values",
    "returning",
    "set",
  ];
  const chain = {
    then(resolve: (v: Row[]) => unknown, reject?: (e: unknown) => unknown) {
      return Promise.resolve(resolveValue).then(resolve, reject);
    },
    catch(onRej: (e: unknown) => unknown) {
      return Promise.resolve(resolveValue).catch(onRej);
    },
    finally(fn: () => void) {
      return Promise.resolve(resolveValue).finally(fn);
    },
  } as Chain;
  for (const m of methods) {
    (chain as Record<string, unknown>)[m] = vi.fn(() => chain);
  }
  return chain;
}

interface MockTx {
  select(): Chain;
  insert(table: unknown): Chain;
  update(table: unknown): Chain;
  delete(table: unknown): Chain;
}

function makeTx(): MockTx {
  return {
    select: vi.fn(() => makeChain()),
    insert: vi.fn(() => makeChain()),
    update: vi.fn(() => makeChain()),
    delete: vi.fn(() => makeChain()),
  };
}

export const mockDb = {
  select: vi.fn(() => makeChain()),
  insert: vi.fn(() => makeChain()),
  update: vi.fn(() => makeChain()),
  delete: vi.fn(() => makeChain()),
  transaction: vi.fn(async (fn: (tx: MockTx) => Promise<unknown>) => fn(makeTx())),
};

export const DB_MODULE_MOCK = {
  db: mockDb,
  schoolsTable: {},
  usersTable: {},
  postsTable: {},
  commentsTable: {},
  kindnessScoresTable: {},
  reportsTable: {},
  giftsTable: {},
};
