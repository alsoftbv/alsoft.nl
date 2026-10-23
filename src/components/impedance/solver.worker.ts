import { Engine } from "./engine";

const engine = new Engine();
const ready = engine.load();

self.onmessage = async (e: MessageEvent) => {
  const m = e.data;
  try {
    await ready;
    const reply = engine.run(m.req);
    (self as unknown as Worker).postMessage({ id: m.id, ...reply });
  } catch (err) {
    (self as unknown as Worker).postMessage({ id: m.id, error: String(err) });
  }
};
(self as unknown as Worker).postMessage({ id: 0, hello: true });
ready.catch((err) => (self as unknown as Worker).postMessage({ id: -1, error: String(err) }));
