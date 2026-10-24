import "./FilterBar.css";

const FilterBar = ({ filters, activeFilter, onFilterChange, toggles = [] }) => {
  return (
    <div className="filters-container">
      {filters.map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <button
            key={filter}
            type="button"
            className={`filter-pill ${isActive ? "active" : ""}`}
            onClick={() => onFilterChange(filter)}
          >
            {filter}
          </button>
        );
      })}

      {toggles.length > 0 && (
        <div className="ms-auto d-flex align-items-center gap-2">
          {toggles.map(
            ({ key, label, icon: Icon, active, className = "", onClick }) => (
              <button
                key={key}
                type="button"
                className={[
                  "btn-toggle",
                  className,
                  "d-flex",
                  "align-items-center",
                  "gap-2",
                  active ? "active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={onClick}
              >
                {Icon && (
                  <Icon size={16} className={active ? "fill-current" : ""} />
                )}
                {label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
