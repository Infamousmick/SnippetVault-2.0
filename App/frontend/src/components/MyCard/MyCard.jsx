import "./MyCard.css";

export function MyCard({ className = "", children, ...props }) {
  return (
    <div className={`my-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function MyCardHeader({ className = "", children, ...props }) {
  return (
    <div className={`my-card-header ${className}`} {...props}>
      {children}
    </div>
  );
}

export function MyCardTitle({ className = "", children, ...props }) {
  return (
    <h3 className={`my-card-title ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function MyCardDescription({ className = "", children, ...props }) {
  return (
    <p className={`my-card-description ${className}`} {...props}>
      {children}
    </p>
  );
}

export function MyCardContent({ className = "", children, ...props }) {
  return (
    <div className={`my-card-content ${className}`} {...props}>
      {children}
    </div>
  );
}

export function MyCardFooter({ className = "", children, ...props }) {
  return (
    <div className={`my-card-footer ${className}`} {...props}>
      {children}
    </div>
  );
}
