import { useEffect, useState } from "react";
import {
  answerScore,
  questions,
  type Answer,
  type Question,
} from "@components/cra/Questions";
import en from "@locales/en.json";
import nl from "@locales/nl.json";

type Props = {
  lang: "en" | "nl";
};

const STORAGE_KEY = "cra_check_answers";
const answerOptions: Answer[] = ["yes", "partly", "no", "unsure"];

function loadAnswers(): Record<string, Answer> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export default function CraCheck({ lang }: Props) {
  const t = lang === "en" ? en : nl;
  const prefix = lang === "en" ? "" : "/nl";
  const [answers, setAnswers] = useState<Record<string, Answer>>(loadAnswers);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Storage can be unavailable (private mode); the check still works.
    }
  }, [answers]);

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const complete = answeredCount === questions.length;

  const score = questions.reduce(
    (sum, q) => sum + (answers[q.id] ? answerScore[answers[q.id]] : 0),
    0
  );
  const percent = Math.round((score / (questions.length * 2)) * 100);
  const level = percent >= 80 ? "high" : percent >= 50 ? "medium" : "low";

  const gaps = questions.filter(
    (q) => answers[q.id] && answers[q.id] !== "yes"
  );
  const criticalGaps = gaps.filter((q) => q.critical);
  const otherGaps = gaps.filter((q) => !q.critical);

  const renderGap = (q: Question) => (
    <li key={q.id}>
      <span className="cra-gap-area">{q.area[lang]}</span>
      <strong>{q.question[lang]}</strong>
      <p>{q.fix[lang]}</p>
    </li>
  );

  return (
    <div className="cra">
      <style>{`
        .cra-intro {
          color: var(--muted);
          margin: 0 0 2rem;
        }

        .cra-question {
          border: none;
          margin: 0;
          padding: 1.5rem 0;
          border-top: 1px solid var(--border);
        }

        .cra-question legend {
          padding: 0;
          margin-bottom: 1rem;
          line-height: 1.5;
          font-weight: 500;
        }

        .cra-number {
          color: var(--accent);
          font-weight: 700;
          margin-right: 0.5rem;
        }

        .cra-area {
          display: block;
          color: var(--muted);
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .cra-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .cra-options label {
          cursor: pointer;
        }

        .cra-options input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .cra-options span {
          display: inline-block;
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--surface-2);
          font-size: 0.9rem;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .cra-options label:hover span {
          border-color: var(--muted);
        }

        .cra-options input:checked + span {
          background: var(--accent);
          border-color: var(--accent);
          color: #000000;
          font-weight: 600;
        }

        .cra-options input:focus-visible + span {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .cra-progress {
          position: sticky;
          bottom: 1rem;
          margin-top: 1.5rem;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          font-size: 0.9rem;
          color: var(--muted);
        }

        .cra-progress-bar {
          height: 4px;
          margin-top: 0.5rem;
          border-radius: 2px;
          background: var(--surface-2);
          overflow: hidden;
        }

        .cra-progress-bar div {
          height: 100%;
          background: var(--accent);
          transition: width 0.3s ease;
        }

        .cra-result {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }

        .cra-result h2 {
          margin: 0 0 1rem;
        }

        .cra-score {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .cra-score-number {
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: var(--accent);
        }

        .cra-gaps {
          list-style: none;
          margin: 0 0 2rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .cra-gaps li {
          padding: 1.25rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface-2);
        }

        .cra-gaps.critical li {
          border-left: 3px solid var(--accent);
        }

        .cra-gap-area {
          display: block;
          color: var(--muted);
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .cra-gaps p {
          margin: 0.5rem 0 0;
          color: var(--muted);
        }

        .cra-cta {
          margin: 2rem 0 1rem;
          padding: 1.5rem;
          border-radius: 8px;
          background: var(--accent-soft);
        }

        .cra-cta p {
          margin: 0 0 1rem;
        }

        .cra-links {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem 1.5rem;
        }

        .cra-links a:not(.btn) {
          color: var(--accent);
        }

        .cra-reset {
          background: none;
          border: 1px solid var(--border);
          color: var(--text);
        }

        .cra-reset:hover {
          background: var(--surface-2);
        }

        .cra-disclaimer {
          color: var(--muted);
          font-size: 0.85rem;
          margin: 1.5rem 0 0;
        }
      `}</style>

      <p className="cra-intro">{t.cra.intro}</p>

      {questions.map((q, index) => (
        <fieldset className="cra-question" key={q.id}>
          <legend>
            <span className="cra-area">{q.area[lang]}</span>
            <span className="cra-number">{index + 1}.</span>
            {q.question[lang]}
          </legend>
          <div className="cra-options">
            {answerOptions.map((option) => (
              <label key={option}>
                <input
                  type="radio"
                  name={q.id}
                  value={option}
                  checked={answers[q.id] === option}
                  onChange={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: option }))
                  }
                />
                <span>{t.cra.answers[option]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      {!complete && (
        <div className="cra-progress" aria-live="polite">
          {answeredCount} / {questions.length} {t.cra.answered}
          <div className="cra-progress-bar">
            <div
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <section className="cra-result" aria-live="polite">
        <h2>{t.cra.resultHeader}</h2>
        {complete ? (
          <div className="cra-score">
            <span className="cra-score-number">{percent}%</span>
            <strong>{t.cra.levels[level]}</strong>
          </div>
        ) : (
          <p className="cra-intro">{t.cra.resultIncomplete}</p>
        )}

        {criticalGaps.length > 0 && (
          <>
            <h3>{t.cra.criticalGaps}</h3>
            <ul className="cra-gaps critical">{criticalGaps.map(renderGap)}</ul>
          </>
        )}
        {otherGaps.length > 0 && (
          <>
            <h3>{t.cra.otherGaps}</h3>
            <ul className="cra-gaps">{otherGaps.map(renderGap)}</ul>
          </>
        )}
        {complete && gaps.length === 0 && <p>{t.cra.noGaps}</p>}

        <div className="cra-cta">
          <p>{t.cra.ctaText}</p>
          <div className="cra-links">
            <a className="btn" href={`${prefix}/contact`}>
              {t.cra.ctaButton}
            </a>
            <a href={`${prefix}/blog/cra`}>{t.cra.readMore} →</a>
          </div>
        </div>

        {answeredCount > 0 && (
          <button
            type="button"
            className="cra-reset"
            onClick={() => setAnswers({})}
          >
            {t.cra.reset}
          </button>
        )}

        <p className="cra-disclaimer">{t.cra.disclaimer}</p>
      </section>
    </div>
  );
}
