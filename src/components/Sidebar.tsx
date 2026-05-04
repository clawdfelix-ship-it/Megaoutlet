'use client';

interface SidebarProps {
  categories: { name: string; count: number }[];
  origins: { name: string; count: number }[];
  selectedCategory: string;
  selectedOrigin: string;
  onCategoryChange: (cat: string) => void;
  onOriginChange: (origin: string) => void;
  onReset: () => void;
}

export function Sidebar({
  categories,
  origins,
  selectedCategory,
  selectedOrigin,
  onCategoryChange,
  onOriginChange,
  onReset,
}: SidebarProps) {
  return (
    <aside className="w-full lg:w-56 shrink-0">
      <div className="bg-white rounded-xl shadow-sm p-4 sticky top-28">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-dark text-sm">篩選條件</h3>
          {(selectedCategory || selectedOrigin) && (
            <button
              onClick={onReset}
              className="text-xs text-primary hover:underline"
            >
              清除全部
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="filter-section">
          <h4 className="font-medium text-xs text-gray-500 uppercase tracking-wider mb-3">
            商品分類
          </h4>
          <ul className="space-y-1.5">
            <li>
              <button
                onClick={() => onCategoryChange('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedCategory
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                全部商品
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.name}>
                <button
                  onClick={() => onCategoryChange(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-gray-400">{cat.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Origin filter */}
        <div className="filter-section">
          <h4 className="font-medium text-xs text-gray-500 uppercase tracking-wider mb-3">
            產地
          </h4>
          <ul className="space-y-1.5">
            <li>
              <button
                onClick={() => onOriginChange('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedOrigin
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                全部
              </button>
            </li>
            {origins.map((o) => (
              <li key={o.name}>
                <button
                  onClick={() => onOriginChange(o.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                    selectedOrigin === o.name
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{o.name}</span>
                  <span className="text-xs text-gray-400">{o.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
