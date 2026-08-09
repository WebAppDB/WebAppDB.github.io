import { WebAppBaseClass } from "./../WebAppDBEngine/api/v01/WebAppBaseClass.mjs"
import { sendLoadModuleRequest } from "./../WebAppDBEngine/modules/WebAppDBEngineRequest.mjs"
import { parseWebAppDescriptor } from "./../WebAppDBEngine/modules/WebAppDescriptor.mjs"
import { createBottomNavBar, getFavoritesFromCookie, saveFavoritesToCookie } from "./navBar.mjs"

function getAppId(app) {
  return app.module || app.title || 'app';
}

function normalizeHeader(text) {
  return (text || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getFirstMatchingValue(row, aliases) {
  if (!row || !Array.isArray(row.c)) {
    return '';
  }

  const headers = row.c;
  const normalisedAliases = aliases.map(function (alias) {
    return normalizeHeader(alias);
  });

  let foundValue = '';
  headers.forEach(function (headerCell, index) {
    if (foundValue !== '' || !headerCell || headerCell.v === undefined) {
      return;
    }

    const normalizedHeader = normalizeHeader(headerCell.v);
    if (normalisedAliases.indexOf(normalizedHeader) >= 0) {
      foundValue = (row.c[index + 1] && row.c[index + 1].v !== undefined) ? row.c[index + 1].v : '';
    }
  });

  return foundValue;
}

function parseTimestamp(value) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value);
  return isNaN(timestamp.getTime()) ? 0 : timestamp.getTime();
}

function parseAppListFromGoogleSheets(text) {
  try {
    const payloadMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)\s*;?\s*$/);
    const payloadText = payloadMatch ? payloadMatch[1] : text;
    const payload = JSON.parse(payloadText);
    const rows = (payload && payload.table && Array.isArray(payload.table.rows)) ? payload.table.rows : [];
    const columns = (payload && payload.table && Array.isArray(payload.table.cols)) ? payload.table.cols : [];

    if (!rows.length || !columns.length) {
      return [];
    }

    const headers = columns.map(function (column) {
      return column && column.label ? column.label : '';
    });

    return rows.map(function (row) {
      const values = Array.isArray(row && row.c) ? row.c : [];
      const getValue = function (aliases) {
        const aliasList = Array.isArray(aliases) ? aliases : [aliases];
        let value = '';
        headers.forEach(function (header, index) {
          if (value !== '') {
            return;
          }
          const normalizedHeader = normalizeHeader(header);
          if (aliasList.some(function (alias) {
            return normalizeHeader(alias) === normalizedHeader;
          })) {
            const currentCell = values[index];
            value = currentCell && currentCell.v !== undefined ? currentCell.v : '';
          }
        });
        return value;
      };

      const title = (getValue(['title', 'name']) || '').toString().trim();
      const description = (getValue(['description', 'summary', 'shortdescription', 'shortdesc']) || '').toString().trim();
      const longDescription = (getValue(['longdescription', 'longdesc', 'details', 'about', 'longdescriptiontext']) || '').toString().trim();
      const icon = (getValue(['icon', 'image', 'iconurl']) || '').toString().trim();
      const module = (getValue(['module', 'appmodule', 'appurl', 'link', 'moduleurl']) || '').toString().trim();
      const css = (getValue(['css', 'stylesheet', 'style', 'cssurl']) || '').toString().trim();
      const email = (getValue(['email', 'emailaddress', 'submittedby', 'submitteremail', 'author', 'registeredemail']) || '').toString().trim();
      const timestamp = (getValue(['timestamp', 'date', 'created', 'createdat', 'submittedat', 'dateadded']) || '').toString().trim();

      if (!title && !description && !module) {
        return null;
      }

      return {
        title: title || 'Untitled App',
        description: description || 'No description provided yet.',
        longDescription: longDescription || description || 'No detailed description provided yet.',
        icon: icon || './defaultIcon.png',
        module: module || '',
        css: css || '',
        email: email || 'Unknown',
        timestamp: timestamp,
        timestampMs: parseTimestamp(timestamp),
        isNew: true
      };
    }).filter(Boolean);
  } catch (error) {
    return [];
  }
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
    appList: [],
    selectedApp: null
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
      searchInput.addEventListener('change', function (event) {
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
      visibleApps = uniqueApps
        .slice()
        .sort(function (left, right) {
          return (right.timestampMs || 0) - (left.timestampMs || 0);
        })
        .slice(0, 6);
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
      panel.innerHTML = '<h2>About WebAppDB</h2><p class="section_description">WebAppDB is a simple launcher for web apps. Use the tabs below to browse new apps, search for something specific, or save a few favorites for quick access. Anyone can add a new application by implementing a web page using the WebAppDB template at <a href="https://github.com/WebAppDB/WebAppTemplate" target="_blank" rel="noopener noreferrer">https://github.com/WebAppDB/WebAppTemplate</a> and submitting the application through <a href="https://forms.gle/qFCtnZzGApUmEZHf6" target="_blank" rel="noopener noreferrer">this form</a>. For a reference implementation, see the <a href="https://github.com/WebAppDB/WebAppDB.github.io/tree/main/demoApps" target="_blank" rel="noopener noreferrer">demo app source code</a>.</p>';
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
      const isSelected = !!(state.selectedApp && getAppId(state.selectedApp) === getAppId(app));
      const appDom = document.createElement('div');
      appDom.className = 'app_label';
      if (isSelected) {
        appDom.classList.add('selected');
      }
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
        state.selectedApp = isSelected ? null : app;
        renderContent();
      });

      appDom.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          state.selectedApp = isSelected ? null : app;
          renderContent();
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
      descriptionDom.className = 'app_description clamped';

      if (isSelected) {
        descriptionDom.classList.remove('clamped');
        descriptionDom.classList.add('expanded');
      }

      const detailDom = document.createElement('div');
      detailDom.className = 'app_detail';
      if (isSelected) {
        const detailText = document.createElement('p');
        detailText.className = 'app_detail_text';
        detailText.textContent = app.longDescription || app.description || 'No description provided yet.';
        detailDom.appendChild(detailText);

        const detailMeta = document.createElement('div');
        detailMeta.className = 'app_detail_meta';
        detailMeta.textContent = 'Signed by ' + (app.email || 'Unknown');
        detailDom.appendChild(detailMeta);
      }

      const actionDom = document.createElement('div');
      actionDom.className = 'app_action app_action_row';

      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.className = 'app_action_button';
      viewButton.textContent = isSelected ? 'Hide' : 'View';
      viewButton.addEventListener('click', function (event) {
        event.stopPropagation();
        state.selectedApp = isSelected ? null : app;
        renderContent();
      });
      actionDom.appendChild(viewButton);

      const launchButton = document.createElement('button');
      launchButton.type = 'button';
      launchButton.className = 'app_action_button primary';
      launchButton.textContent = 'Launch';
      launchButton.addEventListener('click', function (event) {
        event.stopPropagation();
        launchApp(app);
      });
      actionDom.appendChild(launchButton);

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

      /* More button (hidden by default). Will be shown if description overflows. */
      const moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'more_button';
      moreBtn.textContent = 'More';
      moreBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        const expanded = descriptionDom.classList.toggle('expanded');
        descriptionDom.classList.toggle('clamped', !expanded);
        moreBtn.textContent = expanded ? 'Less' : 'More';
      });
      actionDom.insertBefore(moreBtn, favoriteButton);

      appDom.appendChild(iconWrap);
      appDom.appendChild(titleDom);
      appDom.appendChild(descriptionDom);
      if (isSelected) {
        appDom.appendChild(detailDom);
      }
      appDom.appendChild(actionDom);

      appGrid.appendChild(appDom);

      // After inserted into DOM, check if description actually overflows its clamped box.
      // If so, show the More button; otherwise keep it hidden.
      try {
        if (descriptionDom.scrollHeight > descriptionDom.clientHeight + 1) {
          moreBtn.classList.add('show');
        }
      } catch (e) {
        // ignore measurement errors in some environments
      }
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

  const launchApp = function (app) {
    const webAppDescriptor = parseWebAppDescriptor(app);
    if (!(webAppDescriptor.module.indexOf('://') > 0 || webAppDescriptor.module.indexOf('//') === 0)) {
      webAppDescriptor.module = location.origin + "/" + webAppDescriptor.module;
    }
    if (!(webAppDescriptor.css.indexOf('://') > 0 || webAppDescriptor.css.indexOf('//') === 0)) {
      webAppDescriptor.css = location.origin + "/" + webAppDescriptor.css;
    }
    sendLoadModuleRequest(webAppDescriptor);
  };

  const loadAppList = function () {
    fetch('https://docs.google.com/spreadsheets/d/19-nT1W50rhmR9bMMIoiW7UAgM0jAZKXdZGrXnMk_A5g/gviz/tq?tqx=out:json')
      .then(function (response) {
        return response.text();
      })
      .then(function (text) {
        const sheetApps = parseAppListFromGoogleSheets(text);
        if (sheetApps.length > 0) {
          state.appList = dedupeApps(sheetApps);
        } else {
          return fetch('./appList.json')
            .then(function (fallbackResponse) {
              return fallbackResponse.json();
            })
            .then(function (data) {
              state.appList = dedupeApps(Array.isArray(data) ? data : []);
            });
        }
        renderContent();
      })
      .catch(function () {
        fetch('./appList.json')
          .then(function (fallbackResponse) {
            return fallbackResponse.json();
          })
          .then(function (data) {
            state.appList = dedupeApps(Array.isArray(data) ? data : []);
            renderContent();
          })
          .catch(function () {
            appListDom.innerHTML = '<div class="empty_state">Unable to load the application list right now.</div>';
          });
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