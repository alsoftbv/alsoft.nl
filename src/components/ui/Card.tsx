import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export default function Card({ children, className = "", id }: CardProps) {
  return (
    <>
      <style>{`
        .react-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          border-radius: 8px;
          background: #202020;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .react-card {
            gap: 1rem;
            padding: 1rem;
          }
        }
      `}</style>

      <div className={`react-card ${className}`} id={id}>
        {children}
      </div>
    </>
  );
}
