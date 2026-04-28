import React from 'react';

const SearchFilterBar = ({
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchLabel = 'Search',
  groups = [],
  actions = null,
}) => {
  return (
    <div className="card mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          {title ? <h3>{title}</h3> : null}
          {description ? <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p> : null}
        </div>
        {actions}
      </div>

      {typeof onSearchChange === 'function' ? (
        <div className="mb-4">
          <label className="form-label">{searchLabel}</label>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="mt-2"
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <div key={group.label}>
            <label className="form-label">{group.label}</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.options.map((option) => {
                const isActive = group.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`btn btn-small ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => group.onChange(option.value)}
                    aria-pressed={isActive}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchFilterBar;