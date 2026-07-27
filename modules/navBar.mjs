const FAVORITES_COOKIE_NAME = "webappdb_favorites";

export const navBarItems = [
  { id: "favorite", title: "Favorite", icon: "★", description: "Saved apps" },
  { id: "whats_new", title: "What's New", icon: "✨", description: "New apps" },
  { id: "search", title: "Search", icon: "🔍", description: "Find apps" },
  { id: "chats", title: "Chats", icon: "💬", description: "Community" },
  { id: "info", title: "Info Page", icon: "ℹ️", description: "About" },
];

function parseCookieValue(value) {
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function getFavoritesFromCookie() {
  const cookieMatch = document.cookie.split("; ").find(item => item.startsWith(FAVORITES_COOKIE_NAME + "="));
  if (!cookieMatch) return [];
  const rawValue = cookieMatch.substring(cookieMatch.indexOf("=") + 1);
  return parseCookieValue(rawValue);
}

export function saveFavoritesToCookie(favoriteIds = []) {
  const uniqueIds = [...new Set(favoriteIds)];
  const encoded = encodeURIComponent(JSON.stringify(uniqueIds));
  document.cookie = `${FAVORITES_COOKIE_NAME}=${encoded}; path=/; max-age=31536000; SameSite=Lax`;
}

export function setActiveNavTab(navBarDom, activeTab) {
  const buttons = navBarDom.querySelectorAll(".nav_tab");
  buttons.forEach(button => {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  });
}

export function createBottomNavBar(onSelect, activeTab = "whats_new") {
  const navBarDom = document.createElement("div");
  navBarDom.className = "navbar nav_bar";
  const navTabs = document.createElement("div");
  navTabs.className = "nav_tabs";

  navBarItems.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav_tab";
    button.dataset.tab = item.id;
    button.innerHTML = `<span class='nav_tab_icon'>${item.icon}</span><span class='nav_tab_label'>${item.title}</span>`;
    if (item.id === activeTab) {
      button.classList.add("active");
    }
    button.addEventListener("click", () => {
      setActiveNavTab(navBarDom, item.id);
      onSelect(item.id);
    });
    navTabs.appendChild(button);
  });

  navBarDom.appendChild(navTabs);
  return navBarDom;
}
