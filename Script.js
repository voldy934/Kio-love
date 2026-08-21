(() => {
  "use strict";

  const STORAGE_KEY = "kio-love-v5";
  const LEGACY_KEYS = ["kio-love-v4", "kio-love-final-v2", "kio-love-swipe-v1"];
  const TUTORIAL_KEY = "kio-love-tutorial-v3";
  const STICKER_POS_KEY = "kio-love-stickers-v2";
  const TESSERACT_CDN = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
  const MAX_PROFILES = 5000;

  const STICKERS = Array.from(
    { length: 10 },
    (_, i) => `sticker-${i + 1}.png`
  );

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  let state = {
    profiles: [],
    queue: [],
    saved: [],
    history: []
  };

  let photos = [];
  let detected = [];
  let tesseractPromise = null;
  let toastTimer = null;
  let swipeLocked = false;


  /* =========================================================
     HELPERS
     ========================================================= */

  function makeId() {
    return (
      window.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2)}`
    );
  }


  function normalizeUsername(value) {
    if (!value) return null;

    let text = String(value)
      .normalize("NFKC")
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/^m\./i, "");

    if (
      text
        .toLowerCase()
        .startsWith("instagram.com/")
    ) {
      text = text.slice(
        "instagram.com/".length
      );
    }

    text = text
      .split(/[/?#]/)[0]
      .replace(/^@+/, "")
      .trim();

    if (!text || text.length > 30) {
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
    const raw = String(text || "")
      .split(/[\s,;]+/)
      .map(normalizeUsername)
      .filter(Boolean);

    return [
      ...new Map(
        raw.map(username => [
          username.toLowerCase(),
          username
        ])
      ).values()
    ];
  }


  function getProfile(id) {
    return (
      state.profiles.find(
        profile => profile.id === id
      ) || null
    );
  }


  function profileExists(username) {
    const key =
      username.toLowerCase();

    return state.profiles.some(
      profile =>
        profile.username.toLowerCase() ===
        key
    );
  }


  function uniqueIds(list, validIds) {
    if (!Array.isArray(list)) {
      return [];
    }

    const seen =
      new Set();

    return list.filter(id => {
      if (
        typeof id !== "string" ||
        !validIds.has(id) ||
        seen.has(id)
      ) {
        return false;
      }

      seen.add(id);

      return true;
    });
  }


  function toast(message) {
    const el =
      $("#toast");

    if (!el) return;

    el.textContent =
      message;

    el.classList.add(
      "show"
    );

    clearTimeout(
      toastTimer
    );

    toastTimer =
      setTimeout(
        () =>
          el.classList.remove(
            "show"
          ),
        2200
      );
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
      console.warn(
        "KIO storage error",
        error
      );
    }
  }


  function loadState() {
    try {
      let raw =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        for (const key of LEGACY_KEYS) {
          raw =
            localStorage.getItem(
              key
            );

          if (raw) break;
        }
      }

      if (!raw) return;

      const data =
        JSON.parse(raw);

      if (
        !data ||
        !Array.isArray(
          data.profiles
        )
      ) {
        return;
      }


      state.profiles =
        data.profiles
          .map(profile => ({
            id:
              typeof profile.id === "string" &&
              profile.id
                ? profile.id
                : makeId(),

            username:
              normalizeUsername(
                profile.username
              ),

            createdAt:
              Number(
                profile.createdAt
              ) || Date.now()
          }))
          .filter(
            profile =>
              profile.username
          )
          .slice(
            0,
            MAX_PROFILES
          );


      const validIds =
        new Set(
          state.profiles.map(
            profile => profile.id
          )
        );


      state.queue =
        uniqueIds(
          data.queue,
          validIds
        );


      state.saved =
        uniqueIds(
          data.saved,
         
