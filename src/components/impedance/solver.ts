// The page's handle on the solver: a Web Worker when there is one (the page stays responsive during a solve),
// the same engine on the page otherwise. Requests wait in two slots, the newest of each kind replacing an older one
// that has not started, and the main answer goes before the loss.
import { Engine, type Reply } from "./engine";

export type Slot = "main" | "loss";
type Job = { req: Record<string, unknown>; resolve: (r: Reply | null) => void; reject: (e: Error) => void };

export class Solver {
  private worker: Worker | null = null;
  private engine: Engine | null = null;
  private pending: Record<Slot, Job | null> = { main: null, loss: null };
  private busy = false;
  private nextId = 1;
  private inflight = new Map<number, { resolve: (r: Reply) => void; reject: (e: Error) => void }>();
  ready: Promise<void>;

  constructor() {
    this.ready = this.start();
  }

  private async start() {
    if (typeof Worker !== "undefined") {
      try {
        const worker = new Worker(new URL("./solver.worker.ts", import.meta.url), { type: "module" });
        this.worker = worker;
        await new Promise<void>((resolve, reject) => {
          worker.onerror = (e) => reject(new Error(e.message || "worker failed"));
          worker.onmessage = (e) => {
            const m = e.data;
            if (m.id === 0) return resolve();
            if (m.id === -1) return reject(new Error(m.error));
            const job = this.inflight.get(m.id);
            if (!job) return;
            this.inflight.delete(m.id);
            if (m.error) job.reject(new Error(m.error));
            else job.resolve({ out: m.out, ms: m.ms });
          };
        });
        // the worker said hello, and loads the module itself: ask for a trivial solve to know it works
        await this.call({ op: "analyze", kind: "microstrip", w: 0.3, h: 0.2, er: 4.4, t: 0.035, mesh: 1 });
        return;
      } catch {
        this.worker?.terminate();
        this.worker = null;
      }
    }
    this.engine = new Engine();
    await this.engine.load();
  }

  private call(req: Record<string, unknown>): Promise<Reply> {
    if (this.worker) {
      const id = this.nextId++;
      return new Promise((resolve, reject) => {
        this.inflight.set(id, { resolve, reject });
        this.worker!.postMessage({ id, req });
      });
    }
    // on the page: let the browser paint the "solving" state first
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        try {
          resolve(this.engine!.run(req));
        } catch (e) {
          reject(e as Error);
        }
      }, 0)
    );
  }

  /** Runs a request; resolves null when a newer one of the same slot replaced it. */
  run(req: Record<string, unknown>, slot: Slot = "main"): Promise<Reply | null> {
    return new Promise((resolve, reject) => {
      this.pending[slot]?.resolve(null);
      this.pending[slot] = { req, resolve, reject };
      this.pump();
    });
  }

  private async pump() {
    if (this.busy) return;
    const slot: Slot | null = this.pending.main ? "main" : this.pending.loss ? "loss" : null;
    if (!slot) return;
    const job = this.pending[slot] as Job;
    this.pending[slot] = null;
    this.busy = true;
    try {
      job.resolve(await this.call(job.req));
    } catch (e) {
      job.reject(e as Error);
    }
    this.busy = false;
    this.pump();
  }

  dispose() {
    this.worker?.terminate();
    this.pending.main?.resolve(null);
    this.pending.loss?.resolve(null);
  }
}
