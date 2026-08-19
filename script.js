(() => {
  "use strict";

  /* =========================================================
     KIO-LOVE — SWIPE ENGINE
     ========================================================= */

  const STORAGE_KEY = "kio-love-swipe-v1";

  /*
    Plus tard, quand on aura créé le backend,
    on mettra son adresse ici.

    Exemple :
    const API_URL = "https://api.kio-love.com";

    Pour l'instant on laisse vide.
  */
  const API_URL = "";


  /* =========================================================
     DOM HELPERS
     ========================================================= */

  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    [...document.querySelectorAll(selector)];


  /* =========================================================
     STATE
     ========================================================= */

  let state = {
    profiles: [],
    queue: [],
    saved: [],
    history: [],
    seed: ""
  };

  let toastTimer = null;
  let swipeLocked = false;


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
      console.error("Save error:", error);
    }
  }


  function loadState() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) return;

      const saved =
        JSON.parse(raw);

      if (
        !saved ||
        !Array.isArray(saved.profiles)
      ) {
        return;
      }

      state.profiles =
        saved.profiles || [];

      state.queue =
        Array.isArray(saved.queue)
          ? saved.queue
          : [];

      state.saved =
        Array.isArray(saved.saved)
          ? saved.saved
          : [];

      state.history =
        Array.isArray(saved.history)
          ? saved.history
          : [];

      state.seed =
        typeof saved.seed === "string"
          ? saved.seed
          : "";

    } catch (error) {
      console.error("Load error:", error);
    }
  }


  /* =========================================================
     USERNAME
     ========================================================= */

  function normalizeUsername(value) {
    if (!value) return null;

    let text =
      String(value).trim();

    if (!text) return null;

    text =
      text.replace(
        /^https?:\/\//i,
        ""
      );

    text =
      text.replace(
        /^www\./i,
        ""
      );

    text =
      text.replace(
        /^m\./i,
        ""
      );

    if (
      text
        .toLowerCase()
        .startsWith("instagram.com/")
    ) {
      text =
        text.slice(
          "instagram.com/".length
        );
    }

    text =
      text.split(/[/?#]/)[0];

    text =
      text.replace(/^@+/, "");

    text =
      text.trim();

    if (!text) return null;

    if (text.length > 30) {
      return null;
    }

    if (
      !/^[A-Za-z0-9._]+$/.test(text)
    ) {
      return null;
    }

    if (
      text.startsWith(".") ||
      text.endsWith(".") ||
      text.includes("..")
    ) {
      return null;
    }

    return text;
  }


  function parseUsernames(text) {
    return String(text || "")
      .split(/[\s,;\n\r\t]+/)
      .map(normalizeUsername)
      .filter(Boolean);
  }


  /* =========================================================
     PROFILE HELPERS
     ========================================================= */

  function createId() {
    if (
      window.crypto &&
      crypto.randomUUID
    ) {
      return crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .slice(2)
    );
  }


  function getProfile(id) {
    return state.profiles.find(
      (profile) =>
        profile.id === id
    );
  }


  function profileExists(username) {
    const key =
      username.toLowerCase();

    return state.profiles.some(
      (profile) =>
        profile.username
          .toLowerCase() === key
    );
  }


  function hashString(text) {
    let hash = 0;

    for (
      let i = 0;
      i < text.length;
      i++
    ) {
      hash =
        text.charCodeAt(i) +
        ((hash << 5) - hash);

      hash |= 0;
    }

    return Math.abs(hash);
  }


  function getColors(username) {
    const colors = [
      ["#ff4eae", "#9c61ff"],
      ["#ff74c7", "#ef56ff"],
      ["#ff3d91", "#ff9fcb"],
      ["#cc70ff", "#ff4ba7"],
      ["#ff86c7", "#7059ff"],
      ["#ef58ab", "#b989ff"],
      ["#ff659f", "#e795ff"],
      ["#ff9bcf", "#965bff"]
    ];

    return colors[
      hashString(username) %
      colors.length
    ];
  }


  function addProfiles(usernames) {
    const added = [];

    usernames.forEach(
      (username) => {
        const clean =
          normalizeUsername(username);

        if (!clean) return;

        if (
          profileExists(clean)
        ) {
          return;
        }

        const profile = {
          id: createId(),

          username: clean,

          createdAt:
            Date.now()
        };

        state.profiles.push(
          profile
        );

        state.queue.push(
          profile.id
        );

        added.push(profile);
      }
    );

    saveState();
    updateUI();

    return added;
  }


  /* =========================================================
     TOAST
     ========================================================= */

  function toast(message) {
    const element =
      $("#toast");

    if (!element) return;

    element.textContent =
      message;

    element.classList.add(
      "show"
    );

    clearTimeout(
      toastTimer
    );

    toastTimer =
      setTimeout(() => {
        element.classList.remove(
          "show"
        );
      }, 2200);
  }


  /* =========================================================
     SCREENS
     ========================================================= */

  function showScreen(id) {
    $$(".screen").forEach(
      (screen) => {
        screen.classList.add(
          "hidden"
        );
      }
    );

    const screen =
      document.getElementById(id);

    if (!screen) return;

    screen.classList.remove(
      "hidden"
    );

    const bottomNav =
      $("#bottomNav");

    if (bottomNav) {
      bottomNav.classList.toggle(
        "hidden",
        id === "startScreen"
      );
    }

    $$(".nav-btn").forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.screen === id
        );
      }
    );

    closeMenu();

    if (
      id === "swipeScreen"
    ) {
      renderDeck();
    }

    if (
      id === "savedScreen"
    ) {
      renderSaved();
    }

    if (
      id === "historyScreen"
    ) {
      renderHistory();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }


  /* =========================================================
     BACKEND READY
     ========================================================= */

  async function discoverProfiles(seed) {
    /*
      Quand notre backend sera prêt,
      cette fonction récupérera
      automatiquement les profils.
    */

    if (!API_URL) {
      return [];
    }

    try {
      const response =
        await fetch(
          `${API_URL}/discover?username=${encodeURIComponent(seed)}`
        );

      if (!response.ok) {
        throw new Error(
          "Backend error"
        );
      }

      const data =
        await response.json();

      if (
        !Array.isArray(data.profiles)
      ) {
        return [];
      }

      return data.profiles
        .map((item) => {
          if (
            typeof item === "string"
          ) {
            return item;
          }

          return item?.username;
        })
        .filter(Boolean);

    } catch (error) {
      console.error(
        "Discovery error:",
        error
      );

      return [];
    }
  }


  /* =========================================================
     START SCAN
     ========================================================= */

  async function startScan() {
    const input =
      $("#seedInput");

    const username =
      normalizeUsername(
        input?.value
      );

    if (
      !username &&
      state.queue.length === 0
    ) {
      toast(
        "Entre un @username ou ajoute une liste."
      );

      return;
    }

    if (username) {
      state.seed =
        username;

      /*
        On ajoute déjà le compte
        de départ lui-même au deck.
      */

      const addedSeed =
        addProfiles([
          username
        ]);

      /*
        Si le backend est connecté,
        récupérer les profils découverts.
      */

      if (API_URL) {
        toast(
          "Recherche des profils…"
        );

        const discovered =
          await discoverProfiles(
            username
          );

        addProfiles(
          discovered
        );

      } else {
        /*
          Pour l'instant le site
          reste utilisable manuellement.
        */

        if (
          addedSeed.length > 0
        ) {
          toast(
            "Compte ajouté ✦ Backend ensuite."
          );
        }
      }
    }

    saveState();

    showScreen(
      "swipeScreen"
    );
  }


  /* =========================================================
     MANUAL ADD
     ========================================================= */

  function addManualProfiles() {
    const input =
      $("#manualInput");

    const usernames =
      parseUsernames(
        input?.value
      );

    if (!usernames.length) {
      toast(
        "Ajoute des @username."
      );

      return;
    }

    const added =
      addProfiles(usernames);

    if (!added.length) {
      toast(
        "Ces profils sont déjà enregistrés."
      );

      return;
    }

    if (input) {
      input.value = "";
    }

    toast(
      `${added.length} profil${added.length > 1 ? "s" : ""} ajouté${added.length > 1 ? "s" : ""} ✦`
    );

    showScreen(
      "swipeScreen"
    );
  }


  /* =========================================================
     HISTORY
     ========================================================= */

  function addHistory(
    id,
    action
  ) {
    state.history =
      state.history.filter(
        (entry) =>
          entry.id !== id
      );

    state.history.unshift({
      id,
      action,
      at: Date.now()
    });
  }


  /* =========================================================
     SAVED
     ========================================================= */

  function saveProfile(id) {
    if (
      !state.saved.includes(id)
    ) {
      state.saved.unshift(id);
    }
  }


  /* =========================================================
     PROCESS CARD
     ========================================================= */

  function processCard(
    id,
    action
  ) {
    if (!id) return;

    /*
      Retirer du deck
    */

    state.queue =
      state.queue.filter(
        (profileId) =>
          profileId !== id
      );

    if (
      action === "save"
    ) {
      saveProfile(id);

      addHistory(
        id,
        "saved"
      );
    }

    if (
      action === "pass"
    ) {
      addHistory(
        id,
        "passed"
      );
    }

    if (
      action === "instagram"
    ) {
      addHistory(
        id,
        "instagram"
      );
    }

    saveState();
    updateUI();
  }


  /* =========================================================
     OPEN INSTAGRAM
     ========================================================= */

  function openInstagram(id) {
    const profile =
      getProfile(id);

    if (!profile) return;

    const url =
      `https://www.instagram.com/${encodeURIComponent(profile.username)}/`;

    /*
      Création d'un vrai lien
      pour Safari / iPhone.
    */

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.target =
      "_blank";

    link.rel =
      "noopener noreferrer";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    processCard(
      id,
      "instagram"
    );
  }


  /* =========================================================
     SWIPE ANIMATION
     ========================================================= */

  function animateSwipe(
    card,
    direction,
    callback
  ) {
    if (
      !card ||
      swipeLocked
    ) {
      return;
    }

    swipeLocked = true;

    const x =
      direction === "right"
        ? window.innerWidth * 1.4
        : -window.innerWidth * 1.4;

    const rotate =
      direction === "right"
        ? 25
        : -25;

    card.style.transition =
      "transform .28s ease, opacity .28s ease";

    card.style.transform =
      `translate(${x}px, 40px) rotate(${rotate}deg)`;

    card.style.opacity =
      "0";

    setTimeout(() => {
      callback();

      swipeLocked =
        false;

    }, 280);
  }


  /* =========================================================
     ACTION BUTTONS
     ========================================================= */

  function passCurrent() {
    const id =
      state.queue[0];

    if (!id) return;

    const card =
      $(".swipe-card.active");

    animateSwipe(
      card,
      "left",
      () => {
        processCard(
          id,
          "pass"
        );
      }
    );
  }


  function saveCurrent() {
    const id =
      state.queue[0];

    if (!id) return;

    const card =
      $(".swipe-card.active");

    animateSwipe(
      card,
      "right",
      () => {
        processCard(
          id,
          "save"
        );

        toast(
          "Saved ★"
        );
      }
    );
  }


  function openCurrentInstagram() {
    const id =
      state.queue[0];

    if (!id) return;

    openInstagram(id);
  }


  /* =========================================================
     TOUCH / POINTER SWIPE
     ========================================================= */

  function enableSwipe(card, id) {
    let startX = 0;
    let startY = 0;

    let currentX = 0;
    let dragging = false;


    function pointerDown(event) {
      if (swipeLocked) return;

      dragging = true;

      startX =
        event.clientX;

      startY =
        event.clientY;

      currentX = 0;

      card.classList.add(
        "dragging"
      );

      try {
        card.setPointerCapture(
          event.pointerId
        );
      } catch (_) {}
    }


    function pointerMove(event) {
      if (!dragging) return;

      const dx =
        event.clientX -
        startX;

      const dy =
        event.clientY -
        startY;

      /*
        Si l'utilisateur scroll
        verticalement, ne pas bloquer
        trop vite.
      */

      if (
        Math.abs(dy) >
          Math.abs(dx) * 1.4
      ) {
        return;
      }

      currentX = dx;

      const rotate =
        dx / 18;

      card.style.transform =
        `translate(${dx}px, ${Math.abs(dx) * 0.03}px) rotate(${rotate}deg)`;


      const like =
        card.querySelector(
          ".like-label"
        );

      const pass =
        card.querySelector(
          ".pass-label"
        );


      if (like) {
        like.style.opacity =
          String(
            Math.min(
              Math.max(
                dx / 100,
                0
              ),
              1
            )
          );
      }


      if (pass) {
        pass.style.opacity =
          String(
            Math.min(
              Math.max(
                -dx / 100,
                0
              ),
              1
            )
          );
      }
    }


    function pointerUp(event) {
      if (!dragging) return;

      dragging = false;

      card.classList.remove(
        "dragging"
      );

      try {
        card.releasePointerCapture(
          event.pointerId
        );
      } catch (_) {}


      const threshold =
        Math.min(
          105,
          window.innerWidth *
            0.24
        );


      if (
        currentX >
        threshold
      ) {
        animateSwipe(
          card,
          "right",
          () => {
            processCard(
              id,
              "save"
            );

            toast(
              "Saved ★"
            );
          }
        );

        return;
      }


      if (
        currentX <
        -threshold
      ) {
        animateSwipe(
          card,
          "left",
          () => {
            processCard(
              id,
              "pass"
            );
          }
        );

        return;
      }


      /*
        Retour au centre
      */

      card.style.transition =
        "transform .22s ease";

      card.style.transform =
        "translate(0,0) rotate(0deg)";


      const like =
        card.querySelector(
          ".like-label"
        );

      const pass =
        card.querySelector(
          ".pass-label"
        );

      if (like) {
        like.style.opacity = "0";
      }

      if (pass) {
        pass.style.opacity = "0";
      }
    }


    card.addEventListener(
      "pointerdown",
      pointerDown
    );

    card.addEventListener(
      "pointermove",
      pointerMove
    );

    card.addEventListener(
      "pointerup",
      pointerUp
    );

    card.addEventListener(
      "pointercancel",
      pointerUp
    );
  }


  /* =========================================================
     CARD HTML
     ========================================================= */

  function createSwipeCard(
    profile,
    index,
    active
  ) {
    const card =
      document.createElement(
        "article"
      );

    card.className =
      `swipe-card ${active ? "active" : ""}`;

    const [a, b] =
      getColors(
        profile.username
      );

    card.style.setProperty(
      "--card-a",
      a
    );

    card.style.setProperty(
      "--card-b",
      b
    );

    card.innerHTML = `

      <div class="swipe-card-bg"></div>

      <div class="card-status">
        READY
      </div>

      <div class="highlight-chip">
        CHECK HIGHLIGHTS
      </div>

      <div class="swipe-label like-label">
        SAVE
      </div>

      <div class="swipe-label pass-label">
        PASS
      </div>

      <div class="card-profile">

        <span class="card-number">
          SIGNAL ${String(index + 1).padStart(2, "0")}
        </span>

        <h3>
          @${escapeHTML(profile.username)}
        </h3>

        <p>
          Ouvre Instagram pour vérifier
          les stories à la une.
        </p>

      </div>
    `;

    if (active) {
      enableSwipe(
        card,
        profile.id
      );
    }

    return card;
  }


  /* =========================================================
     ESCAPE
     ========================================================= */

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }


  /* =========================================================
     RENDER DECK
     ========================================================= */

  function renderDeck() {
    const deck =
      $("#deck");

    if (!deck) return;

    /*
      Garder uniquement les cartes
      générées dynamiquement.
    */

    deck
      .querySelectorAll(
        ".swipe-card"
      )
      .forEach(
        (card) =>
          card.remove()
      );


    const empty =
      $("#emptyDeck");


    if (
      state.queue.length === 0
    ) {
      empty?.classList.remove(
        "hidden"
      );

      updateStats();

      return;
    }


    empty?.classList.add(
      "hidden"
    );


    /*
      Les 3 prochaines cartes
      pour créer l'effet de pile.
    */

    const ids =
      state.queue.slice(0, 3);

    const cards = [];


    ids.forEach(
      (id, index) => {
        const profile =
          getProfile(id);

        if (!profile) return;

        const card =
          createSwipeCard(
            profile,
            state.history.length +
              index,
            index === 0
          );

        cards.push(card);
      }
    );


    /*
      On insère les cartes
      à l'envers pour que
      la première soit au-dessus.
    */

    cards
      .reverse()
      .forEach(
        (card) => {
          deck.insertBefore(
            card,
            empty
          );
        }
      );


    updateStats();
  }


  /* =========================================================
     LIBRARY CARD
     ========================================================= */

  function createLibraryCard(
    profile,
    label
  ) {
    const card =
      document.createElement(
        "article"
      );

    card.className =
      "library-card";

    const [a, b] =
      getColors(
        profile.username
      );

    card.style.setProperty(
      "--card-a",
      a
    );

    card.style.setProperty(
      "--card-b",
      b
    );

    card.innerHTML = `
      <button type="button">

        <div class="library-info">

          <strong>
            @${escapeHTML(profile.username)}
          </strong>

          <small>
            ${label}
          </small>

        </div>

      </button>
    `;

    card
      .querySelector("button")
      .addEventListener(
        "click",
        () => {
          const url =
            `https://www.instagram.com/${encodeURIComponent(profile.username)}/`;

          window.open(
            url,
            "_blank",
            "noopener"
          );
        }
      );

    return card;
  }


  /* =========================================================
     SAVED
     ========================================================= */

  function renderSaved() {
    const grid =
      $("#savedGrid");

    if (!grid) return;

    grid.innerHTML = "";

    const profiles =
      state.saved
        .map(getProfile)
        .filter(Boolean);


    profiles.forEach(
      (profile) => {
        grid.appendChild(
          createLibraryCard(
            profile,
            "SAVED PROFILE"
          )
        );
      }
    );


    $("#emptySaved")
      ?.classList.toggle(
        "hidden",
        profiles.length > 0
      );


    if ($("#savedCount")) {
      $("#savedCount").textContent =
        profiles.length;
    }
  }


  /* =========================================================
     HISTORY
     ========================================================= */

  function renderHistory() {
    const grid =
      $("#historyGrid");

    if (!grid) return;

    grid.innerHTML = "";

    const entries =
      state.history.filter(
        (entry) =>
          getProfile(entry.id)
      );


    entries.forEach(
      (entry) => {
        const profile =
          getProfile(entry.id);

        let label =
          "VIEWED";

        if (
          entry.action ===
          "saved"
        ) {
          label =
            "SAVED";
        }

        if (
          entry.action ===
          "passed"
        ) {
          label =
            "PASSED";
        }

        if (
          entry.action ===
          "instagram"
        ) {
          label =
            "OPENED ON INSTAGRAM";
        }

        grid.appendChild(
          createLibraryCard(
            profile,
            label
          )
        );
      }
    );


    $("#emptyHistory")
      ?.classList.toggle(
        "hidden",
        entries.length > 0
      );


    if ($("#historyCount")) {
      $("#historyCount").textContent =
        entries.length;
    }
  }


  /* =========================================================
     STATS
     ========================================================= */

  function updateStats() {
    const total =
      state.profiles.length;

    const seen =
      state.history.length;

    const saved =
      state.saved.length;

    const left =
      state.queue.length;


    if ($("#queueCount")) {
      $("#queueCount")
        .textContent =
        left;
    }


    if ($("#statTotal")) {
      $("#statTotal")
        .textContent =
        total;
    }


    if ($("#statSeen")) {
      $("#statSeen")
        .textContent =
        seen;
    }


    if ($("#statSaved")) {
      $("#statSaved")
        .textContent =
        saved;
    }


    if ($("#statLeft")) {
      $("#statLeft")
        .textContent =
        left;
    }


    if ($("#totalNumber")) {
      $("#totalNumber")
        .textContent =
        total;
    }


    if ($("#currentNumber")) {
      const number =
        left > 0
          ? Math.min(
              seen + 1,
              total
            )
          : total;

      $("#currentNumber")
        .textContent =
        number;
    }


    if ($("#savedCount")) {
      $("#savedCount")
        .textContent =
        saved;
    }


    if ($("#historyCount")) {
      $("#historyCount")
        .textContent =
        seen;
    }
  }


  function updateUI() {
    renderDeck();
    renderSaved();
    renderHistory();
    updateStats();
  }


  /* =========================================================
     MENU
     ========================================================= */

  function openMenu() {
    $("#sideMenu")
      ?.classList.add(
        "open"
      );
  }


  function closeMenu() {
    $("#sideMenu")
      ?.classList.remove(
        "open"
      );
  }


  /* =========================================================
     NEW SCAN
     ========================================================= */

  function newScan() {
    closeMenu();

    showScreen(
      "startScreen"
    );

    $("#seedInput")?.focus();
  }


  /* =========================================================
     CLEAR HISTORY
     ========================================================= */

  function clearHistory() {
    if (
      state.history.length === 0
    ) {
      toast(
        "Historique déjà vide."
      );

      return;
    }

    const ok =
      confirm(
        "Vider uniquement l'historique ?"
      );

    if (!ok) return;

    state.history = [];

    saveState();
    updateUI();

    toast(
      "Historique vidé."
    );
  }


  /* =========================================================
     RESET
     ========================================================= */

  function resetEverything() {
    const ok =
      confirm(
        "Supprimer tous les profils, favoris et historique KIO ?"
      );

    if (!ok) return;

    state = {
      profiles: [],
      queue: [],
      saved: [],
      history: [],
      seed: ""
    };

    localStorage.removeItem(
      STORAGE_KEY
    );

    if ($("#seedInput")) {
      $("#seedInput").value = "";
    }

    if ($("#manualInput")) {
      $("#manualInput").value = "";
    }

    updateUI();

    showScreen(
      "startScreen"
    );

    toast(
      "KIO remis à zéro ✦"
    );
  }


  /* =========================================================
     EVENTS
     ========================================================= */

  function bindEvents() {

    $("#startScanBtn")
      ?.addEventListener(
        "click",
        startScan
      );


    $("#seedInput")
      ?.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key ===
            "Enter"
          ) {
            startScan();
          }
        }
      );


    $("#manualToggleBtn")
      ?.addEventListener(
        "click",
        () => {
          $("#manualPanel")
            ?.classList.toggle(
              "hidden"
            );
        }
      );


    $("#addManualBtn")
      ?.addEventListener(
        "click",
        addManualProfiles
      );


    $("#passBtn")
      ?.addEventListener(
        "click",
        passCurrent
      );


    $("#saveBtn")
      ?.addEventListener(
        "click",
        saveCurrent
      );


    $("#openIgBtn")
      ?.addEventListener(
        "click",
        openCurrentInstagram
      );


    $("#newScanBtn")
      ?.addEventListener(
        "click",
        newScan
      );


    $("#logoBtn")
      ?.addEventListener(
        "click",
        () => {
          showScreen(
            "startScreen"
          );
        }
      );


    /* NAV */

    $$(".nav-btn").forEach(
      (button) => {
        button.addEventListener(
          "click",
          () => {
            showScreen(
              button.dataset.screen
            );
          }
        );
      }
    );


    /* MENU */

    $("#menuBtn")
      ?.addEventListener(
        "click",
        openMenu
      );


    $("#closeMenuBtn")
      ?.addEventListener(
        "click",
        closeMenu
      );


    $("#menuBackdrop")
      ?.addEventListener(
        "click",
        closeMenu
      );


    $("#menuNewScanBtn")
      ?.addEventListener(
        "click",
        newScan
      );


    $("#clearHistoryBtn")
      ?.addEventListener(
        "click",
        clearHistory
      );


    $("#resetBtn")
      ?.addEventListener(
        "click",
        resetEverything
      );


    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          closeMenu();
        }

        if (
          event.key ===
          "ArrowLeft" &&
          !$("#swipeScreen")
            ?.classList.contains(
              "hidden"
            )
        ) {
          passCurrent();
        }

        if (
          event.key ===
          "ArrowRight" &&
          !$("#swipeScreen")
            ?.classList.contains(
              "hidden"
            )
        ) {
          saveCurrent();
        }
      }
    );
  }


  /* =========================================================
     START APP
     ========================================================= */

  function startApp() {
    loadState();

    bindEvents();

    if (
      state.queue.length > 0
    ) {
      showScreen(
        "swipeScreen"
      );
    } else {
      showScreen(
        "startScreen"
      );
    }

    updateUI();

    console.log(
      "KIO SWIPE READY ✦"
    );
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      startApp
    );
  } else {
    startApp();
  }

})();
