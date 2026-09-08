import "./ProductSkeleton.css";

export default function ProductSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-image shimmer" />
          <div className="skeleton-body">
            <div className="skeleton-line shimmer" style={{ width: "40%" }} />
            <div className="skeleton-line shimmer" style={{ width: "80%" }} />
            <div className="skeleton-line shimmer" style={{ width: "50%" }} />
            <div className="skeleton-btn shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
