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
      themeAll: 'All themes',
      sortNewest: 'Newest first',
      sortOldest: 'Oldest first',
    },
    fr: {
      counterNoResults: 'Aucune masterclass ne correspond à vos filtres.',
      counterAll: (total) =>
        `${total} masterclass${total > 1 ? '' : ''} disponibles`,
      counterPartial: (visible, total) =>
        `${visible} masterclass sur ${total} affichées`,
      emptyMessage:
        'Aucune masterclass ne correspond à votre recherche. Modifiez vos filtres ou vos mots-clés.',
      searchPlaceholder: 'Rechercher par titre ou intervenant…',
      themeAll: 'Tous les thèmes',
      sortNewest: 'Du plus récent au plus ancien',
      sortOldest: 'Du plus ancien au plus récent',
    },
  };

  const state = {
    search: '',
    theme: 'all',
    sortOrder: 'newest',
    visibleCount: VISIBLE_BATCH_SIZE,
  };

  const themes = [
    'strategy business',
    'communication',
    'finance',
    'gestion/management',
    'juridique/legal',
    'marketing',
    'production/sourcing',
  ];

  const dropdownControllers = [];

  /** DOM elements */
  const els = {};

  function cacheElements() {
    els.list = document.getElementById('libraryList');
    els.searchInput = document.getElementById('searchInput');
    els.themeDropdown = document.querySelector('[data-dropdown="theme"]');
    els.sortDropdown = document.querySelector('[data-dropdown="sort"]');
    els.showMoreBtn = document.getElementById('showMoreBtn');
    els.counter = document.getElementById('resultsCounter');
    els.emptyState = document.getElementById('noResults');
  }

  function initFilters() {
    initThemeDropdown();
    initSortDropdown();

    if (els.searchInput) {
      els.searchInput.placeholder = STRINGS[LANG].searchPlaceholder;
      els.searchInput.addEventListener('input', handleSearchChange);
    }
    els.showMoreBtn.addEventListener('click', handleShowMore);
  }

  function handleSearchChange(event) {
    state.search = event.target.value.trim().toLowerCase();
    state.visibleCount = VISIBLE_BATCH_SIZE;
    render();
  }

  function handleThemeChange(value) {
    state.theme = value;
    state.visibleCount = VISIBLE_BATCH_SIZE;
    render();
  }

  function handleSortChange(value) {
    state.sortOrder = value;
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

    // LOGOS top right
    if (Array.isArray(item.logos) && item.logos.length > 0) {
      const logosWrapper = document.createElement('div');
      logosWrapper.className = 'library-card_logos';
      item.logos.forEach((logoUrl) => {
        const logo = document.createElement('img');
        logo.src = logoUrl;
        logo.alt = '';
        logo.className = 'library-card_logo';
        logosWrapper.appendChild(logo);
      });
      li.appendChild(logosWrapper);
    }

    const overlay = document.createElement('div');
    overlay.className = 'library-card_overlay';

    const content = document.createElement('div');
    content.className = 'library-card_content';

    const itemThemes = Array.isArray(item.themes)
      ? item.themes
      : item.theme
      ? [item.theme]
      : [];

    const themesWrapper = document.createElement('div');
    themesWrapper.className = 'library-card_themes';

    itemThemes.forEach((themeValue) => {
      const themeTag = document.createElement('span');
      themeTag.className = 'library-card_theme';
      themeTag.textContent = formatThemeLabel(themeValue);
      themesWrapper.appendChild(themeTag);
    });

    const title = document.createElement('h3');
    title.className = 'library-card_title';
    title.textContent = LANG === 'fr' ? item.titleFr : item.titleEn;

    const subtitle = document.createElement('p');
    subtitle.className = 'library-card_subtitle';
    subtitle.textContent = LANG === 'fr' ? item.subtitleFr : item.subtitleEn;

    const meta = document.createElement('div');
    meta.className = 'library-card_meta';
    meta.textContent = formatDate(item.date);

    content.appendChild(themesWrapper);
    content.appendChild(title);
    content.appendChild(subtitle);
    content.appendChild(meta);

    // FOOTER avec boutons Prévisualiser et Télécharger
    const cardFooter = document.createElement('div');
    cardFooter.className = 'library-card_footer';

    // Bouton Prévisualiser
    const previewBtn = document.createElement('a');
    previewBtn.className = 'library-card_btn library-card_btn--preview';
    previewBtn.href = LANG === 'fr' ? item.pdfLinkFr || item.pdfLinkEn || '#' : item.pdfLinkEn || item.pdfLinkFr || '#';
    previewBtn.target = '_blank';
    previewBtn.rel = 'noopener noreferrer';
    previewBtn.textContent = LANG === 'fr' ? 'Prévisualiser' : 'Preview';
    previewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
          event: 'pdf_preview',
          masterclass_id: item.id,
          masterclass_title: LANG === 'fr' ? item.titleFr : item.titleEn,
          masterclass_theme: itemThemes.join(', '),
          pdf_url: previewBtn.href,
          language: LANG
        });
      }
    });

    // Bouton Télécharger
    const downloadBtn = document.createElement('a');
    downloadBtn.className = 'library-card_btn library-card_btn--download';
    downloadBtn.href = LANG === 'fr' ? item.pdfLinkFr || item.pdfLinkEn || '#' : item.pdfLinkEn || item.pdfLinkFr || '#';
    downloadBtn.download = '';
    downloadBtn.textContent = LANG === 'fr' ? 'Télécharger' : 'Download';
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
          event: 'pdf_download',
          pdf_name: downloadBtn.href.split('/').pop(),
          pdf_url: downloadBtn.href,
          masterclass_id: item.id,
          masterclass_title: LANG === 'fr' ? item.titleFr : item.titleEn,
          masterclass_theme: itemThemes.join(', '),
          language: LANG
        });
      }
    });

    cardFooter.appendChild(previewBtn);
    cardFooter.appendChild(downloadBtn);
    content.appendChild(cardFooter);

    // Structure finale de la carte
    const cardWrapper = document.createElement('div');
    cardWrapper.className = 'library-card_wrapper';
    
    cardWrapper.appendChild(overlay);
    cardWrapper.appendChild(content);
    li.appendChild(cardWrapper);

    return li;
  }

  function formatThemeLabel(theme) {
    if (LANG === 'fr') {
      switch (theme) {
        case 'strategy business':
          return 'Stratégie Business';
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
        case 'strategy business':
          return 'Strategy Business';
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
    updateLanguageSwitcher();
  }

  function updateLanguageSwitcher() {
    const switcher = document.getElementById('switch-lang');
    if (!switcher) return;

    const links = switcher.querySelectorAll('.lang_link');
    links.forEach((link) => {
      link.classList.remove('active');
      if ((LANG === 'fr' && link.title === 'fr') || (LANG === 'en' && link.title === 'en')) {
        link.classList.add('active');
      }
    });
  }

  function initThemeDropdown() {
    if (!els.themeDropdown) return;
    const options = [
      { value: 'all', label: STRINGS[LANG].themeAll },
      ...themes.map((theme) => ({
        value: theme,
        label: formatThemeLabel(theme),
      })),
    ];
    setupDropdown(els.themeDropdown, options, state.theme, handleThemeChange);
  }

  function initSortDropdown() {
    if (!els.sortDropdown) return;
    const options = [
      { value: 'newest', label: STRINGS[LANG].sortNewest },
      { value: 'oldest', label: STRINGS[LANG].sortOldest },
    ];
    setupDropdown(els.sortDropdown, options, state.sortOrder, handleSortChange);
  }

  function setupDropdown(element, options, currentValue, onSelect) {
    if (!element) return;
    const trigger = element.querySelector('.library-dropdown_trigger');
    const labelEl = element.querySelector('[data-dropdown-label]');
    const menu = element.querySelector('[data-dropdown-menu]');

    if (!trigger || !labelEl || !menu) return;

    menu.innerHTML = '';

    options.forEach((option) => {
      const item = document.createElement('li');
      item.className = 'library-dropdown_option';
      item.setAttribute('role', 'option');
      item.dataset.value = option.value;
      item.tabIndex = 0;
      item.textContent = option.label;
      if (option.value === currentValue) {
        item.classList.add('is-selected');
        labelEl.textContent = option.label;
      }
      item.addEventListener('click', () => selectOption(option));
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectOption(option);
        }
      });
      menu.appendChild(item);
    });

    if (!labelEl.textContent && options.length) {
      labelEl.textContent =
        options.find((opt) => opt.value === currentValue)?.label ||
        options[0].label;
    }

    function openDropdown() {
      closeAllDropdowns();
      element.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      element.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function selectOption(option) {
      labelEl.textContent = option.label;
      menu.querySelectorAll('.is-selected').forEach((el) => {
        el.classList.remove('is-selected');
      });
      const selectedEl = menu.querySelector(`[data-value="${option.value}"]`);
      if (selectedEl) selectedEl.classList.add('is-selected');
      if (typeof onSelect === 'function') {
        onSelect(option.value);
      }
      closeDropdown();
    }

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (element.classList.contains('is-open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    document.addEventListener('click', (event) => {
      if (!element.contains(event.target)) {
        closeDropdown();
      }
    });

    element.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDropdown();
        trigger.focus();
      }
    });

    dropdownControllers.push({ close: closeDropdown });
  }

  function closeAllDropdowns() {
    dropdownControllers.forEach((controller) => controller.close());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();


