import { forwardRef, type CSSProperties, type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = "", id, style }, ref) => {
    return (
      <>
        <style>{`
          .react-card {
            gap: 2rem;
            padding: 2rem;
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

        <div
          ref={ref}
          className={`react-card ${className}`}
          id={id}
          style={style}
        >
          {children}
        </div>
      </>
    );
  }
);

export default Card;
