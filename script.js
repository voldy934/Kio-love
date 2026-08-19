(() => {
  "use strict";

  /*
   * ============================================================
   * KIO RADAR — STABLE 1.0
   * ============================================================
   * - Stockage IndexedDB + secours localStorage
   * - Migration automatique V1 → V5
   * - Import TXT / CSV / JSON
   * - Export JSON
   * - Recherche + tri
   * - Favoris
   * - Historique
   * - Undo
   * - Navigation mobile / navigateur
   * - Validation des données
   * - Rendu optimisé pour mobile
   * ============================================================
   */

  const APP_VERSION = 6;
  const APP_SCHEMA = "kio-radar-backup";

  const STORAGE_KEY =
    "kio-radar-stable-v1";

  const LEGACY_KEYS = [
    "kio-radar-v5",
    "kio-radar-v4",
    "kio-radar-v3",
    "kio-radar-v2",
    "kio-radar-v1"
  ];

  const DB_NAME = "kio-radar-db";
  const DB_VERSION = 1;
  const DB_STORE = "app";
  const DB_STATE_KEY = "state";

  const MAX_PROFILES = 10000;

  const MAX_IMPORT_BYTES =
    5 * 1024 * 1024;

  const PAGE_SIZE = 120;

  const SAVE_DEBOUNCE_MS = 120;

  const VIEWS = [
    "onboarding",
    "radar",
    "detail",
    "history",
    "favorites"
  ];

  const NAV_VIEWS = new Set([
    "radar",
    "history",
    "favorites"
  ]);

  const SORTS = new Set([
    "recent",
    "alpha",
    "unseen",
    "favorites"
  ]);

  const RESERVED_INSTAGRAM_PATHS =
    new Set([
      "p",
      "reel",
      "reels",
      "stories",
      "explore",
      "accounts",
      "direct",
      "about",
      "developer",
      "legal",
      "privacy"
    ]);

  const $ = (id) =>
    document.getElementById(id);

  let state =
    createDefaultState();

  let currentView =
    "onboarding";

  let currentId = null;

  let currentSearch = "";

  let currentSort =
    "recent";

  let toastTimer = null;

  let saveTimer = null;

  let dbPromise = null;

  let storageMode =
    "memory";

  let isStarting = false;

  const renderLimits = {
    radar: PAGE_SIZE,
    history: PAGE_SIZE,
    favorites: PAGE_SIZE
  };


  /*
   * ============================================================
   * DEFAULT STATE
   * ============================================================
   */

  function createDefaultState() {
    return {
      version: APP_VERSION,

      profiles: [],

      history: [],

      favorites: [],

      lastAction: null,

      settings: {
        onboardingDone: false,
        lastView: "radar",
        sort: "recent"
      }
    };
  }


  /*
   * ============================================================
   * ID
   * ============================================================
   */

  function makeId() {
    try {
      if (
        typeof crypto !==
          "undefined" &&
        typeof crypto.randomUUID ===
          "function"
      ) {
        return (
          "kio-" +
          crypto.randomUUID()
        );
      }
    } catch {}

    return (
      "kio-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 12)
    );
  }


  /*
   * ============================================================
   * TIMESTAMP
   * ============================================================
   */

  function isFiniteTimestamp(
    value
  ) {
    return (
      Number.isFinite(value) &&
      value > 0 &&
      value <
        4102444800000
    );
  }


  /*
   * ============================================================
   * HTML SECURITY
   * ============================================================
   */

  function escapeHtml(value) {
    return String(
      value ?? ""
    ).replace(
      /[&<>"']/g,
      (char) => {
        const map = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        };

        return map[char];
      }
    );
  }


  /*
   * ============================================================
   * INSTAGRAM USERNAME
   * ============================================================
   */

  function normalizeUsername(
    value
  ) {
    let username = String(
      value ?? ""
    ).trim();

    if (!username) {
      return null;
    }

    username = username
      .replace(
        /^(?:https?:\/\/)?(?:(?:www|m)\.)?instagram\.com\//i,
        ""
      )
      .replace(/^@+/, "")
      .replace(/^\/+/, "")
      .split(/[/?#\s]/)[0]
      .trim()
      .toLowerCase();

    if (
      !username ||
      username.length > 30
    ) {
      return null;
    }

    if (
      RESERVED_INSTAGRAM_PATHS.has(
        username
      )
    ) {
      return null;
    }

    if (
      !/^[a-z0-9._]+$/.test(
        username
      )
    ) {
      return null;
    }

    if (
      username.startsWith(
        "."
      ) ||
      username.endsWith(
        "."
      ) ||
      username.includes(
        ".."
      )
    ) {
      return null;
    }

    return username;
  }


  /*
   * ============================================================
   * COLORS
   * ============================================================
   */

  function getColors(
    username
  ) {
    const palettes = [
      [
        "#ff2aa9",
        "#6d35ff"
      ],
      [
        "#ff5b91",
        "#263dff"
      ],
      [
        "#a747ff",
        "#1c9cff"
      ],
      [
        "#ff2c71",
        "#7029ff"
      ],
      [
        "#ff6bce",
        "#3b52ff"
      ],
      [
        "#e32cff",
        "#00bfff"
      ],
      [
        "#ff4f81",
        "#7c3aed"
      ],
      [
        "#ec4899",
        "#2563eb"
      ]
    ];

    let hash = 0;

    for (
      let i = 0;
      i < username.length;
      i++
    ) {
      hash =
        username.charCodeAt(
          i
        ) +
        ((hash << 5) -
          hash);
    }

    return palettes[
      Math.abs(hash) %
        palettes.length
    ];
  }


  /*
   * ============================================================
   * PROFILE HELPERS
   * ============================================================
   */

  function getProfile(id) {
    return state.profiles.find(
      (profile) =>
        profile.id === id
    );
  }


  function getUnseenProfiles() {
    return state.profiles.filter(
      (profile) =>
        !profile.viewed
    );
  }


  function getViewedProfiles() {
    const byId =
      new Map(
        state.profiles.map(
          (profile) => [
            profile.id,
            profile
          ]
        )
      );

    return state.history
      .map((id) =>
        byId.get(id)
      )
      .filter(Boolean);
  }


  function getFavoriteProfiles() {
    return state.profiles.filter(
      (profile) =>
        profile.favorite
    );
  }


  /*
   * ============================================================
   * PROFILE SANITIZATION
   * ============================================================
   */

  function sanitizeProfile(raw) {
    if (
      !raw ||
      typeof raw !== "object"
    ) {
      return null;
    }

    const username =
      normalizeUsername(
        raw.username
      );

    if (!username) {
      return null;
    }

    const [c1, c2] =
      getColors(username);

    const createdAt =
      isFiniteTimestamp(
        raw.createdAt
      )
        ? raw.createdAt
        : Date.now();

    const viewed =
      Boolean(raw.viewed);

    return {
      id:
        typeof raw.id ===
          "string" &&
        raw.id.trim()
          ? raw.id
              .trim()
              .slice(
                0,
                160
              )
          : makeId(),

      username,

      viewed,

      viewedAt:
        isFiniteTimestamp(
          raw.viewedAt
        )
          ? raw.viewedAt
          : viewed
          ? createdAt
          : null,

      favorite:
        Boolean(
          raw.favorite
        ),

      createdAt,

      openedInstagramAt:
        isFiniteTimestamp(
          raw.openedInstagramAt
        )
          ? raw.openedInstagramAt
          : null,

      /*
       * Les couleurs sont
       * recalculées localement.
       *
       * Les couleurs importées
       * depuis JSON ne sont
       * jamais utilisées.
       */
      c1,

      c2
    };
  }


  /*
   * ============================================================
   * LAST ACTION
   * ============================================================
   */

  function sanitizeLastAction(
    action,
    validIds
  ) {
    if (
      !action ||
      typeof action !== "object"
    ) {
      return null;
    }

    const type =
      action.type;

    if (
      type ===
      "addProfiles"
    ) {
      const profileIds =
        Array.isArray(
          action.profileIds
        )
          ? action.profileIds.filter(
              (id) =>
                validIds.has(
                  id
                )
            )
          : [];

      return profileIds.length
        ? {
            type,
            profileIds
          }
        : null;
    }

    if (
      ![
        "markViewed",
        "restoreProfile",
        "favorite"
      ].includes(type)
    ) {
      return null;
    }

    if (
      !validIds.has(
        action.profileId
      )
    ) {
      return null;
    }

    return {
      type,

      profileId:
        action.profileId,

      previousValue:
        action.previousValue &&
        typeof action.previousValue ===
          "object"
          ? {
              viewed:
                Boolean(
                  action
                    .previousValue
                    .viewed
                ),

              viewedAt:
                isFiniteTimestamp(
                  action
                    .previousValue
                    .viewedAt
                )
                  ? action
                      .previousValue
                      .viewedAt
                  : null,

              favorite:
                Boolean(
                  action
                    .previousValue
                    .favorite
                )
            }
          : null
    };
  }


  /*
   * ============================================================
   * STATE NORMALIZATION
   * ============================================================
   */

  function normalizeState(raw) {
    const clean =
      createDefaultState();

    if (
      !raw ||
      typeof raw !==
        "object"
    ) {
      return clean;
    }

    const rawProfiles =
      Array.isArray(
        raw.profiles
      )
        ? raw.profiles
        : [];

    const usernames =
      new Set();

    const ids =
      new Set();

    clean.profiles =
      rawProfiles
        .map(
          sanitizeProfile
        )
        .filter(Boolean)
        .filter(
          (profile) => {
            if (
              usernames.has(
                profile.username
              )
            ) {
              return false;
            }

            usernames.add(
              profile.username
            );

            while (
              ids.has(
                profile.id
              )
            ) {
              profile.id =
                makeId();
            }

            ids.add(
              profile.id
            );

            return true;
          }
        )
        .slice(
          0,
          MAX_PROFILES
        );

    const validIds =
      new Set(
        clean.profiles.map(
          (profile) =>
            profile.id
        )
      );


    /*
     * FAVORITES
     */

    const oldFavorites =
      Array.isArray(
        raw.favorites
      )
        ? new Set(
            raw.favorites.filter(
              (id) =>
                validIds.has(
                  id
                )
            )
          )
        : new Set();

    clean.profiles.forEach(
      (profile) => {
        if (
          oldFavorites.has(
            profile.id
          )
        ) {
          profile.favorite =
            true;
        }
      }
    );

    clean.favorites =
      clean.profiles
        .filter(
          (profile) =>
            profile.favorite
        )
        .map(
          (profile) =>
            profile.id
        );


    /*
     * HISTORY
     */

    const oldHistory =
      Array.isArray(
        raw.history
      )
        ? raw.history.filter(
            (id) =>
              validIds.has(
                id
              )
          )
        : [];

    clean.history =
      Array.from(
        new Set(
          oldHistory
        )
      );

    const missing =
      clean.profiles
        .filter(
          (profile) =>
            profile.viewed &&
            !clean.history.includes(
              profile.id
            )
        )
        .sort(
          (a, b) =>
            (b.viewedAt ||
              0) -
            (a.viewedAt ||
              0)
        )
        .map(
          (profile) =>
            profile.id
        );

    clean.history.push(
      ...missing
    );


    /*
     * LAST ACTION
     */

    clean.lastAction =
      sanitizeLastAction(
        raw.lastAction,
        validIds
      );


    /*
     * SETTINGS
     */

    const settings =
      raw.settings &&
      typeof raw.settings ===
        "object"
        ? raw.settings
        : {};

    clean.settings = {
      onboardingDone:
        Boolean(
          settings.onboardingDone
        ) ||
        clean.profiles.length >
          0,

      lastView:
        typeof settings.lastView ===
          "string" &&
        NAV_VIEWS.has(
          settings.lastView
        )
          ? settings.lastView
          : "radar",

      sort:
        typeof settings.sort ===
          "string" &&
        SORTS.has(
          settings.sort
        )
          ? settings.sort
          : "recent"
    };

    return clean;
  }


  /*
   * ============================================================
   * INDEXED DB
   * ============================================================
   */

  function openDatabase() {
    if (dbPromise) {
      return dbPromise;
    }

    dbPromise =
      new Promise(
        (
          resolve,
          reject
        ) => {
          if (
            !(
              "indexedDB" in
              window
            )
          ) {
            reject(
              new Error(
                "IndexedDB indisponible"
              )
            );

            return;
          }

          const request =
            indexedDB.open(
              DB_NAME,
              DB_VERSION
            );

          request.onupgradeneeded =
            () => {
              const db =
                request.result;

              if (
                !db.objectStoreNames.contains(
                  DB_STORE
                )
              ) {
                db.createObjectStore(
                  DB_STORE
                );
              }
            };

          request.onsuccess =
            () => {
              resolve(
                request.result
              );
            };

          request.onerror =
            () => {
              reject(
                request.error ||
                  new Error(
                    "IndexedDB indisponible"
                  )
              );
            };
        }
      );

    return dbPromise;
  }


  async function idbReadState() {
    const db =
      await openDatabase();

    return new Promise(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            DB_STORE,
            "readonly"
          );

        const store =
          transaction.objectStore(
            DB_STORE
          );

        const request =
          store.get(
            DB_STATE_KEY
          );

        request.onsuccess =
          () => {
            resolve(
              request.result ??
                null
            );
          };

        request.onerror =
          () => {
            reject(
              request.error
            );
          };
      }
    );
  }


  async function idbWriteState(
    value
  ) {
    const db =
      await openDatabase();

    return new Promise(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            DB_STORE,
            "readwrite"
          );

        transaction
          .objectStore(
            DB_STORE
          )
          .put(
            value,
            DB_STATE_KEY
          );

        transaction.oncomplete =
          () =>
            resolve();

        transaction.onerror =
          () =>
            reject(
              transaction.error
            );

        transaction.onabort =
          () =>
            reject(
              transaction.error ||
                new Error(
                  "Écriture annulée"
                )
            );
      }
    );
  }


  async function idbClearState() {
    const db =
      await openDatabase();

    return new Promise(
      (
        resolve,
        reject
      ) => {
        const transaction =
          db.transaction(
            DB_STORE,
            "readwrite"
          );

        transaction
          .objectStore(
            DB_STORE
          )
          .delete(
            DB_STATE_KEY
          );

        transaction.oncomplete =
          () =>
            resolve();

        transaction.onerror =
          () =>
            reject(
              transaction.error
            );
      }
    );
  }


  /*
   * ============================================================
   * LOCAL STORAGE MIGRATION
   * ============================================================
   */

  function readLocalStorageState() {
    const keys = [
      STORAGE_KEY,
      ...LEGACY_KEYS
    ];

    for (
      const key of keys
    ) {
      try {
        const raw =
          localStorage.getItem(
            key
          );

        if (!raw) {
          continue;
        }

        return {
          state:
            normalizeState(
              JSON.parse(raw)
            ),

          sourceKey:
            key
        };
      } catch (
        error
      ) {
        console.warn(
          "KIO RADAR : lecture localStorage impossible",
          key,
          error
        );
      }
    }

    return null;
  }


  /*
   * ============================================================
   * LOAD STATE
   * ============================================================
   */

  async function loadState() {
    try {
      const fromDb =
        await idbReadState();

      if (fromDb) {
        storageMode =
          "indexeddb";

        return normalizeState(
          fromDb
        );
      }
    } catch (
      error
    ) {
      console.warn(
        "KIO RADAR : IndexedDB indisponible",
        error
      );
    }

    const local =
      readLocalStorageState();

    if (local) {
      storageMode =
        "localstorage";

      return local.state;
    }

    try {
      localStorage.setItem(
        "__kio_test__",
        "1"
      );

      localStorage.removeItem(
        "__kio_test__"
      );

      storageMode =
        "localstorage";
    } catch {
      storageMode =
        "memory";
    }

    return createDefaultState();
  }


  /*
   * ============================================================
   * DERIVED STATE
   * ============================================================
   */

  function syncDerivedState() {
    const validIds =
      new Set(
        state.profiles.map(
          (profile) =>
            profile.id
        )
      );

    state.favorites =
      state.profiles
        .filter(
          (profile) =>
            profile.favorite
        )
        .map(
          (profile) =>
            profile.id
        );

    const historySet =
      new Set();

    state.history =
      state.history.filter(
        (id) => {
          if (
            !validIds.has(
              id
            ) ||
            historySet.has(
              id
            )
          ) {
            return false;
          }

          historySet.add(
            id
          );

          return true;
        }
      );

    const missingViewed =
      [];

    for (
      const profile of
      state.profiles
    ) {
      if (
        profile.viewed &&
        !historySet.has(
          profile.id
        )
      ) {
        missingViewed.push(
          profile
        );

        historySet.add(
          profile.id
        );
      }
    }

    missingViewed
      .sort(
        (a, b) =>
          (b.viewedAt ||
            0) -
          (a.viewedAt ||
            0)
      )
      .forEach(
        (profile) => {
          state.history.push(
            profile.id
          );
        }
      );

    const profileMap =
      new Map(
        state.profiles.map(
          (profile) => [
            profile.id,
            profile
          ]
        )
      );

    state.history =
      state.history.filter(
        (id) => {
          const profile =
            profileMap.get(
              id
            );

          return Boolean(
            profile &&
              profile.viewed
          );
        }
      );

    if (
      state.profiles.length ===
      0
    ) {
      state.settings.onboardingDone =
        false;

      state.lastAction =
        null;
    }
  }


  /*
   * ============================================================
   * SAVE
   * ============================================================
   */

  async function persistStateNow() {
    syncDerivedState();

    state.version =
      APP_VERSION;

    const snapshot =
      JSON.parse(
        JSON.stringify(
          state
        )
      );

    try {
      await idbWriteState(
        snapshot
      );

      storageMode =
        "indexeddb";

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(
            snapshot
          )
        );
      } catch {}

      return true;
    } catch (
      error
    ) {
      console.warn(
        "KIO RADAR : IndexedDB write error",
        error
      );
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          snapshot
        )
      );

      storageMode =
        "localstorage";

      return true;
    } catch (
      error
    ) {
      storageMode =
        "memory";

      console.warn(
        "KIO RADAR : sauvegarde impossible",
        error
      );

      showToast(
        "Sauvegarde locale indisponible"
      );

      return false;
    }
  }


  function scheduleSave() {
    syncDerivedState();

    updateStats();
    updateProgress();

    clearTimeout(
      saveTimer
    );

    saveTimer =
      setTimeout(
        () => {
          persistStateNow();
        },
        SAVE_DEBOUNCE_MS
      );
  }


  async function flushSave() {
    clearTimeout(
      saveTimer
    );

    saveTimer = null;

    await persistStateNow();
  }


  /*
   * ============================================================
   * TOAST
   * ============================================================
   */

  function showToast(
    message
  ) {
    const toast =
      $("toast");

    if (!toast) {
      console.log(
        "KIO RADAR:",
        message
      );

      return;
    }

    toast.textContent =
      String(message);

    toast.classList.add(
      "show"
    );

    clearTimeout(
      toastTimer
    );

    toastTimer =
      setTimeout(
        () => {
          toast.classList.remove(
            "show"
          );
        },
        2200
      );
  }


  /*
   * ============================================================
   * IMPORT TEXT
   * ============================================================
   */

  function parseProfileText(
    text
  ) {
    const source =
      String(
        text ?? ""
      );

    const urlMatches =
      source.match(
        /(?:https?:\/\/)?(?:(?:www|m)\.)?instagram\.com\/[a-z0-9._]+/gi
      ) || [];

    const tokens =
      source
        .replace(
          /(?:https?:\/\/)?(?:(?:www|m)\.)?instagram\.com\/[a-z0-9._]+/gi,
          " "
        )
        .split(
          /[\s,;|"']+/
        )
        .filter(Boolean);

    return [
      ...urlMatches,
      ...tokens
    ];
  }


  /*
   * ============================================================
   * ADD PROFILES
   * ============================================================
   */

  function addProfiles(
    values
  ) {
    if (
      !Array.isArray(
        values
      )
    ) {
      return;
    }

    const existing =
      new Set(
        state.profiles.map(
          (profile) =>
            profile.username
        )
      );

    const addedIds =
      [];

    let invalid = 0;
    let duplicates = 0;
    let limitReached =
      false;

    for (
      const rawValue of
      values
    ) {
      if (
        state.profiles.length >=
        MAX_PROFILES
      ) {
        limitReached =
          true;

        break;
      }

      const username =
        normalizeUsername(
          rawValue
        );

      if (!username) {
        invalid++;
        continue;
      }

      if (
        existing.has(
          username
        )
      ) {
        duplicates++;
        continue;
      }

      const [c1, c2] =
        getColors(
          username
        );

      const profile = {
        id: makeId(),

        username,

        viewed: false,

        viewedAt: null,

        favorite: false,

        createdAt:
          Date.now(),

        openedInstagramAt:
          null,

        c1,

        c2
      };

      state.profiles.push(
        profile
      );

      addedIds.push(
        profile.id
      );

      existing.add(
        username
      );
    }

    if (
      addedIds.length
    ) {
      state.settings.onboardingDone =
        true;

      state.lastAction = {
        type:
          "addProfiles",

        profileIds:
          addedIds
      };
    }

    scheduleSave();

    resetRenderLimits();

    renderCurrentView();

    if (
      addedIds.length
    ) {
      let message =
        `${addedIds.length} profil` +
        `${
          addedIds.length >
          1
            ? "s"
            : ""
        } ajouté` +
        `${
          addedIds.length >
          1
            ? "s"
            : ""
        }`;

      if (
        duplicates
      ) {
        message +=
          ` · ${duplicates} doublon` +
          `${
            duplicates >
            1
              ? "s"
              : ""
          }`;
      }

      if (invalid) {
        message +=
          ` · ${invalid} invalide` +
          `${
            invalid >
            1
              ? "s"
              : ""
          }`;
      }

      if (
        limitReached
      ) {
        message +=
          " · limite atteinte";
      }

      showToast(
        message
      );

      return;
    }

    if (
      limitReached
    ) {
      showToast(
        `Limite de ${MAX_PROFILES} profils atteinte`
      );
    } else if (
      duplicates &&
      !invalid
    ) {
      showToast(
        "Tous ces profils sont déjà présents"
      );
    } else {
      showToast(
        "Aucun nouveau profil Instagram valide"
      );
    }
  }


  /*
   * ============================================================
   * MARK VIEWED
   * ============================================================
   */

  function markViewed(
    id,
    {
      rememberForUndo =
        true
    } = {}
  ) {
    const profile =
      getProfile(id);

    if (!profile) {
      return false;
    }

    const previousValue = {
      viewed:
        profile.viewed,

      viewedAt:
        profile.viewedAt,

      favorite:
        profile.favorite
    };

    const changed =
      !profile.viewed;

    profile.viewed =
      true;

    profile.viewedAt =
      profile.viewedAt ||
      Date.now();

    state.history =
      state.history.filter(
        (historyId) =>
          historyId !== id
      );

    state.history.unshift(
      id
    );

    if (
      changed &&
      rememberForUndo
    ) {
      state.lastAction = {
        type:
          "markViewed",

        profileId:
          id,

        previousValue
      };
    }

    scheduleSave();

    return changed;
  }


  /*
   * ============================================================
   * RESTORE
   * ============================================================
   */

  function restoreProfile(
    id
  ) {
    const profile =
      getProfile(id);

    if (!profile) {
      return false;
    }

    const previousValue = {
      viewed:
        profile.viewed,

      viewedAt:
        profile.viewedAt,

      favorite:
        profile.favorite
    };

    profile.viewed =
      false;

    profile.viewedAt =
      null;

    state.history =
      state.history.filter(
        (historyId) =>
          historyId !== id
      );

    state.lastAction = {
      type:
        "restoreProfile",

      profileId: id,

      previousValue
    };

    scheduleSave();

    resetRenderLimits();

    renderCurrentView();

    showToast(
      "Profil remis dans Radar"
    );

    return true;
  }


  /*
   * ============================================================
   * FAVORITES
   * ============================================================
   */

  function toggleFavorite(
    id
  ) {
    const profile =
      getProfile(id);

    if (!profile) {
      return;
    }

    const previousValue = {
      viewed:
        profile.viewed,

      viewedAt:
        profile.viewedAt,

      favorite:
        profile.favorite
    };

    profile.favorite =
      !profile.favorite;

    state.lastAction = {
      type:
        "favorite",

      profileId: id,

      previousValue
    };

    scheduleSave();

    renderCurrentView();

    showToast(
      profile.favorite
        ? "Ajouté aux favoris"
        : "Retiré des favoris"
    );
  }


  /*
   * ============================================================
   * UNDO
   * ============================================================
   */

  function undoLastAction() {
    const action =
      state.lastAction;

    if (!action) {
      showToast(
        "Rien à annuler"
      );

      return;
    }

    if (
      action.type ===
      "addProfiles"
    ) {
      const ids =
        new Set(
          Array.isArray(
            action.profileIds
          )
            ? action.profileIds
            : []
        );

      state.profiles =
        state.profiles.filter(
          (profile) =>
            !ids.has(
              profile.id
            )
        );

      state.history =
        state.history.filter(
          (id) =>
            !ids.has(
              id
            )
        );
    } else {
      const profile =
        getProfile(
          action.profileId
        );

      if (!profile) {
        state.lastAction =
          null;

        scheduleSave();

        showToast(
          "Rien à annuler"
        );

        return;
      }

      const previous =
        action.previousValue ||
        {};

      if (
        action.type ===
        "favorite"
      ) {
        profile.favorite =
          Boolean(
            previous.favorite
          );
      }

      if (
        action.type ===
          "markViewed" ||
        action.type ===
          "restoreProfile"
      ) {
        profile.viewed =
          Boolean(
            previous.viewed
          );

        profile.viewedAt =
          previous.viewedAt ||
          null;
      }
    }

    state.lastAction =
      null;

    scheduleSave();

    resetRenderLimits();

    renderCurrentView();

    if (
      !state.profiles.length
    ) {
      showView(
        "onboarding"
      );
    } else if (
      currentView ===
      "detail"
    ) {
      showView(
        "radar"
      );
    }

    showToast(
      "Dernière action annulée"
    );
  }


  /*
   * ============================================================
   * INSTAGRAM
   * ============================================================
   */

  function getInstagramUrl(
    username
  ) {
    const normalized =
      normalizeUsername(
        username
      );

    if (!normalized) {
      return null;
    }

    return (
      "https://www.instagram.com/" +
      encodeURIComponent(
        normalized
      ) +
      "/"
    );
  }


  function openInstagram(
    profile
  ) {
    if (!profile) {
      return;
    }

    const url =
      getInstagramUrl(
        profile.username
      );

    if (!url) {
      showToast(
        "Profil Instagram invalide"
      );

      return;
    }

    profile.openedInstagramAt =
      Date.now();

    markViewed(
      profile.id
    );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      url;

    link.target =
      "_blank";

    link.rel =
      "noopener noreferrer";

    link.style.display =
      "none";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    renderCurrentView();
  }


  /*
  
