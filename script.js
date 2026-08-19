(() => {
  "use strict";

  /* =========================================================
     KIO-LOVE — SCRIPT
     ========================================================= */

  const STORAGE_KEY = "kio-love-v1";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const state = {
    profiles: [],
    favorites: [],
    history: [],
    currentProfileId: null,
    lastAction: null,
    search: "",
    sort: "recent"
  };

  let toastTimer = null;


  /* =========================================================
     HELPERS
     ========================================================= */

  function createId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2)
    );
  }


  function normalizeUsername(value) {
    if (!value) return null;

    let text = String(value).trim();

    if (!text) return null;

    text = text.replace(/^https?:\/\//i, "");
    text = text.replace(/^www\./i, "");
    text = text.replace(/^m\./i, "");

    if (text.toLowerCase().startsWith("instagram.com/")) {
      text = text.slice("instagram.com/".length);
    }

    text = text.split(/[?#/]/)[0];

    text = text.replace(/^@+/, "");
    text = text.trim();

    if (!text) return null;

    if (text.length > 30) return null;

    if (!/^[a-zA-Z0-9._]+$/.test(text)) {
      return null;
    }

    if (
      text.startsWith(".") ||
      text.endsWith(".") ||
      text.includes("..")
    ) {
      return null;
    }

    const reserved = new Set([
      "accounts",
      "about",
      "developer",
      "directory",
      "explore",
      "legal",
      "privacy",
      "reels",
      "stories",
      "web",
      "p"
    ]);

    if (reserved.has(text.toLowerCase())) {
      return null;
    }

    return text;
  }


  function parseProfiles(text) {
    return String(text || "")
      .split(/[\s,;\n\r\t]+/)
      .map(normalizeUsername)
      .filter(Boolean);
  }


  function hashString(text) {
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
      hash =
        text.charCodeAt(i) +
        ((hash << 5) - hash);

      hash |= 0;
    }

    return Math.abs(hash);
  }


  function getColors(username) {
    const palettes = [
      ["#ff5bbd", "#8b5cff"],
      ["#ff9ad5", "#ff4f88"],
      ["#c6a4ff", "#ff51ad"],
      ["#ff7ec8", "#7b61ff"],
      ["#ff4fa3", "#ffc3e1"],
      ["#d879ff", "#ff4597"],
      ["#ffb2dc", "#b05cff"],
      ["#fe75b9", "#ef8cff"]
    ];

    return palettes[
      hashString(username) %
      palettes.length
    ];
  }


  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }


  /* =========================================================
     STORAGE
     ========================================================= */

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
    } catch (error) {
      console.error(
        "KIO save error:",
        error
      );
    }
  }


  function loadState() {
    try {
      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) return;

      const saved =
        JSON.parse(raw);

      if (
        saved &&
        Array.isArray(saved.profiles)
      ) {
        state.profiles =
          saved.profiles;
      }

      if (
        saved &&
        Array.isArray(saved.favorites)
      ) {
        state.favorites =
          saved.favorites;
      }

      if (
        saved &&
        Array.isArray(saved.history)
      ) {
        state.history =
          saved.history;
      }

      if (
        typeof saved.sort === "string"
      ) {
        state.sort =
          saved.sort;
      }

    } catch (error) {
      console.error(
        "KIO load error:",
        error
      );
    }
  }


  /* =========================================================
     VIEWS
     ========================================================= */

  function showView(viewName) {
    const target =
      document.getElementById(
        viewName
      );

    if (!target) {
      console.error(
        `View missing: ${viewName}`
      );

      return;
    }

    $$(".screen").forEach(
      (screen) => {
        screen.classList.add(
          "hidden"
        );
      }
    );

    target.classList.remove(
      "hidden"
    );

    const bottomNav =
      $("#bottomNav");

    if (bottomNav) {
      if (
        viewName === "onboarding"
      ) {
        bottomNav.classList.add(
          "hidden"
        );
      } else {
        bottomNav.classList.remove(
          "hidden"
        );
      }
    }

    $$(".nav-item").forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.view ===
            viewName
        );
      }
    );

    closeMenu();

    renderCurrentView();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  /* =========================================================
     ADD PROFILES
     ========================================================= */

  function addProfiles() {
    const input =
      $("#profileInput");

    if (!input) return;

    const usernames =
      parseProfiles(input.value);

    if (!usernames.length) {
      showToast(
        "Ajoute au moins un @username valide."
      );

      return;
    }

    const existing =
      new Set(
        state.profiles.map(
          (profile) =>
            profile.username.toLowerCase()
        )
      );

    const addedIds = [];

    usernames.forEach(
      (username) => {
        const key =
          username.toLowerCase();

        if (existing.has(key)) {
          return;
        }

        const profile = {
          id: createId(),
          username,
          createdAt:
            Date.now(),
          viewedAt: null
        };

        state.profiles.unshift(
          profile
        );

        addedIds.push(
          profile.id
        );

        existing.add(key);
      }
    );

    if (!addedIds.length) {
      showToast(
        "Ces profils sont déjà dans le radar."
      );

      return;
    }

    state.lastAction = {
      type: "add",
      ids: addedIds
    };

    input.value = "";

    saveState();
    renderAll();

    showToast(
      `${addedIds.length} profil${addedIds.length > 1 ? "s" : ""} ajouté${addedIds.length > 1 ? "s" : ""} ✦`
    );
  }


  /* =========================================================
     FAVORITES
     ========================================================= */

  function toggleFavorite(id) {
    const exists =
      state.favorites.includes(id);

    state.lastAction = {
      type: "favorite",
      id,
      wasFavorite: exists
    };

    if (exists) {
      state.favorites =
        state.favorites.filter(
          (favoriteId) =>
            favoriteId !== id
        );
    } else {
      state.favorites.unshift(
        id
      );
    }

    saveState();
    renderAll();

    showToast(
      exists
        ? "Retiré des favoris"
        : "Ajouté aux favoris ★"
    );
  }


  /* =========================================================
     HISTORY
     ========================================================= */

  function markViewed(id) {
    const profile =
      state.profiles.find(
        (item) =>
          item.id === id
      );

    if (!profile) return;

    if (!profile.viewedAt) {
      state.lastAction = {
        type: "view",
        id
      };

      profile.viewedAt =
        Date.now();
    }

    state.history =
      state.history.filter(
        (historyId) =>
          historyId !== id
      );

    state.history.unshift(id);

    saveState();
    renderAll();
  }


  function restoreProfile(id) {
    const profile =
      state.profiles.find(
        (item) =>
          item.id === id
      );

    if (!profile) return;

    profile.viewedAt = null;

    state.history =
      state.history.filter(
        (historyId) =>
          historyId !== id
      );

    saveState();
    renderAll();

    showToast(
      "Profil remis dans le radar ✦"
    );
  }


  /* =========================================================
     OPEN INSTAGRAM
     ========================================================= */

  function openInstagram(id) {
    const profile =
      state.profiles.find(
        (item) =>
          item.id === id
      );

    if (!profile) return;

    markViewed(id);

    const url =
      `https://www.instagram.com/${encodeURIComponent(profile.username)}/`;

    const link =
      document.createElement("a");

    link.href = url;
    link.target = "_blank";
    link.rel =
      "noopener noreferrer";

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();
  }


  /* =========================================================
     DETAIL
     ========================================================= */

  function openDetail(id) {
    state.currentProfileId = id;

    renderDetail();

    showView("detail");
  }


  function renderDetail() {
    const container =
      $("#detailCard");

    if (!container) return;

    const profile =
      state.profiles.find(
        (item) =>
          item.id ===
          state.currentProfileId
      );

    if (!profile) {
      container.innerHTML = "";
      return;
    }

    const favorite =
      state.favorites.includes(
        profile.id
      );

    const viewed =
      Boolean(profile.viewedAt);

    const [c1, c2] =
      getColors(
        profile.username
      );

    container.innerHTML = `
      <div
        class="detail-visual"
        style="--c1:${c1}; --c2:${c2};"
      >

        <div class="detail-content">

          <span class="kicker">
            ${viewed ? "VIEWED SIGNAL" : "LIVE SIGNAL"}
          </span>

          <h2 class="detail-username">
            @${escapeHTML(profile.username)}
          </h2>

          <p class="detail-meta">
            ${viewed
              ? "Ce profil est dans ton historique."
              : "Ce profil n'a pas encore été consulté."
            }
          </p>

          <div class="detail-actions">

            <button
              id="openIg"
              class="primary-btn"
              type="button"
            >
              OPEN INSTAGRAM
            </button>

            <button
              id="detailFav"
              class="secondary-btn"
              type="button"
            >
              ${favorite
                ? "★ SAVED"
                : "☆ SAVE"
              }
            </button>

          </div>

          ${
            viewed
              ? `
                <button
                  id="restoreBtn"
                  class="secondary-btn full-width"
                  type="button"
                >
                  ↶ RESTORE TO RADAR
                </button>
              `
              : `
                <button
                  id="markSeenBtn"
                  class="secondary-btn full-width"
                  type="button"
                >
                  MARK AS VIEWED
                </button>
              `
          }

        </div>

      </div>
    `;

    $("#openIg")?.addEventListener(
      "click",
      () =>
        openInstagram(
          profile.id
        )
    );

    $("#detailFav")?.addEventListener(
      "click",
      () =>
        toggleFavorite(
          profile.id
        )
    );

    $("#restoreBtn")?.addEventListener(
      "click",
      () => {
        restoreProfile(
          profile.id
        );

        renderDetail();
      }
    );

    $("#markSeenBtn")?.addEventListener(
      "click",
      () => {
        markViewed(
          profile.id
        );

        renderDetail();

        showToast(
          "Ajouté à l'historique"
        );
      }
    );
  }


  /* =========================================================
     FILTERING
     ========================================================= */

  function getRadarProfiles() {
    let profiles =
      state.profiles.filter(
        (profile) =>
          !profile.viewedAt
      );

    const search =
      state.search
        .trim()
        .toLowerCase();

    if (search) {
      profiles =
        profiles.filter(
          (profile) =>
            profile.username
              .toLowerCase()
              .includes(search)
        );
    }

    switch (state.sort) {
      case "alpha":
        profiles.sort(
          (a, b) =>
            a.username.localeCompare(
              b.username
            )
        );

        break;

      case "favorites":
        profiles =
          profiles.filter(
            (profile) =>
              state.favorites.includes(
                profile.id
              )
          );

        break;

      case "unseen":
        break;

      case "recent":
      default:
        profiles.sort(
          (a, b) =>
            b.createdAt -
            a.createdAt
        );
    }

    return profiles;
  }


  /* =========================================================
     PROFILE CARDS
     ========================================================= */

  function createProfileCard(profile) {
    const card =
      document.createElement(
        "article"
      );

    card.className =
      "profile-card";

    const favorite =
      state.favorites.includes(
        profile.id
      );

    const viewed =
      Boolean(profile.viewedAt);

    const [c1, c2] =
      getColors(
        profile.username
      );

    card.innerHTML = `
      <button
        class="profile-open"
        type="button"
        aria-label="Ouvrir @${escapeHTML(profile.username)}"
      >

        <div
          class="profile-bg"
          style="--c1:${c1}; --c2:${c2};"
        ></div>

        <div class="profile-noise"></div>

        <span class="status-chip">
          ${viewed
            ? "VIEWED"
            : "NEW SIGNAL"
          }
        </span>

        <div class="profile-info">
          <strong>
            @${escapeHTML(profile.username)}
          </strong>

          <small>
            ${viewed
              ? "IN HISTORY"
              : "INSTAGRAM PROFILE"
            }
          </small>
        </div>

      </button>

      <button
        class="star ${favorite ? "saved" : ""}"
        type="button"
        aria-label="Favori"
      >
        ${favorite ? "★" : "☆"}
      </button>
    `;

    card
      .querySelector(
        ".profile-open"
      )
      .addEventListener(
        "click",
        () =>
          openDetail(
            profile.id
          )
      );

    card
      .querySelector(".star")
      .addEventListener(
        "click",
        () =>
          toggleFavorite(
            profile.id
          )
      );

    return card;
  }


  function renderGrid(
    element,
    profiles
  ) {
    if (!element) return;

    element.innerHTML = "";

    profiles.forEach(
      (profile) => {
        element.appendChild(
          createProfileCard(
            profile
          )
        );
      }
    );
  }


  /* =========================================================
     RENDER
     ========================================================= */

  function renderRadar() {
    const profiles =
      getRadarProfiles();

    renderGrid(
      $("#profileGrid"),
      profiles
    );

    $("#emptyRadar")?.classList.toggle(
      "hidden",
      profiles.length > 0
    );
  }


  function renderHistory() {
    const profiles =
      state.history
        .map(
          (id) =>
            state.profiles.find(
              (profile) =>
                profile.id === id
            )
        )
        .filter(Boolean);

    renderGrid(
      $("#historyGrid"),
      profiles
    );

    $("#emptyHistory")
      ?.classList.toggle(
        "hidden",
        profiles.length > 0
      );

    if ($("#historyCount")) {
      $("#historyCount").textContent =
        profiles.length;
    }
  }


  function renderFavorites() {
    const profiles =
      state.favorites
        .map(
          (id) =>
            state.profiles.find(
              (profile) =>
                profile.id === id
            )
        )
        .filter(Boolean);

    renderGrid(
      $("#favoriteGrid"),
      profiles
    );

    $("#emptyFavorites")
      ?.classList.toggle(
        "hidden",
        profiles.length > 0
      );

    if ($("#favoriteCount")) {
      $("#favoriteCount")
        .textContent =
        profiles.length;
    }
  }


  function renderStats() {
    const total =
      state.profiles.length;

    const viewed =
      state.profiles.filter(
        (profile) =>
          profile.viewedAt
      ).length;

    const unseen =
      total - viewed;

    const favorites =
      state.favorites.length;

    const progress =
      total > 0
        ? Math.round(
            (viewed / total) *
              100
          )
        : 0;

    if ($("#menuProfiles")) {
      $("#menuProfiles")
        .textContent = total;
    }

    if ($("#menuViewed")) {
      $("#menuViewed")
        .textContent = viewed;
    }

    if ($("#menuSaved")) {
      $("#menuSaved")
        .textContent =
        favorites;
    }

    if ($("#menuUnseen")) {
      $("#menuUnseen")
        .textContent = unseen;
    }

    if ($("#progressPercent")) {
      $("#progressPercent")
        .textContent =
        `${progress}%`;
    }

    const ring =
      $(".progress-ring");

    if (ring) {
      const degrees =
        progress * 3.6;

      ring.style.background =
        `conic-gradient(
          #ff3bbf 0deg,
          #8b5cff ${degrees}deg,
          rgba(255,255,255,.65) ${degrees}deg,
          rgba(255,255,255,.65) 360deg
        )`;
    }
  }


  function renderCurrentView() {
    const visible =
      $(".screen:not(.hidden)");

    if (!visible) return;

    switch (visible.id) {
      case "radar":
        renderRadar();
        break;

      case "history":
        renderHistory();
        break;

      case "favorites":
        renderFavorites();
        break;

      case "detail":
        renderDetail();
        break;
    }

    renderStats();
  }


  function renderAll() {
    renderRadar();
    renderHistory();
    renderFavorites();
    renderStats();

    if (
      state.currentProfileId
    ) {
      renderDetail();
    }
  }


  /* =========================================================
     MENU
     ========================================================= */

  function openMenu() {
    const menu =
      $("#sideMenu");

    if (!menu) return;

    menu.classList.add(
      "open"
    );

    menu.setAttribute(
      "aria-hidden",
      "false"
    );

    $("#menuBtn")
      ?.setAttribute(
        "aria-expanded",
        "true"
      );
  }


  function closeMenu() {
    const menu =
      $("#sideMenu");

    if (!menu) return;

    menu.classList.remove(
      "open"
    );

    menu.setAttribute(
      "aria-hidden",
      "true"
    );

    $("#menuBtn")
      ?.setAttribute(
        "aria-expanded",
        "false"
      );
  }


  /* =========================================================
     UNDO
     ========================================================= */

  function undoLastAction() {
    const action =
      state.lastAction;

    if (!action) {
      showToast(
        "Rien à annuler."
      );

      return;
    }

    if (
      action.type === "add"
    ) {
      const ids =
        new Set(action.ids);

      state.profiles =
        state.profiles.filter(
          (profile) =>
            !ids.has(
              profile.id
            )
        );

      state.favorites =
        state.favorites.filter(
          (id) =>
            !ids.has(id)
        );

      state.history =
        state.history.filter(
          (id) =>
            !ids.has(id)
        );
    }


    if (
      action.type === "view"
    ) {
      const profile =
        state.profiles.find(
          (item) =>
            item.id ===
            action.id
        );

      if (profile) {
        profile.viewedAt = null;
      }

      state.history =
        state.history.filter(
          (id) =>
            id !== action.id
        );
    }


    if (
      action.type ===
      "favorite"
    ) {
      if (
        action.wasFavorite
      ) {
        if (
          !state.favorites.includes(
            action.id
          )
        ) {
          state.favorites.unshift(
            action.id
          );
        }
      } else {
        state.favorites =
          state.favorites.filter(
            (id) =>
              id !== action.id
          );
      }
    }

    state.lastAction = null;

    saveState();
    renderAll();

    showToast(
      "Dernière action annulée ↶"
    );
  }


  /* =========================================================
     TXT / CSV IMPORT
     ========================================================= */

  async function handleTextFile(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      const text =
        await file.text();

      const input =
        $("#profileInput");

      if (input) {
        input.value = text;
      }

      addProfiles();

    } catch (error) {
      console.error(error);

      showToast(
        "Impossible de lire ce fichier."
      );
    }

    event.target.value = "";
  }


  /* =========================================================
     JSON EXPORT
     ========================================================= */

  function exportBackup() {
    const backup = {
      app: "KIO-LOVE",
      version: 1,
      exportedAt:
        new Date().toISOString(),
      data: {
        profiles:
          state.profiles,
        favorites:
          state.favorites,
        history:
          state.history
      }
    };

    const blob =
      new Blob(
        [
          JSON.stringify(
            backup,
            null,
            2
          )
        ],
        {
          type:
            "application/json"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `kio-love-backup-${Date.now()}.json`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(
      url
    );

    showToast(
      "Backup exporté ✦"
    );
  }


  /* =========================================================
     JSON IMPORT
     ========================================================= */

  async function importBackup(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      const raw =
        await file.text();

      const backup =
        JSON.parse(raw);

      const data =
        backup?.data;

      if (
        !data ||
        !Array.isArray(
          data.profiles
        )
      ) {
        throw new Error(
          "Invalid backup"
        );
      }

      state.profiles =
        data.profiles;

      state.favorites =
        Array.isArray(
          data.favorites
        )
          ? data.favorites
          : [];

      state.history =
        Array.isArray(
          data.history
        )
          ? data.history
          : [];

      state.lastAction = null;

      saveState();
      renderAll();

      showToast(
        "Backup restauré ✦"
      );

    } catch (error) {
      console.error(error);

      showToast(
        "Backup invalide."
      );
    }

    event.target.value = "";
  }


  /* =========================================================
     RESET
     ========================================================= */

  function resetData() {
    const confirmation =
      window.confirm(
        "Supprimer tous les profils, favoris et historique KIO-LOVE ?"
      );

    if (!confirmation) {
      return;
    }

    state.profiles = [];
    state.favorites = [];
    state.history = [];
    state.currentProfileId =
      null;
    state.lastAction = null;
    state.search = "";
    state.sort = "recent";

    localStorage.removeItem(
      STORAGE_KEY
    );

    if ($("#searchInput")) {
      $("#searchInput").value =
        "";
    }

    if ($("#sortSelect")) {
      $("#sortSelect").value =
        "recent";
    }

    renderAll();
    closeMenu();
    showView("radar");

    showToast(
      "KIO-LOVE remis à zéro."
    );
  }


  /* =========================================================
     EVENTS
     ========================================================= */

  function bindEvents() {

    /* ENTER */

    $("#enterBtn")
      ?.addEventListener(
        "click",
        () => {
          showView("radar");
        }
      );


    /* DATA VIEW BUTTONS */

    document.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            "[data-view]"
          );

        if (!button) return;

        const view =
          button.dataset.view;

        if (!view) return;

        showView(view);
      }
    );


    /* MENU */

    $("#menuBtn")
      ?.addEventListener(
        "click",
        openMenu
      );

    $("#closeMenu")
      ?.addEventListener(
        "click",
        closeMenu
      );

    $("#menuBackdrop")
      ?.addEventListener(
        "click",
        closeMenu
      );


    /* ADD */

    $("#addProfilesBtn")
      ?.addEventListener(
        "click",
        addProfiles
      );


    /* SEARCH */

    $("#searchInput")
      ?.addEventListener(
        "input",
        (event) => {
          state.search =
            event.target.value;

          renderRadar();
        }
      );

    $("#clearSearchBtn")
      ?.addEventListener(
        "click",
        () => {
          state.search = "";

          const input =
            $("#searchInput");

          if (input) {
            input.value = "";
            input.focus();
          }

          renderRadar();
        }
      );


    /* SORT */

    $("#sortSelect")
      ?.addEventListener(
        "change",
        (event) => {
          state.sort =
            event.target.value;

          saveState();
          renderRadar();
        }
      );


    /* TXT CSV */

    $("#fileInput")
      ?.addEventListener(
        "change",
        handleTextFile
      );


    /* BACKUP */

    $("#exportBtn")
      ?.addEventListener(
        "click",
        exportBackup
      );

    $("#jsonFileInput")
      ?.addEventListener(
        "change",
        importBackup
      );


    /* UNDO */

    $("#undoBtn")
      ?.addEventListener(
        "click",
        undoLastAction
      );


    /* RESET */

    $("#resetBtn")
      ?.addEventListener(
        "click",
        resetData
      );


    /* ESCAPE */

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          closeMenu();
        }
      }
    );
  }


  /* =========================================================
     START
     ========================================================= */

  function start() {
    loadState();

    bindEvents();

    if ($("#sortSelect")) {
      $("#sortSelect").value =
        state.sort;
    }

    renderAll();

    showView(
      "onboarding"
    );

    console.log(
      "KIO-LOVE READY ✦"
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      start
    );
  } else {
    start();
  }

})();
