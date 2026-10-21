import { useMemo, useRef, useState, type DragEvent } from "react";
import {
  exampleSbom,
  parseSbom,
  type Component,
  type Sbom,
} from "@components/sbom/Parse";
import en from "@locales/en.json";
import nl from "@locales/nl.json";

type Props = {
  lang: "en" | "nl";
};

type Gap = "missingVersion" | "missingLicense" | "missingSupplier" | "missingPurl";

const gapChecks: Record<Gap, (c: Component) => boolean> = {
  missingVersion: (c) => !c.version,
  missingLicense: (c) => c.licenses.length === 0,
  missingSupplier: (c) => !c.supplier,
  missingPurl: (c) => !c.purl,
};

const gapKeys = Object.keys(gapChecks) as Gap[];

export default function SbomViewer({ lang }: Props) {
  const t = lang === "en" ? en : nl;
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [sbom, setSbom] = useState<Sbom | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [dragging, setDragging] = useState(false);

  const open = (content: string) => {
    const result = parseSbom(content);
    if (result === "parse" || result === "format") {
      setSbom(null);
      setError(result === "parse" ? t.sbom.errorParse : t.sbom.errorFormat);
      return;
    }
    setError("");
    setSbom(result);
  };

  const openFile = async (file?: File) => {
    if (!file) {
      return;
    }
    const content = await file.text();
    setText(content);
    open(content);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    openFile(e.dataTransfer.files[0]);
  };

  const clear = () => {
    setText("");
    setSbom(null);
    setError("");
    setSearch("");
  };

  const stats = useMemo(() => {
    if (!sbom) {
      return null;
    }

    const licenseCounts = new Map<string, number>();
    for (const c of sbom.components) {
      for (const license of c.licenses) {
        licenseCounts.set(license, (licenseCounts.get(license) ?? 0) + 1);
      }
    }

    return {
      gaps: Object.fromEntries(
        gapKeys.map((key) => [
          key,
          sbom.components.filter(gapChecks[key]).length,
        ])
      ) as Record<Gap, number>,
      licenses: [...licenseCounts.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [sbom]);

  const rows = useMemo(() => {
    if (!sbom) {
      return [];
    }
    const query = search.trim().toLowerCase();

    return sbom.components.filter((c) => {
      const matches =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.purl?.toLowerCase().includes(query) ||
        c.licenses.some((l) => l.toLowerCase().includes(query));
      const hasGap = gapKeys.some((key) => gapChecks[key](c));
      return matches && (!onlyIssues || hasGap);
    });
  }, [sbom, search, onlyIssues]);

  return (
    <div className="sbom">
      <style>{`
        .sbom-intro {
          color: var(--muted);
          margin: 0 0 1.5rem;
        }

        .sbom-drop {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 7rem;
          padding: 1.5rem;
          border: 2px dashed var(--border);
          border-radius: 8px;
          background: var(--surface-2);
          color: var(--muted);
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .sbom-drop:hover,
        .sbom-drop.dragging {
          border-color: var(--accent);
          color: var(--text);
        }

        .sbom-drop input {
          display: none;
        }

        .sbom-paste {
          display: block;
          margin: 1.5rem 0 0.5rem;
          font-weight: 600;
        }

        .sbom textarea {
          width: 100%;
          min-height: 8rem;
          box-sizing: border-box;
          font-family: monospace;
          font-size: 0.85rem;
        }

        .sbom-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }

        .sbom-secondary {
          background: none;
          border: 1px solid var(--border);
          color: var(--text);
        }

        .sbom-secondary:hover {
          background: var(--surface-2);
        }

        .sbom-error {
          margin: 1rem 0 0;
          color: #ff6b6b;
        }

        .sbom-summary {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }

        .sbom-format {
          color: var(--muted);
          margin: 0 0 1.25rem;
        }

        .sbom-tiles {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.75rem;
        }

        .sbom-tile {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface-2);
        }

        .sbom-tile strong {
          display: block;
          font-size: 1.75rem;
          letter-spacing: -0.02em;
        }

        .sbom-tile span {
          color: var(--muted);
          font-size: 0.85rem;
        }

        .sbom-tile.warn strong {
          color: var(--accent);
        }

        .sbom-hint {
          color: var(--muted);
          font-size: 0.9rem;
          margin: 1rem 0 0;
        }

        .sbom h3 {
          margin: 2rem 0 0.75rem;
        }

        .sbom-licenses {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .sbom-licenses li {
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          font-size: 0.85rem;
        }

        .sbom-filter {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .sbom-filter input[type="search"] {
          flex: 1 1 240px;
        }

        .sbom-filter label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .sbom-table {
          overflow-x: auto;
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .sbom table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .sbom th,
        .sbom td {
          padding: 0.6rem 0.9rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
          vertical-align: top;
        }

        .sbom th {
          background: var(--surface-2);
          color: var(--muted);
          font-weight: 600;
          white-space: nowrap;
        }

        .sbom tr:last-child td {
          border-bottom: none;
        }

        .sbom-purl {
          display: block;
          color: var(--muted);
          font-family: monospace;
          font-size: 0.8rem;
          word-break: break-all;
        }

        .sbom-missing {
          color: var(--accent);
        }
      `}</style>

      <p className="sbom-intro">{t.sbom.intro}</p>

      <div
        className={`sbom-drop ${dragging ? "dragging" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => fileInput.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInput.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {t.sbom.drop}
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          onChange={(e) => openFile(e.target.files?.[0])}
        />
      </div>

      <label className="sbom-paste" htmlFor="sbom-text">
        {t.sbom.paste}
      </label>
      <textarea
        id="sbom-text"
        value={text}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="sbom-actions">
        <button type="button" onClick={() => open(text)} disabled={!text}>
          {t.sbom.load}
        </button>
        <button
          type="button"
          className="sbom-secondary"
          onClick={() => {
            setText(exampleSbom);
            open(exampleSbom);
          }}
        >
          {t.sbom.example}
        </button>
        {(text || sbom) && (
          <button type="button" className="sbom-secondary" onClick={clear}>
            {t.sbom.clear}
          </button>
        )}
      </div>
      {error && (
        <p className="sbom-error" role="alert">
          {error}
        </p>
      )}

      {sbom && stats && (
        <section className="sbom-summary" aria-live="polite">
          <p className="sbom-format">
            {sbom.format}
            {sbom.name && ` · ${sbom.name}`}
          </p>
          <div className="sbom-tiles">
            <div className="sbom-tile">
              <strong>{sbom.components.length}</strong>
              <span>{t.sbom.components}</span>
            </div>
            <div className="sbom-tile">
              <strong>{stats.licenses.length}</strong>
              <span>{t.sbom.licenses}</span>
            </div>
            {gapKeys.map((key) => (
              <div
                key={key}
                className={`sbom-tile ${stats.gaps[key] > 0 ? "warn" : ""}`}
              >
                <strong>{stats.gaps[key]}</strong>
                <span>{t.sbom[key]}</span>
              </div>
            ))}
          </div>
          {(stats.gaps.missingPurl > 0 || stats.gaps.missingVersion > 0) && (
            <p className="sbom-hint">{t.sbom.hint}</p>
          )}

          {stats.licenses.length > 0 && (
            <>
              <h3>{t.sbom.licenseBreakdown}</h3>
              <ul className="sbom-licenses">
                {stats.licenses.map(([license, count]) => (
                  <li key={license}>
                    {license} · {count}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3>{t.sbom.components}</h3>
          <div className="sbom-filter">
            <input
              type="search"
              placeholder={t.sbom.search}
              aria-label={t.sbom.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <label>
              <input
                type="checkbox"
                checked={onlyIssues}
                onChange={(e) => setOnlyIssues(e.target.checked)}
              />
              {t.sbom.onlyIssues}
            </label>
          </div>
          <div className="sbom-table">
            <table>
              <thead>
                <tr>
                  <th>{t.sbom.name}</th>
                  <th>{t.sbom.version}</th>
                  <th>{t.sbom.license}</th>
                  <th>{t.sbom.supplier}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c, index) => (
                  <tr key={`${c.name}-${index}`}>
                    <td>
                      {c.name}
                      {c.purl ? (
                        <span className="sbom-purl">{c.purl}</span>
                      ) : (
                        <span className="sbom-purl sbom-missing">
                          {t.sbom.missingPurl}
                        </span>
                      )}
                    </td>
                    <td className={c.version ? "" : "sbom-missing"}>
                      {c.version ?? t.sbom.missing}
                    </td>
                    <td className={c.licenses.length ? "" : "sbom-missing"}>
                      {c.licenses.join(", ") || t.sbom.missing}
                    </td>
                    <td className={c.supplier ? "" : "sbom-missing"}>
                      {c.supplier ?? t.sbom.missing}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
