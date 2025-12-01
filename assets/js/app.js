// Core behaviour for the WSN Academy library page

(function () {
  const VISIBLE_BATCH_SIZE = 9;
  const LANG = window.LIBRARY_LANG === 'fr' ? 'fr' : 'en';

  const STRINGS = {
    en: {
      counterNoResults: 'No masterclasses match your filters.',
      counterAll: (total) =>
        `${total} masterclass${total > 1 ? 'es' : ''} available`,
      counterPartial: (visible, total) =>
        `${visible} of ${total} masterclasses shown`,
      emptyMessage:
        'No masterclasses match your search. Try adjusting your filters or keywords.',
      searchPlaceholder: 'Search by title or speakers…',
    },
    fr: {
      counterNoResults: 'Aucune masterclass ne correspond à vos filtres.',
      counterAll: (total) =>
        `${total} masterclass${total > 1 ? 'es' : ''} disponibles`,
      counterPartial: (visible, total) =>
        `${visible} masterclass sur ${total} affichées`,
      emptyMessage:
        'Aucune masterclass ne correspond à votre recherche. Modifiez vos filtres ou vos mots-clés.',
      searchPlaceholder: 'Rechercher par titre ou intervenant…',
    },
  };

  const state = {
    search: '',
    theme: 'all',
    sortOrder: 'newest',
    visibleCount: VISIBLE_BATCH_SIZE,
  };

  const themes = [
    'strategy/business',
    'communication',
    'finance',
    'gestion/management',
    'juridique/legal',
    'marketing',
    'production/sourcing',
  ];

  /** DOM elements */
  const els = {};

  function cacheElements() {
    els.list = document.getElementById('libraryList');
    els.searchInput = document.getElementById('searchInput');
    els.themeFilter = document.getElementById('themeFilter');
    els.sortOrder = document.getElementById('sortOrder');
    els.showMoreBtn = document.getElementById('showMoreBtn');
    els.counter = document.getElementById('resultsCounter');
    els.emptyState = document.getElementById('noResults');
  }

  function initFilters() {
    // Populate theme dropdown
    if (els.themeFilter && els.themeFilter.options.length === 1) {
      themes.forEach((theme) => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = formatThemeLabel(theme);
        els.themeFilter.appendChild(option);
      });
    }

    if (els.searchInput) {
      els.searchInput.placeholder = STRINGS[LANG].searchPlaceholder;
      els.searchInput.addEventListener('input', handleSearchChange);
    }
    els.themeFilter.addEventListener('change', handleThemeChange);
    els.sortOrder.addEventListener('change', handleSortChange);
    els.showMoreBtn.addEventListener('click', handleShowMore);
  }

  function handleSearchChange(event) {
    state.search = event.target.value.trim().toLowerCase();
    state.visibleCount = VISIBLE_BATCH_SIZE;
    render();
  }

  function handleThemeChange(event) {
    state.theme = event.target.value;
    state.visibleCount = VISIBLE_BATCH_SIZE;
    render();
  }

  function handleSortChange(event) {
    state.sortOrder = event.target.value;
    state.visibleCount = VISIBLE_BATCH_SIZE;
    render();
  }

  function handleShowMore() {
    state.visibleCount += VISIBLE_BATCH_SIZE;
    render(true);
  }

  function getFilteredAndSortedItems() {
    const items = window.ACADEMY_ITEMS || [];

    const filtered = items.filter((item) => {
      const itemThemes = Array.isArray(item.themes)
        ? item.themes
        : item.theme
        ? [item.theme]
        : [];

      const matchesTheme =
        state.theme === 'all'
          ? true
          : itemThemes.includes(state.theme);

      if (!matchesTheme) return false;

      if (!state.search) return true;

      const haystack = [
        item.titleEn,
        item.titleFr,
        item.subtitleEn,
        item.subtitleFr,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(state.search);
    });

    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return state.sortOrder === 'newest'
        ? dateB - dateA
        : dateA - dateB;
    });

    return sorted;
  }

  function render(isShowMore = false) {
    const allItems = getFilteredAndSortedItems();
    const total = allItems.length;
    const visibleItems = allItems.slice(0, state.visibleCount);

    updateCounter(visibleItems.length, total);
    updateEmptyState(total === 0);
    updateShowMoreButton(visibleItems.length, total);

    if (!els.list) return;

    if (isShowMore) {
      // On "Show more", keep already-rendered items and only append the new ones
      const alreadyRendered = els.list.children.length;
      const newItems = visibleItems.slice(alreadyRendered);

      newItems.forEach((item, index) => {
        const li = createCardElement(item, index, true);
        els.list.appendChild(li);
      });
    } else {
      // For filters / search / sort, re-render the whole list
      els.list.innerHTML = '';

      visibleItems.forEach((item, index) => {
        const li = createCardElement(item, index, false);
        els.list.appendChild(li);
      });
    }
  }

  function updateCounter(visible, total) {
    if (!els.counter) return;

    if (total === 0) {
      els.counter.textContent = STRINGS[LANG].counterNoResults;
      return;
    }

    if (visible === total) {
      els.counter.textContent = STRINGS[LANG].counterAll(total);
    } else {
      els.counter.textContent = STRINGS[LANG].counterPartial(
        visible,
        total
      );
    }
  }

  function updateEmptyState(isEmpty) {
    if (!els.emptyState) return;
    els.emptyState.textContent = STRINGS[LANG].emptyMessage;
    els.emptyState.style.display = isEmpty ? 'block' : 'none';
  }

  function updateShowMoreButton(visible, total) {
    if (!els.showMoreBtn) return;
    els.showMoreBtn.style.display = visible < total ? 'inline-flex' : 'none';
  }

  function createCardElement(item, index, isShowMore) {
    const li = document.createElement('li');
    li.className = 'library-card';
    li.style.setProperty(
      '--card-bg-image',
      item.imgUrl ? `url("${item.imgUrl}")` : 'none'
    );

    // Fade-in animation with small stagger
    const baseDelay = isShowMore ? 0 : 40; // ms
    const delay = baseDelay + index * 40;
    li.style.animationDelay = `${delay}ms`;

    const link = document.createElement('a');
    link.className = 'library-card_link';
    // Open the PDF directly in a new tab (no explicit download button)
    link.href =
      LANG === 'fr'
        ? item.pdfLinkFr || item.pdfLinkEn || '#'
        : item.pdfLinkEn || item.pdfLinkFr || '#';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const overlay = document.createElement('div');
    overlay.className = 'library-card_overlay';

    const content = document.createElement('div');
    content.className = 'library-card_content';

    const meta = document.createElement('div');
    meta.className = 'library-card_meta';
    meta.textContent = formatDate(item.date);

    const title = document.createElement('h3');
    title.className = 'library-card_title';
    title.textContent = LANG === 'fr' ? item.titleFr : item.titleEn;

    const subtitle = document.createElement('p');
    subtitle.className = 'library-card_subtitle';
    subtitle.textContent =
      LANG === 'fr' ? item.subtitleFr : item.subtitleEn;

    const footer = document.createElement('div');
    footer.className = 'library-card_footer';

    const themesWrapper = document.createElement('div');
    themesWrapper.className = 'library-card_themes';

    const itemThemes = Array.isArray(item.themes)
      ? item.themes
      : item.theme
      ? [item.theme]
      : [];

    itemThemes.forEach((themeValue) => {
      const themeTag = document.createElement('span');
      themeTag.className = 'library-card_theme';
      themeTag.textContent = formatThemeLabel(themeValue);
      themesWrapper.appendChild(themeTag);
    });

    footer.appendChild(themesWrapper);

    content.appendChild(meta);
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(footer);

    link.appendChild(overlay);
    link.appendChild(content);
    li.appendChild(link);

    return li;
  }

  function formatThemeLabel(theme) {
    if (LANG === 'fr') {
      switch (theme) {
        case 'strategy/business':
          return 'Stratégie / Business';
        case 'communication':
          return 'Communication';
        case 'finance':
          return 'Finance';
        case 'gestion/management':
          return 'Gestion / Management';
        case 'juridique/legal':
          return 'Juridique / Legal';
        case 'marketing':
          return 'Marketing';
        case 'production/sourcing':
          return 'Production / Sourcing';
        default:
          return theme;
      }
    } else {
      switch (theme) {
        case 'strategy/business':
          return 'Strategy / Business';
        case 'communication':
          return 'Communication';
        case 'finance':
          return 'Finance';
        case 'gestion/management':
          return 'Management';
        case 'juridique/legal':
          return 'Legal';
        case 'marketing':
          return 'Marketing';
        case 'production/sourcing':
          return 'Production / Sourcing';
        default:
          return theme;
      }
    }
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(
      LANG === 'fr' ? 'fr-FR' : 'en-GB',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );
  }

  function mount() {
    cacheElements();
    if (!els.list) return;
    initFilters();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();


