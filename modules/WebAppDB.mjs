import { WebAppBaseClass } from "./../WebAppDBEngine/api/v01/WebAppBaseClass.mjs"
import { sendLoadModuleRequest } from "./../WebAppDBEngine/modules/WebAppDBEngineRequest.mjs"
import { parseWebAppDescriptor } from "./../WebAppDBEngine/modules/WebAppDescriptor.mjs"
import { createBottomNavBar, getFavoritesFromCookie, saveFavoritesToCookie } from "./navBar.mjs"

function getAppId(app) {
  return app.module || app.title || 'app';
}

function dedupeApps(apps) {
  const seenIds = new Set();
  return (Array.isArray(apps) ? apps : []).filter(function (app) {
    const appId = getAppId(app);
    if (seenIds.has(appId)) {
      return false;
    }
    seenIds.add(appId);
    return true;
  });
}

function createAppPage(iContainerDom) {
  const contentDom = document.createElement('div');
  contentDom.className = 'content app_home';
  contentDom.style.overflowY = 'scroll';
  contentDom.style.overflowX = 'hidden';
  contentDom.style.padding = '0px';
  contentDom.style.margin = '0px';

  const heroDom = document.createElement('section');
  heroDom.className = 'hero_panel';
  heroDom.innerHTML = '<div class="hero_text"><h1>Web App DB</h1><p>Launch your favorite web apps in one place with a polished, touch-friendly experience.</p></div>';
  contentDom.appendChild(heroDom);

  const appListDom = document.createElement('div');
  appListDom.className = 'app_list';
  contentDom.appendChild(appListDom);

  const state = {
    activeTab: 'whats_new',
    favorites: getFavoritesFromCookie(),
    searchTerm: '',
    appList: []
  };

  const renderContent = function () {
    appListDom.innerHTML = '';

    if (state.activeTab === 'search') {
      const searchPanel = document.createElement('div');
      searchPanel.className = 'search_panel';
      const searchInput = document.createElement('input');
      searchInput.className = 'search_input';
      searchInput.type = 'search';
      searchInput.placeholder = 'Search apps by name or description';
      searchInput.value = state.searchTerm;
      searchInput.addEventListener('input', function (event) {
        state.searchTerm = event.target.value;
        renderContent();
      });
      searchPanel.appendChild(searchInput);
      appListDom.appendChild(searchPanel);
    }

    const uniqueApps = dedupeApps(state.appList);
    let visibleApps = [];
    if (state.activeTab === 'favorite') {
      visibleApps = uniqueApps.filter(function (app) {
        return state.favorites.includes(getAppId(app));
      });
    } else if (state.activeTab === 'whats_new') {
      visibleApps = uniqueApps.filter(function (app, index) {
        return app.isNew === true || app.new === true || index < 3;
      });
    } else if (state.activeTab === 'search') {
      const query = state.searchTerm.trim().toLowerCase();
      visibleApps = uniqueApps.filter(function (app) {
        if (!query) {
          return true;
        }
        const title = (app.title || '').toLowerCase();
        const description = (app.description || '').toLowerCase();
        return title.includes(query) || description.includes(query);
      });
    } else if (state.activeTab === 'chats') {
      const panel = document.createElement('div');
      panel.className = 'info_panel';
      panel.innerHTML = '<h2>Chats</h2><p class="section_description">Community chat and sharing features are on the way. For now, this tab is a placeholder for future social features.</p>';
      appListDom.appendChild(panel);
      return;
    } else if (state.activeTab === 'info') {
      const panel = document.createElement('div');
      panel.className = 'info_panel';
      panel.innerHTML = '<h2>About WebAppDB</h2><p class="section_description">WebAppDB is a simple launcher for web apps. Use the tabs below to browse new apps, search for something specific, or save a few favorites for quick access.</p>';
      appListDom.appendChild(panel);
      return;
    } else {
      visibleApps = state.appList;
    }

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section_title';
    if (state.activeTab === 'favorite') {
      sectionTitle.innerHTML = '<span>Favorites</span><span class="section_count">' + visibleApps.length + ' saved</span>';
    } else if (state.activeTab === 'whats_new') {
      sectionTitle.innerHTML = '<span>What\'s New</span><span class="section_count">' + visibleApps.length + ' ready</span>';
    } else if (state.activeTab === 'search') {
      sectionTitle.innerHTML = '<span>Search</span><span class="section_count">' + visibleApps.length + ' matches</span>';
    } else {
      sectionTitle.innerHTML = '<span>Explore Apps</span><span class="section_count">' + visibleApps.length + ' available</span>';
    }
    appListDom.appendChild(sectionTitle);

    if (visibleApps.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty_state';
      emptyState.textContent = state.activeTab === 'favorite'
        ? 'No favorites saved yet. Tap the star on any app to save it here.'
        : 'No apps matched your search yet.';
      appListDom.appendChild(emptyState);
      return;
    }

    const appGrid = document.createElement('div');
    appGrid.className = 'app_grid';
    appListDom.appendChild(appGrid);

    visibleApps.forEach(function (app) {
      const appDom = document.createElement('div');
      appDom.className = 'app_label';
      appDom.setAttribute('role', 'button');
      appDom.setAttribute('tabindex', '0');
      appDom.setAttribute('aria-label', 'Launch ' + app.title);

      const webAppDescriptor = parseWebAppDescriptor(app);
      if (!(webAppDescriptor.module.indexOf('://') > 0 || webAppDescriptor.module.indexOf('//') === 0)) {
        webAppDescriptor.module = location.origin + "/" + webAppDescriptor.module;
      }
      if (!(webAppDescriptor.css.indexOf('://') > 0 || webAppDescriptor.css.indexOf('//') === 0)) {
        webAppDescriptor.css = location.origin + "/" + webAppDescriptor.css;
      }

      appDom.addEventListener('click', function () {
        sendLoadModuleRequest(webAppDescriptor);
      });

      appDom.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          sendLoadModuleRequest(webAppDescriptor);
        }
      });

      const iconWrap = document.createElement('div');
      iconWrap.className = 'app_icon_wrap';

      const iconImage = new Image();
      iconImage.src = app.icon;
      iconImage.alt = app.title;
      iconImage.className = 'app_icon';
      iconWrap.appendChild(iconImage);

      const titleDom = document.createElement('div');
      titleDom.innerHTML = app.title;
      titleDom.className = 'app_title';

      const descriptionDom = document.createElement('div');
      descriptionDom.innerHTML = app.description;
      descriptionDom.className = 'app_description';

      const actionDom = document.createElement('div');
      actionDom.className = 'app_action app_action_row';

      const launchText = document.createElement('span');
      launchText.textContent = 'Launch';
      actionDom.appendChild(launchText);

      const isFavorite = state.favorites.includes(getAppId(app));
      const favoriteButton = document.createElement('button');
      favoriteButton.type = 'button';
      favoriteButton.className = 'favorite_button' + (isFavorite ? ' active' : '');
      favoriteButton.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Save to favorites');

      const favoriteCanvas = document.createElement('canvas');
      favoriteCanvas.width = 24;
      favoriteCanvas.height = 24;
      favoriteCanvas.className = 'favorite_canvas';
      drawFavoriteStar(favoriteCanvas, isFavorite ? '#fbbf24' : '#cbd5e1');
      favoriteButton.appendChild(favoriteCanvas);

      favoriteButton.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleFavorite(app, favoriteButton, favoriteCanvas);
      });
      actionDom.appendChild(favoriteButton);

      appDom.appendChild(iconWrap);
      appDom.appendChild(titleDom);
      appDom.appendChild(descriptionDom);
      appDom.appendChild(actionDom);

      appGrid.appendChild(appDom);
    });
  };

  const toggleFavorite = function (app, favoriteButton, favoriteCanvas) {
    const appId = getAppId(app);
    const isSaved = state.favorites.includes(appId);
    state.favorites = isSaved
      ? state.favorites.filter(function (id) { return id !== appId; })
      : state.favorites.concat(appId);
    saveFavoritesToCookie(state.favorites);

    if (favoriteButton) {
      const nextIsSaved = state.favorites.includes(appId);
      favoriteButton.classList.toggle('active', nextIsSaved);
      favoriteButton.setAttribute('aria-label', nextIsSaved ? 'Remove from favorites' : 'Save to favorites');
      if (favoriteCanvas) {
        drawFavoriteStar(favoriteCanvas, nextIsSaved ? '#fbbf24' : '#cbd5e1');
      }
    }

    renderContent();
  };

  const loadAppList = function () {
    fetch('./appList.json')
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        state.appList = dedupeApps(Array.isArray(data) ? data : []);
        renderContent();
      })
      .catch(function () {
        appListDom.innerHTML = '<div class="empty_state">Unable to load the application list right now.</div>';
      });
  };

  loadAppList();

  const navBarDom = createBottomNavBar(function (tabId) {
    state.activeTab = tabId;
    renderContent();
  }, 'whats_new');

  navBarDom.style.height = '64px';
  navBarDom.style.padding = '0px';
  navBarDom.style.margin = '0px';

  iContainerDom.appendChild(contentDom);
  iContainerDom.appendChild(navBarDom);

  iContainerDom.WebAppEngineContentDom = contentDom;
  iContainerDom.WebAppEngineNavBarDom = navBarDom;
}

function drawFavoriteStar(canvas, color) {
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  const size = canvas.width;
  context.clearRect(0, 0, size, size);
  context.save();
  context.translate(size / 2, size / 2);
  context.scale(size / 24, size / 24);

  const outerRadius = 10;
  const innerRadius = 4;
  const spikes = 5;
  const step = Math.PI / spikes;

  context.beginPath();
  for (let index = 0; index < spikes * 2; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = -Math.PI / 2 + index * step;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  }
  context.closePath();

  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = 1.2;
  context.fill();
  context.restore();
}

function disableSelect() {
  const styleElement = document.createElement('style');
  const cssRules = `
    body {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  `;
  styleElement.innerHTML = cssRules;
  document.head.appendChild(styleElement);
}


class WebAppDB extends WebAppBaseClass {

  data = {
    navBarHeight : 64
  }

  constructor() {
    super();
  }
  
  initialize(iContainerDom) {
    createAppPage( iContainerDom);
    disableSelect();
  }

  destroy(iContainerDom) {
  }
  
  resize(iContainerDom) {
    
    if (null != iContainerDom.WebAppEngineContentDom && null != iContainerDom.WebAppEngineNavBarDom) {
      iContainerDom.WebAppEngineContentDom.style.width = "auto";
      iContainerDom.WebAppEngineContentDom.style.height = iContainerDom.clientHeight - this.data.navBarHeight + "px";

      iContainerDom.WebAppEngineNavBarDom.style.width = "auto";
      iContainerDom.WebAppEngineNavBarDom.style.height = this.data.navBarHeight + "px";
    }
  }

/*
  gameLoop(wDt) {
    return true;
  }
  
  render(iDt, iCanvasDom) {
  }
*/

  
}

export function getApp() {
  return new WebAppDB();
}