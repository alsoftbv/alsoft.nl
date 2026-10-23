// The WebAssembly field solver: loads the module and runs one JSON request. Used by the worker, and on the page itself when workers are not available.

export const WASM_URL = "/wasm/bk-em.wasm?v=1";

interface Exports {
  memory: WebAssembly.Memory;
  bk_alloc(n: number): number;
  bk_free(p: number, n: number): void;
  bk_run(p: number, n: number): number;
  bk_result_len(): number;
}

export interface Reply {
  out: Record<string, any>;
  ms: number;
}

export class Engine {
  private x: Exports | null = null;
  private enc = new TextEncoder();
  private dec = new TextDecoder();

  async load(url: string = WASM_URL) {
    if (typeof WebAssembly === "undefined") throw new Error("WebAssembly is not available");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`could not load the solver (${res.status})`);
    const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), {});
    this.x = instance.exports as unknown as Exports;
  }

  run(req: Record<string, unknown>): Reply {
    const x = this.x;
    if (!x) throw new Error("the solver is not loaded");
    const t0 = performance.now();
    const bytes = this.enc.encode(JSON.stringify(req));
    const p = x.bk_alloc(bytes.length);
    new Uint8Array(x.memory.buffer, p, bytes.length).set(bytes);
    const q = x.bk_run(p, bytes.length);
    const text = this.dec.decode(new Uint8Array(x.memory.buffer, q, x.bk_result_len()).slice());
    x.bk_free(p, bytes.length);
    return { out: JSON.parse(text), ms: performance.now() - t0 };
  }
}
