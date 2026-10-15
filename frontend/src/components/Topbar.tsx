
export default function Topbar() {
  return (
    <header className="topbar">
      <div className="global-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Search inventory, orders..."
          aria-label="Search inventory and orders"
        />
      </div>

      <div className="topbar-actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          ♧
        </button>
        <button className="profile-button" type="button" aria-label="User profile">
          A
        </button>
      </div>
    </header>
  );
}