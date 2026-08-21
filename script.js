(() => {
  "use strict";

  const STORAGE_KEY =
    "kio-love-v6";

  const TUTORIAL_KEY =
    "kio-love-tutorial-v4";

  const STICKER_POS_KEY =
    "kio-love-stickers-v3";

  const TESSERACT_CDN =
    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

  const MAX_PROFILES =
    5000;


  const STICKERS =
    Array.from(
      {
        length: 10
      },
      (_, i) =>
        `sticker-${i + 1}.png`
    );


  const $ =
    (
      selector,
      root = document
    ) =>
      root.querySelector(
        selector
      );


  const $$ =
    (
      selector,
      root = document
    ) =>
      [
        ...root.querySelectorAll(
          selector
        )
      ];


  let state = {
    profiles: [],
    queue: [],
    saved: [],
    history: []
  };


  let photos = [];

  let detected = [];

  let tesseractPromise =
    null;

  let toastTimer =
    null;

  let swipeLocked =
    false;


  /* =========================
     OUTILS
     ========================= */


  function makeId() {

    return (
      window.crypto
        ?.randomUUID
        ?.() ||

      `${Date.now()
        .toString(36)}-${Math.random()
        .toString(36)
        .slice(2)}`
    );

  }


  function normalizeUsername(
    value
  ) {

    if (!value) {
      return null;
    }


    let text =
      String(value)
        .normalize(
          "NFKC"
        )
        .trim()
        .replace(
          /^https?:\/\//i,
          ""
        )
        .replace(
          /^www\./i,
          ""
        )
        .replace(
          /^m\./i,
          ""
        );


    if (
      text
        .toLowerCase()
        .startsWith(
          "instagram.com/"
        )
    ) {

      text =
        text.slice(
          "instagram.com/"
            .length
        );

    }


    text =
      text
        .split(
          /[/?#]/
        )[0]
        .replace(
          /^@+/,
          ""
        )
        .trim();


    if (
      !text ||
      text.length > 30
    ) {
      return null;
    }


    if (
      !/^[A-Za-z0-9._]+$/
        .test(text)
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


  function parseUsernames(
    text
  ) {

    const tokens =
      String(
        text || ""
      )
        .split(
          /[\s,;]+/
        )
        .map(
          normalizeUsername
        )
        .filter(
          Boolean
        );


    return [
      ...new Map(
        tokens.map(
          username => [
            username
              .toLowerCase(),
            username
          ]
        )
      ).values()
    ];

  }


  function getProfile(
    id
  ) {

    return (
      state.profiles.find(
        profile =>
          profile.id === id
      ) || null
    );

  }


  function profileExists(
    username
  ) {

    const key =
      username
        .toLowerCase();


    return (
      state.profiles
        .some(
          profile =>
            profile.username
              .toLowerCase() ===
            key
        )
    );

  }


  function uniqueIds(
    list,
    validIds
  ) {

    if (
      !Array.isArray(
        list
      )
    ) {
      return [];
    }


    const seen =
      new Set();


    return list.filter(
      id => {

        if (
          typeof id !==
            "string" ||
          !validIds.has(id) ||
          seen.has(id)
        ) {
          return false;
        }


        seen.add(id);

        return true;

      }
    );

  }


  function toast(
    message
  ) {

    const el =
      $("#toast");


    if (!el) {
      return;
    }


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
        () => {
          el.classList.remove(
            "show"
          );
        },
        2200
      );

  }


  /* =========================
     STORAGE
     ========================= */


  function saveState() {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          state
        )
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

      const raw =
        localStorage.getItem(
          STORAGE_KEY
        );


      if (!raw) {
        return;
      }


      const data =
        JSON.parse(
          raw
        );


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
          .map(
            profile => ({

              id:
                typeof profile.id ===
                  "string" &&
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
                ) ||
                Date.now()

            })
          )
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
          state.profiles
            .map(
              profile =>
                profile.id
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
          validIds
        );


      state.history =
        Array.isArray(
          data.history
        )

          ? data.history
              .filter(
                item =>
                  item &&
                  validIds.has(
                    item.id
                  )
              )
              .map(
                item => ({

                  id:
                    item.id,

                  action:
                    [
                      "saved",
                      "passed",
                      "opened"
                    ].includes(
                      item.action
                    )
                      ? item.action
                      : "opened",

                  at:
                    Number(
                      item.at
                    ) ||
                    Date.now()

                })
              )

          : [];

    } catch (error) {

      console.warn(
        "KIO load error",
        error
      );

    }

  }


  function addProfiles(
    usernames
  ) {

    const added =
      [];


    for (
      const value
      of usernames
    ) {

      if (
        state.profiles.length >=
        MAX_PROFILES
      ) {
        break;
      }


      const username =
        normalizeUsername(
          value
        );


      if (
        !username ||
        profileExists(
          username
        )
      ) {
        continue;
      }


      const profile = {

        id:
          makeId(),

        username,

        createdAt:
          Date.now()

      };


      state.profiles.push(
        profile
      );


      state.queue.push(
        profile.id
      );


      added.push(
        profile
      );

    }


    if (
      added.length
    ) {

      saveState();

      renderAll();

    }


    return added;

  }


  function addHistory(
    id,
    action
  ) {

    state.history =
      state.history.filter(
        item =>
          item.id !== id
      );


    state.history.unshift({

      id,

      action,

      at:
        Date.now()

    });

  }


  function markPassed(
    id
  ) {

    state.queue =
      state.queue.filter(
        profileId =>
          profileId !== id
      );


    addHistory(
      id,
      "passed"
    );


    saveState();

  }


  function markSaved(
    id
  ) {

    state.queue =
      state.queue.filter(
        profileId =>
          profileId !== id
      );


    if (
      !state.saved
        .includes(id)
    ) {

      state.saved.unshift(
        id
      );

    }


    addHistory(
      id,
      "saved"
    );


    saveState();

  }


  /* =========================
     NAVIGATION
     ========================= */


  function showScreen(
    id
  ) {

    $$(".screen")
      .forEach(
        screen => {
          screen
            .classList
            .add(
              "hidden"
            );
        }
      );


    const target =
      document
        .getElementById(
          id
        );


    if (!target) {
      return;
    }


    target
      .classList
      .remove(
        "hidden"
      );


    $("#bottomNav")
      ?.classList
      .toggle(
        "hidden",
        id ===
          "homeScreen"
      );


    $$(".nav-button")
      .forEach(
        button => {

          button
            .classList
            .toggle(
              "active",
              button
                .dataset
                .screen === id
            );

        }
      );


    closeMenu();


    if (
      id ===
      "swipeScreen"
    ) {
      renderDeck();
    }


    if (
      id ===
      "savedScreen"
    ) {
      renderSaved();
    }


    if (
      id ===
      "historyScreen"
    ) {
      renderHistory();
    }


    if (
      id ===
      "importScreen"
    ) {
      renderPhotoPreviews();
    }


    window.scrollTo({

      top: 0,

      behavior:
        "smooth"

    });

  }


  function openMenu() {

    const menu =
      $("#sideMenu");


    if (!menu) {
      return;
    }


    menu.classList.add(
      "open"
    );


    menu.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  function closeMenu() {

    const menu =
      $("#sideMenu");


    if (!menu) {
      return;
    }


    menu.classList.remove(
      "open"
    );


    menu.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  /* =========================
     STICKERS
     ========================= */


  function loadStickerPositions() {

    try {

      return (
        JSON.parse(
          localStorage
            .getItem(
              STICKER_POS_KEY
            ) ||
          "{}"
        ) ||
        {}
      );

    } catch (_) {

      return {};

    }

  }


  function saveStickerPosition(
    index,
    leftPct,
    topPct
  ) {

    try {

      const all =
        loadStickerPositions();


      all[index] = {

        left:
          leftPct,

        top:
          topPct

      };


      localStorage.setItem(
        STICKER_POS_KEY,
        JSON.stringify(
          all
        )
      );

    } catch (_) {}

  }


  function initStickers() {

    const layer =
      $("#floatingStickerLayer");


    if (!layer) {
      return;
    }


    layer.innerHTML =
      "";


    const saved =
      loadStickerPositions();


    const defaults = [

      [2, 18],

      [80, 17],

      [4, 36],

      [82, 35],

      [3, 57],

      [80, 56],

      [8, 76],

      [75, 76],

      [23, 11],

      [61, 9]

    ];


    STICKERS.forEach(
      (
        file,
        index
      ) => {

        const img =
          document
            .createElement(
              "img"
            );


        const pos =
          saved[index] || {

            left:
              defaults[index][0],

            top:
              defaults[index][1]

          };


        const size =
          window.innerWidth < 500

            ? 52 +
              (index % 4) *
                7

            : 65 +
              (index % 4) *
                8;


        img.src =
          file;


        img.alt =
          "";


        img.draggable =
          false;


        img.className =
          "floating-sticker";


        img.style.left =
          `${pos.left}%`;


        img.style.top =
          `${pos.top}%`;


        img.style.width =
          `${size}px`;


        img.style.setProperty(
          "--float-speed",
          `${5 + (index % 4)}s`
        );


        img.style.setProperty(
          "--sticker-rotate",
          `${
            -12 +
            (
              (
                index *
                5
              ) %
              24
            )
          }deg`
        );


        img.style.setProperty(
          "--sticker-rotate-end",
          `${
            -8 +
            (
              (
                index *
                5
              ) %
              24
            )
          }deg`
        );


        makeStickerDraggable(
          img,
          index
        );


        img.addEventListener(
          "error",
          () => {
            img.remove();
          },
          {
            once: true
          }
        );


        layer.appendChild(
          img
        );

      }
    );

  }


  function makeStickerDraggable(
    el,
    index
  ) {

    let timer =
      null;

    let dragging =
      false;

    let pointerId =
      null;

    let offsetX =
      0;

    let offsetY =
      0;


    el.addEventListener(
      "pointerdown",
      event => {

        event.preventDefault();


        pointerId =
          event.pointerId;


        const rect =
          el
            .getBoundingClientRect();


        offsetX =
          event.clientX -
          rect.left;


        offsetY =
          event.clientY -
          rect.top;


        timer =
          setTimeout(
            () => {

              dragging =
                true;


              el.classList.add(
                "dragging"
              );


              try {

                el.setPointerCapture(
                  pointerId
                );

              } catch (_) {}

            },
            180
          );

      }
    );


    el.addEventListener(
      "pointermove",
      event => {

        if (!dragging) {
          return;
        }


        event.preventDefault();


        const maxX =
          Math.max(
            0,
            window.innerWidth -
              el.offsetWidth
          );


        const maxY =
          Math.max(
            0,
            window.innerHeight -
              el.offsetHeight
          );


        const x =
          Math.max(
            0,
            Math.min(
              event.clientX -
                offsetX,
              maxX
            )
          );


        const y =
          Math.max(
            0,
            Math.min(
              event.clientY -
                offsetY,
              maxY
            )
          );


        el.style.left =
          `${x}px`;


        el.style.top =
          `${y}px`;

      }
    );


    function stop(
      event
    ) {

      clearTimeout(
        timer
      );


      timer =
        null;


      if (!dragging) {
        return;
      }


      dragging =
        false;


      el.classList.remove(
        "dragging"
      );


      const rect =
        el
          .getBoundingClientRect();


      const leftPct =
        (
          rect.left /
          Math.max(
            1,
            window.innerWidth
          )
        ) *
        100;


      const topPct =
        (
          rect.top /
          Math.max(
            1,
            window.innerHeight
          )
        ) *
        100;


      saveStickerPosition(
        index,
        leftPct,
        topPct
      );


      try {

        el.releasePointerCapture(
          event.pointerId
        );

      } catch (_) {}

    }


    el.addEventListener(
      "pointerup",
      stop
    );


    el.addEventListener(
      "pointercancel",
      stop
    );

  }


  /* =========================
     AJOUT MANUEL
     ========================= */


  function addManualProfiles() {

    const input =
      $("#manualInput");


    const usernames =
      parseUsernames(
        input?.value ||
        ""
      );


    if (
      !usernames.length
    ) {

      toast(
        "Ajoute au moins un @username."
      );

      return;

    }


    const added =
      addProfiles(
        usernames
      );


    if (
      !added.length
    ) {

      toast(
        "Ces profils sont déjà dans KIO."
      );

      return;

    }


    if (input) {

      input.value =
        "";

    }


    $("#manualPanel")
      ?.classList
      .add(
        "hidden"
      );


    showScreen(
      "swipeScreen"
    );


    toast(
      `${added.length} profil${
        added.length > 1
          ? "s"
          : ""
      } ajouté${
        added.length > 1
          ? "s"
          : ""
      } ✦`
    );


    maybeShowTutorial();

  }


  /* =========================
     PHOTOS
     ========================= */


  function addPhotoFiles(
    fileList
  ) {

    const files =
      [
        ...(fileList || [])
      ]
        .filter(
          file =>
            file.type
              .startsWith(
                "image/"
              )
        );


    for (
      const file
      of files
    ) {

      const duplicate =
        photos.some(
          photo =>
            photo.file.name ===
              file.name &&
            photo.file.size ===
              file.size
        );


      if (duplicate) {
        continue;
      }


      photos.push({

        id:
          makeId(),

        file,

        url:
          URL
            .createObjectURL(
              file
            )

      });

    }


    renderPhotoPreviews();

  }


  function removePhoto(
    id
  ) {

    const item =
      photos.find(
        photo =>
          photo.id === id
      );


    if (item) {

      URL.revokeObjectURL(
        item.url
      );

    }


    photos =
      photos.filter(
        photo =>
          photo.id !== id
      );


    renderPhotoPreviews();

  }


  function clearPhotos() {

    photos.forEach(
      photo => {

        URL.revokeObjectURL(
          photo.url
        );

      }
    );


    photos =
      [];


    detected =
      [];


    const input =
      $("#photoInput");


    if (input) {

      input.value =
        "";

    }


    $("#ocrLoading")
      ?.classList
      .add(
        "hidden"
      );


    $("#ocrResults")
      ?.classList
      .add(
        "hidden"
      );


    renderPhotoPreviews();

  }


  function renderPhotoPreviews() {

    const list =
      $("#photoPreviewList");


    if (!list) {
      return;
    }


    list.innerHTML =
      "";


    photos.forEach(
      item => {

        const wrapper =
          document
            .createElement(
              "div"
            );


        wrapper.className =
          "photo-preview";


        const image =
          document
            .createElement(
              "img"
            );


        image.src =
          item.url;


        image.alt =
          "Capture à analyser";


        const remove =
          document
            .createElement(
              "button"
            );


        remove.type =
          "button";


        remove.textContent =
          "×";


        remove.setAttribute(
          "aria-label",
          "Supprimer cette capture"
        );


        remove.addEventListener(
          "click",
          event => {

            event.preventDefault();

            event.stopPropagation();

            removePhoto(
              item.id
            );

          }
        );


        wrapper.append(
          image,
          remove
        );


        list.appendChild(
          wrapper
        );

      }
    );


    $("#analyseActions")
      ?.classList
      .toggle(
        "hidden",
        photos.length === 0
      );

  }


  /* =========================
     OCR
     ========================= */


  async function loadTesseract() {

    if (
      window.Tesseract
    ) {
      return window.Tesseract;
    }


    if (
      tesseractPromise
    ) {
      return tesseractPromise;
    }


    tesseractPromise =
      new Promise(
        (
          resolve,
          reject
        ) => {

          const script =
            document
              .createElement(
                "script"
              );


          script.src =
            TESSERACT_CDN;


          script.async =
            true;


          script.crossOrigin =
            "anonymous";


          script.onload =
            () => {

              if (
                window.Tesseract
              ) {

                resolve(
                  window.Tesseract
                );

              } else {

                reject(
                  new Error(
                    "Tesseract absent"
                  )
                );

              }

            };


          script.onerror =
            () => {

              reject(
                new Error(
                  "Impossible de charger OCR"
                )
              );

            };


          document.head
            .appendChild(
              script
            );

        }
      );


    return tesseractPromise;

  }


  function updateOCRProgress(
    data
  ) {

    const el =
      $("#ocrProgressText");


    if (!el) {
      return;
    }


    if (
      typeof data ===
      "string"
    ) {

      el.textContent =
        data;

      return;

    }


    const status =
      String(
        data?.status ||
        "Analyse"
      )
        .replaceAll(
          "_",
          " "
        );


    const progress =
      Number(
        data?.progress
      );


    el.textContent =
      Number.isFinite(
        progress
      ) &&
      progress > 0

        ? `${status} — ${Math.round(
            progress *
            100
          )}%`

        : status;

  }


  const OCR_STOP =
    new Set([

      "abonne",

      "abonnes",

      "abonnement",

      "abonnements",

      "followers",

      "following",

      "follow",

      "suggested",

      "suggestions",

      "message",

      "messages",

      "instagram",

      "search",

      "recherche",

      "voir",

      "see",

      "more",

      "plus",

      "people",

      "accounts",

      "account",

      "comptes",

      "compte",

      "profile",

      "profil",

      "reels",

      "posts",

      "story",

      "stories",

      "highlights",

      "highlight",

      "home",

      "accueil",

      "notifications",

      "requested",

      "remove",

      "retirer",

      "close",

      "fermer",

      "mutual",

      "suivre",

      "suivi",

      "suivie",

      "all",

      "tout",

      "pour",

      "vous",

      "nouveau",

      "nouveaux",

      "meta",

      "verified"

    ]);


  function extractUsernamesFromOCR(
    text
  ) {

    const lines =
      String(
        text || ""
      )
        .normalize(
          "NFKC"
        )
        .split(
          /\r?\n/
        )
        .map(
          line =>
            line
              .replace(
                /[|¦]/g,
                "l"
              )
              .replace(
                /\s+/g,
                " "
              )
              .trim()
        )
        .filter(
          Boolean
        );


    const best =
      new Map();


    function addCandidate(
      value,
      score = 0
    ) {

      const username =
        normalizeUsername(
          value
        );


      if (!username) {
        return;
      }


      const key =
        username
          .toLowerCase();


      if (
        OCR_STOP
          .has(key)
      ) {
        return;
      }


      if (
        /^\d+$/
          .test(username)
      ) {
        return;
      }


      if (
        /^[A-Za-z]+$/
          .test(username) &&
        username.length < 5 &&
        score < 9
      ) {
        return;
      }


      if (
        username.length < 4 &&
        score < 9
      ) {
        return;
      }


      const old =
        best.get(
          key
        );


      if (
        !old ||
        score >
          old.score
      ) {

        best.set(
          key,
          {
            username,
            score
          }
        );

      }

    }


    for (
      const line
      of lines
    ) {


      (
        line.match(
          /@[A-Za-z0-9._]{1,30}/g
        ) ||
        []
      )
        .forEach(
          token => {

            addCandidate(
              token,
              10
            );

          }
        );


      (
        line.match(
          /instagram\.com\/[A-Za-z0-9._]{1,30}/gi
        ) ||
        []
      )
        .forEach(
          token => {

            addCandidate(
              token
                .split("/")
                .pop(),
              10
            );

          }
        );


      const pieces =
        line
          .replace(
            /[()[\]{}:,;!?]/g,
            " "
          )
          .split(
            /\s+/
          )
          .map(
            piece =>
              piece
                .replace(
                  /^@/,
                  ""
                )
                .replace(
                  /[^A-Za-z0-9._]/g,
                  ""
                )
          )
          .filter(
            piece =>
              /^[A-Za-z0-9._]{1,30}$/
                .test(
                  piece
                )
          );


      for (
        let i = 0;
        i <
          Math.min(
            pieces.length -
              1,
            3
          );
        i += 1
      ) {

        const a =
          pieces[i];


        const b =
          pieces[
            i + 1
          ];


        const merged =
          a + b;


        if (
          /^[A-Za-z]{2,8}$/
            .test(a) &&

          /^[A-Za-z0-9._]{2,20}$/
            .test(b) &&

          /[0-9._]/
            .test(b) &&

          merged.length <=
            30
        ) {

          addCandidate(
            merged,
            9
          );

        }

      }


      const first =
        pieces[0];


      if (first) {

        let score =
          0;


        if (
          first ===
          first.toLowerCase()
        ) {
          score += 2;
        }


        if (
          /[0-9._]/
            .test(first)
        ) {
          score += 4;
        }


        if (
          first.length >=
          5
        ) {
          score += 2;
        }


        if (
          pieces.length >=
          2
        ) {
          score += 1;
        }


        if (
          score >= 5
        ) {

          addCandidate(
            first,
            score
          );

        }

      }


      const whole =
        line
          .replace(
            /^@/,
            ""
          )
          .trim();


      if (
        /^[A-Za-z0-9._]{5,30}$/
          .test(
            whole
          )
      ) {

        let score =
          5;


        if (
          /[0-9._]/
            .test(
              whole
            )
        ) {
          score += 2;
        }


        addCandidate(
          whole,
          score
        );

      }

    }


    return [
      ...best.values()
    ]
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      )
      .map(
        item =>
          item.username
      )
      .slice(
        0,
        300
      );

  }


  async function analysePhotos() {

    if (
      !photos.length
    ) {

      toast(
        "Ajoute d'abord une capture."
      );

      return;

    }


    $("#ocrLoading")
      ?.classList
      .remove(
        "hidden"
      );


    $("#ocrResults")
      ?.classList
      .add(
        "hidden"
      );


    updateOCRProgress(
      "Chargement de KIO Vision…"
    );


    let worker =
      null;


    try {

      const Tesseract =
        await loadTesseract();


      worker =
        await Tesseract
          .createWorker(
            "eng",
            1,
            {
              logger:
                updateOCRProgress
            }
          );


      try {

        await worker
          .setParameters({

            tessedit_pageseg_mode:
              "11",

            preserve_interword_spaces:
              "1"

          });

      } catch (_) {}


      const texts =
        [];


      for (
        let i = 0;
        i < photos.length;
        i += 1
      ) {

        updateOCRProgress(
          `Capture ${
            i + 1
          }/${photos.length}`
        );


        const result =
          await worker
            .recognize(
              photos[i]
                .file
            );


        texts.push(
          result
            ?.data
            ?.text ||
          ""
        );

      }


      detected =
        extractUsernamesFromOCR(
          texts.join(
            "\n"
          )
        )
          .map(
            username => ({

              username,

              selected:
                true

            })
          );


      renderDetected();


      $("#ocrLoading")
        ?.classList
        .add(
          "hidden"
        );


      $("#ocrResults")
        ?.classList
        .remove(
          "hidden"
        );


      toast(
        detected.length

          ? `${detected.length} compte${
              detected.length > 1
                ? "s"
                : ""
            } détecté${
              detected.length > 1
                ? "s"
                : ""
            } — vérifie les pseudos.`

          : "Aucun pseudo assez fiable détecté."
      );

    } catch (error) {

      console.error(
        "KIO OCR error",
        error
      );


      $("#ocrLoading")
        ?.classList
        .add(
          "hidden"
        );


      toast(
        "L'analyse n'a pas pu démarrer. Vérifie ta connexion."
      );

    } finally {

      if (worker) {

        try {

          await worker
            .terminate();

        } catch (_) {}

      }

    }

  }


  /* =========================
     LISTE OCR
     ========================= */


  function renderDetected() {

    const list =
      $("#detectedUsernameList");


    if (!list) {
      return;
    }


    list.innerHTML =
      "";


    detected.forEach(
      (
        item,
        index
      ) => {

        const row =
          document
            .createElement(
              "label"
            );


        row.className =
          "detected-item";


        const checkbox =
          document
            .createElement(
              "input"
            );


        checkbox.type =
          "checkbox";


        checkbox.checked =
          item.selected;


        const input =
          document
            .createElement(
              "input"
            );


        input.type =
          "text";


        input.className =
          "detected-username-input";


        input.value =
          `@${item.username}`;


        input.autocomplete =
          "off";


        input.spellcheck =
          false;


        input.autocapitalize =
          "off";


        checkbox.addEventListener(
          "change",
          () => {

            detected[index]
              .selected =
              checkbox.checked;


            updateDetectedButton();

          }
        );


        input.addEventListener(
          "input",
          () => {

            detected[index]
              .username =
              input.value
                .replace(
                  /^@+/,
                  ""
                )
                .trim();


            input.classList.remove(
              "invalid"
            );

          }
        );


        input.addEventListener(
          "blur",
          () => {

            const fixed =
              normalizeUsername(
                input.value
              );


            if (!fixed) {

              detected[index]
                .selected =
                false;


              checkbox.checked =
                false;


              input.classList.add(
                "invalid"
              );


              toast(
                "Pseudo invalide — corrige-le avant de l'ajouter."
              );


              updateDetectedButton();

              return;

            }


            detected[index]
              .username =
              fixed;


            input.value =
              `@${fixed}`;


            input.classList.remove(
              "invalid"
            );

          }
        );


        row.append(
          checkbox,
          input
        );


        list.appendChild(
          row
        );

      }
    );


    if (
      $("#detectedCount")
    ) {

      $("#detectedCount")
        .textContent =
        String(
          detected.length
        );

    }


    updateDetectedButton();

  }


  function updateDetectedButton() {

    const selected =
      detected.filter(
        item =>
          item.selected
      ).length;


    const button =
      $("#addDetectedBtn");


    if (!button) {
      return;
    }


    button.textContent =
      selected

        ? `ADD ${selected} TO SWIPE`

        : "SELECT PROFILES";

  }


  function toggleSelectAllDetected() {

    if (
      !detected.length
    ) {
      return;
    }


    const allSelected =
      detected.every(
        item =>
          item.selected
      );


    detected.forEach(
      item => {

        item.selected =
          !allSelected;

      }
    );


    renderDetected();

  }


  function addDetectedProfiles() {

    const selected =
      detected
        .filter(
          item =>
            item.selected
        )
        .map(
          item =>
            normalizeUsername(
              item.username
            )
        )
        .filter(
          Boolean
        );


    if (
      !selected.length
    ) {

      toast(
        "Sélectionne et vérifie au moins un profil."
      );

      return;

    }


    const added =
      addProfiles(
        selected
      );


    if (
      !added.length
    ) {

      toast(
        "Ces profils sont déjà dans KIO."
      );

      return;

    }


    clearPhotos();


    showScreen(
      "swipeScreen"
    );


    toast(
      `${added.length} profil${
        added.length > 1
          ? "s"
          : ""
      } ajouté${
        added.length > 1
          ? "s"
          : ""
      } au swipe ✦`
    );


    maybeShowTutorial();

  }


  /* =========================
     INSTAGRAM
     ========================= */


  function instagramURL(
    username
  ) {

    return (
      `https://www.instagram.com/${encodeURIComponent(
        username
      )}/`
    );

  }


  function previewInstagram(
    id
  ) {

    const profile =
      getProfile(
        id
      );


    if (!profile) {
      return;
    }


    addHistory(
      id,
      "opened"
    );


    saveState();

    updateStats();


    window.location.href =
      instagramURL(
        profile.username
      );

  }


  function saveAndOpenInstagram(
    id
  ) {

    const profile =
      getProfile(
        id
      );


    if (
      !profile ||
      swipeLocked
    ) {
      return;
    }


    swipeLocked =
      true;


    markSaved(
      id
    );


    window.location.href =
      instagramURL(
        profile.username
      );

  }


  /* =========================
     CARTES
     ========================= */


  function hash(
    text
  ) {

    let value =
      0;


    for (
      let i = 0;
      i < text.length;
      i += 1
    ) {

      value =
        text.charCodeAt(i) +
        (
          (
            value << 5
          ) -
          value
        );


      value |= 0;

    }


    return Math.abs(
      value
    );

  }


  function getColors(
    username
  ) {

    const palettes = [

      [
        "#ff70c4",
        "#d89cff"
      ],

      [
        "#ff8bd0",
        "#bc9cff"
      ],

      [
        "#ff69b7",
        "#ffc4e5"
      ],

      [
        "#d79cff",
        "#ff91c8"
      ],

      [
        "#ff9dd5",
        "#9e8cff"
      ],

      [
        "#ef87c9",
        "#c8a6ff"
      ]

    ];


    return (
      palettes[
        hash(
          username
        ) %
        palettes.length
      ]
    );

  }


  function createSwipeCard(
    profile,
    index
  ) {

    const card =
      document
        .createElement(
          "article"
        );


    card.className =
      `swipe-card ${
        index === 0
          ? "active"
          : ""
      }`;


    card.dataset.id =
      profile.id;


    const [
      colorA,
      colorB
    ] =
      getColors(
        profile.username
      );


    card.style.setProperty(
      "--card-a",
      colorA
    );


    card.style.setProperty(
      "--card-b",
      colorB
    );


    card.style.zIndex =
      String(
        30 - index
      );


    if (
      index === 1
    ) {

      card.style.transform =
        "translateY(9px) scale(.98)";


      card.style.opacity =
        ".76";

    }


    if (
      index === 2
    ) {

      card.style.transform =
        "translateY(17px) scale(.96)";


      card.style.opacity =
        ".48";

    }


    const bg =
      document
        .createElement(
          "div"
        );


    bg.className =
      "swipe-card-bg";


    const status =
      document
        .createElement(
          "div"
        );


    status.className =
      "card-status";


    status.textContent =
      "READY";


    const chip =
      document
        .createElement(
          "div"
        );


    chip.className =
      "highlight-chip";


    chip.textContent =
      "TAP USERNAME TO CHECK";


    const like =
      document
        .createElement(
          "div"
        );


    like.className =
      "swipe-label like-label";


    like.textContent =
      "SAVE ♥";


    const pass =
      document
        .createElement(
          "div"
        );


    pass.className =
      "swipe-label pass-label";


    pass.textContent =
      "✕ PASS";


    const profileBox =
      document
        .createElement(
          "div"
        );


    profileBox.className =
      "card-profile";


    const label =
      document
        .createElement(
          "span"
        );


    label.className =
      "card-number";


    label.textContent =
      "KIO PROFILE";


    const usernameButton =
      document
        .createElement(
          "button"
        );


    usernameButton.className =
      "kio-username-link";


    usernameButton.type =
      "button";


    usernameButton.textContent =
      `@${profile.username} ↗`;


    const help =
      document
        .createElement(
          "p"
        );


    help.textContent =
      "Appuie sur le pseudo pour vérifier. Swipe à droite pour SAVE + Instagram.";


    usernameButton
      .addEventListener(
        "pointerdown",
        event => {

          event.stopPropagation();

        }
      );


    usernameButton
      .addEventListener(
        "click",
        event => {

          event.preventDefault();

          event.stopPropagation();


          previewInstagram(
            profile.id
          );

        }
      );


    profileBox.append(
      label,
      usernameButton,
      help
    );


    card.append(
      bg,
      status,
      chip,
      like,
      pass,
      profileBox
    );


    if (
      index === 0
    ) {

      enableSwipe(
        card,
        profile.id
      );

    }


    return card;

  }


  function renderDeck() {

    const deck =
      $("#deck");


    const empty =
      $("#emptyDeck");


    if (!deck) {
      return;
    }


    $$(".swipe-card", deck)
      .forEach(
        card => {

          card.remove();

        }
      );


    resetSwipeMeters();


    state.queue =
      state.queue.filter(
        id =>
          getProfile(id)
      );


    if (
      !state.queue.length
    ) {

      empty
        ?.classList
        .remove(
          "hidden"
        );


      updateStats();

      return;

    }


    empty
      ?.classList
      .add(
        "hidden"
      );


    state.queue
      .slice(
        0,
        3
      )
      .forEach(
        (
          id,
          index
        ) => {

          const profile =
            getProfile(
              id
            );


          if (!profile) {
            return;
          }


          deck.insertBefore(
            createSwipeCard(
              profile,
              index
            ),
            empty ||
            null
          );

        }
      );


    updateStats();

  }


  /* =========================
     BARRES
     ========================= */


  function resetSwipeMeters() {

    if (
      $("#passMeterFill")
    ) {

      $("#passMeterFill")
        .style.width =
        "0%";

    }


    if (
      $("#saveMeterFill")
    ) {

      $("#saveMeterFill")
        .style.width =
        "0%";

    }

  }


  function setSwipeMeters(
    dx,
    threshold
  ) {

    const pass =
      $("#passMeterFill");


    const save =
      $("#saveMeterFill");


    const value =
      Math.min(
        Math.abs(dx) /
          threshold,
        1
      ) *
      100;


    if (
      dx < 0
    ) {

      if (pass) {

        pass.style.width =
          `${value}%`;

      }


      if (save) {

        save.style.width =
          "0%";

      }

    } else if (
      dx > 0
    ) {

      if (save) {

        save.style.width =
          `${value}%`;

      }


      if (pass) {

        pass.style.width =
          "0%";

      }

    } else {

      resetSwipeMeters();

    }

  }


  /* =========================
     SWIPE
     ========================= */


  function enableSwipe(
    card,
    id
  ) {

    let dragging =
      false;


    let startX =
      0;


    let startY =
      0;


    let currentX =
      0;


    const threshold =
      Math.min(
        100,
        window.innerWidth *
          0.23
      );


    const like =
      $(".like-label", card);


    const pass =
      $(".pass-label", card);


    card.addEventListener(
      "pointerdown",
      event => {

        if (
          swipeLocked ||
          event.target.closest(
            "button,a,input,textarea"
          )
        ) {
          return;
        }


        dragging =
          true;


        startX =
          event.clientX;


        startY =
          event.clientY;


        currentX =
          0;


        card.classList.add(
          "dragging"
        );


        try {

          card.setPointerCapture(
            event.pointerId
          );

        } catch (_) {}

      }
    );


    card.addEventListener(
      "pointermove",
      event => {

        if (!dragging) {
          return;
        }


        const dx =
          event.clientX -
          startX;


        const dy =
          event.clientY -
          startY;


        if (
          Math.abs(dy) >
            Math.abs(dx) *
              1.6 &&
          Math.abs(dx) <
            18
        ) {
          return;
        }


        currentX =
          dx;


        const limited =
          Math.max(
            -135,
            Math.min(
              dx,
              135
            )
          );


        const rotate =
          limited /
          45;


        card.style.transform =
          `translateX(${limited}px) translateY(${Math.abs(limited) * 0.015}px) rotate(${rotate}deg)`;


        if (like) {

          like.style.opacity =
            String(
              Math.min(
                Math.max(
                  dx /
                    threshold,
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
                  -dx /
                    threshold,
                  0
                ),
                1
              )
            );

        }


        setSwipeMeters(
          dx,
          threshold
        );

      }
    );


    function finish(
      event
    ) {

      if (!dragging) {
        return;
      }


      dragging =
        false;


      card.classList.remove(
        "dragging"
      );


      try {

        card.releasePointerCapture(
          event.pointerId
        );

      } catch (_) {}


      if (
        currentX >=
        threshold
      ) {

        saveAndOpenInstagram(
          id
        );

        return;

      }


      if (
        currentX <=
        -threshold
      ) {

        animatePass(
          card,
          id
        );

        return;

      }


      card.style.transition =
        "transform .2s ease";


      card.style.transform =
        "translateX(0) translateY(0) rotate(0deg)";


      if (like) {

        like.style.opacity =
          "0";

      }


      if (pass) {

        pass.style.opacity =
          "0";

      }


      resetSwipeMeters();


      setTimeout(
        () => {

          card.style.transition =
            "";

        },
        210
      );

    }


    card.addEventListener(
      "pointerup",
      finish
    );


    card.addEventListener(
      "pointercancel",
      finish
    );

  }


  function animatePass(
    card,
    id
  ) {

    if (
      !card ||
      swipeLocked
    ) {
      return;
    }


    swipeLocked =
      true;


    card.style.transition =
      "transform .22s ease-out, opacity .18s ease-out";


    card.style.transform =
      "translateX(-125%) rotate(-6deg) scale(.98)";


    card.style.opacity =
      "0";


    setSwipeMeters(
      -100,
      100
    );


    setTimeout(
      () => {

        markPassed(
          id
        );


        renderAll();


        resetSwipeMeters();


        swipeLocked =
          false;

      },
      220
    );

  }


  function passCurrent() {

    const id =
      state.queue[0];


    if (!id) {

      toast(
        "Plus aucun profil dans la file."
      );

      return;

    }


    animatePass(
      $(".swipe-card.active"),
      id
    );

  }


  function saveCurrent() {

    const id =
      state.queue[0];


    if (!id) {

      toast(
        "Plus aucun profil dans la file."
      );

      return;

    }


    saveAndOpenInstagram(
      id
    );

  }


  function openCurrentInstagram() {

    const id =
      state.queue[0];


    if (!id) {

      toast(
        "Ajoute d'abord des profils."
      );

      return;

    }


    previewInstagram(
      id
    );

  }


  /* =========================
     SAVED / HISTORY
     ========================= */


  function makeLibraryCard(
    profile,
    label
  ) {

    const card =
      document
        .createElement(
          "article"
        );


    card.className =
      "library-card";


    const [
      colorA,
      colorB
    ] =
      getColors(
        profile.username
      );


    card.style.setProperty(
      "--card-a",
      colorA
    );


    card.style.setProperty(
      "--card-b",
      colorB
    );


    const button =
      document
        .createElement(
          "button"
        );


    button.type =
      "button";


    const info =
      document
        .createElement(
          "div"
        );


    info.className =
      "library-info";


    const strong =
      document
        .createElement(
          "strong"
        );


    strong.textContent =
      `@${profile.username} ↗`;


    const small =
      document
        .createElement(
          "small"
        );


    small.textContent =
      label;


    info.append(
      strong,
      small
    );


    button.appendChild(
      info
    );


    button.addEventListener(
      "click",
      () => {

        previewInstagram(
          profile.id
        );

      }
    );


    card.appendChild(
      button
    );


    return card;

  }


  function renderSaved() {

    const grid =
      $("#savedGrid");


    if (!grid) {
      return;
    }


    grid.innerHTML =
      "";


    const profiles =
      state.saved
        .map(
          getProfile
        )
        .filter(
          Boolean
        );


    profiles.forEach(
      profile => {

        grid.appendChild(
          makeLibraryCard(
            profile,
            "SAVED PROFILE"
          )
        );

      }
    );


    $("#emptySaved")
      ?.classList
      .toggle(
        "hidden",
        profiles.length >
          0
      );


    if (
      $("#savedCount")
    ) {

      $("#savedCount")
        .textContent =
        String(
          profiles.length
        );

    }

  }


  function renderHistory() {

    const grid =
      $("#historyGrid");


    if (!grid) {
      return;
    }


    grid.innerHTML =
      "";


    const entries =
      state.history
        .filter(
          item =>
            getProfile(
              item.id
            )
        );


    entries.forEach(
      item => {

        const profile =
          getProfile(
            item.id
          );


        const label =
          item.action ===
          "saved"

            ? "SAVED"

            : item.action ===
              "passed"

              ? "PASSED"

              : "OPENED ON INSTAGRAM";


        grid.appendChild(
          makeLibraryCard(
            profile,
            label
          )
        );

      }
    );


    $("#emptyHistory")
      ?.classList
      .toggle(
        "hidden",
        entries.length >
          0
      );


    if (
      $("#historyCount")
    ) {

      $("#historyCount")
        .textContent =
        String(
          entries.length
        );

    }

  }


  function updateStats() {

    const total =
      state.profiles.length;


    const saved =
      state.saved
        .filter(
          id =>
            getProfile(id)
        )
        .length;


    const left =
      state.queue
        .filter(
          id =>
            getProfile(id)
        )
        .length;


    const seen =
      state.history
        .filter(
          item =>
            getProfile(
              item.id
            )
        )
        .length;


    const processed =
      Math.max(
        total - left,
        0
      );


    const current =
      left

        ? Math.min(
            processed +
              1,
            total
          )

        : total;


    const values = {

      queueCount:
        left,

      currentNumber:
        current,

      totalNumber:
        total,

      savedCount:
        saved,

      historyCount:
        seen,

      statTotal:
        total,

      statSeen:
        seen,

      statSaved:
        saved,

      statLeft:
        left

    };


    Object.entries(
      values
    )
      .forEach(
        (
          [
            id,
            value
          ]
        ) => {

          const el =
            document
              .getElementById(
                id
              );


          if (el) {

            el.textContent =
              String(
                value
              );

          }

        }
      );

  }


  function renderAll() {

    renderDeck();

    renderSaved();

    renderHistory();

    updateStats();

  }


  /* =========================
     TUTORIEL
     ========================= */


  function maybeShowTutorial() {

    if (
      !state.queue.length
    ) {
      return;
    }


    try {

      if (
        localStorage
          .getItem(
            TUTORIAL_KEY
          ) ===
        "1"
      ) {
        return;
      }

    } catch (_) {}


    setTimeout(
      () => {

        $("#swipeTutorial")
          ?.classList
          .remove(
            "hidden"
          );

      },
      250
    );

  }


  function closeTutorial() {

    $("#swipeTutorial")
      ?.classList
      .add(
        "hidden"
      );


    try {

      localStorage.setItem(
        TUTORIAL_KEY,
        "1"
      );

    } catch (_) {}

  }


  /* =========================
     RESET
     ========================= */


  function clearHistory() {

    if (
      !state.history.length
    ) {

      toast(
        "L'historique est déjà vide."
      );

      return;

    }


    if (
      !confirm(
        "Vider uniquement l'historique ?"
      )
    ) {
      return;
    }


    state.history =
      [];


    saveState();

    renderAll();


    toast(
      "Historique vidé."
    );

  }


  function resetEverything() {

    if (
      !confirm(
        "Supprimer tous les profils, Saved et l'historique KIO ?"
      )
    ) {
      return;
    }


    state = {

      profiles: [],

      queue: [],

      saved: [],

      history: []

    };


    try {

      localStorage.removeItem(
        STORAGE_KEY
      );


      localStorage.removeItem(
        TUTORIAL_KEY
      );


      localStorage.removeItem(
        STICKER_POS_KEY
      );

    } catch (_) {}


    clearPhotos();


    if (
      $("#manualInput")
    ) {

      $("#manualInput")
        .value =
        "";

    }


    renderAll();

    initStickers();


    showScreen(
      "homeScreen"
    );


    toast(
      "KIO remis à zéro ✦"
    );

  }


  /* =========================
     EVENTS
     ========================= */


  function bindEvents() {

    $("#logoBtn")
      ?.addEventListener(
        "click",
        () => {

          showScreen(
            "homeScreen"
          );

        }
      );


    $("#queueBubble")
      ?.addEventListener(
        "click",
        () => {

          showScreen(
            "swipeScreen"
          );

        }
      );


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


    $("#goImportBtn")
      ?.addEventListener(
        "click",
        () => {

          showScreen(
            "importScreen"
          );

        }
      );


    $("#emptyImportBtn")
      ?.addEventListener(
        "click",
        () => {

          showScreen(
            "importScreen"
          );

        }
      );


    $("#manualToggleBtn")
      ?.addEventListener(
        "click",
        () => {

          $("#manualPanel")
            ?.classList
            .toggle(
              "hidden"
            );

        }
      );


    $("#addManualBtn")
      ?.addEventListener(
        "click",
        addManualProfiles
      );


    $("#photoInput")
      ?.addEventListener(
        "change",
        event => {

          addPhotoFiles(
            event.target.files
          );

        }
      );


    $("#clearPhotosBtn")
      ?.addEventListener(
        "click",
        clearPhotos
      );


    $("#analysePhotosBtn")
      ?.addEventListener(
        "click",
        analysePhotos
      );


    $("#selectAllBtn")
      ?.addEventListener(
        "click",
        toggleSelectAllDetected
      );


    $("#addDetectedBtn")
      ?.addEventListener(
        "click",
        addDetectedProfiles
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


    $("#openInstagramBtn")
      ?.addEventListener(
        "click",
        openCurrentInstagram
      );


    $("#closeTutorialBtn")
      ?.addEventListener(
        "click",
        closeTutorial
      );


    $$(
      ".back-button[data-screen], .nav-button[data-screen]"
    )
      .forEach(
        button => {

          button
            .addEventListener(
              "click",
              () => {

                showScreen(
                  button
                    .dataset
                    .screen
                );

              }
            );

        }
      );


    $("#menuImportBtn")
      ?.addEventListener(
        "click",
        () => {

          showScreen(
            "importScreen"
          );

        }
      );


    $("#menuNewScanBtn")
      ?.addEventListener(
        "click",
        () => {

          showScreen(
            "homeScreen"
          );

        }
      );


    $("#menuSavedBtn")
      ?.addEventListener(
        "click",
        () => {

          showScreen(
            "savedScreen"
          );

        }
      );


    $("#menuHistoryBtn")
      ?.addEventListener(
        "click",
        () => {

          showScreen(
            "historyScreen"
          );

        }
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
      event => {

        if (
          event.key ===
          "Escape"
        ) {

          closeMenu();

        }


        const swipeVisible =
          !$("#swipeScreen")
            ?.classList
            .contains(
              "hidden"
            );


        if (
          !swipeVisible
        ) {
          return;
        }


        if (
          event.key ===
          "ArrowLeft"
        ) {

          passCurrent();

        }


        if (
          event.key ===
          "ArrowRight"
        ) {

          saveCurrent();

        }

      }
    );

  }


  /* =========================
     START
     ========================= */


  function startApp() {

    loadState();

    bindEvents();

    initStickers();

    renderAll();


    showScreen(
      state.queue.length

        ? "swipeScreen"

        : "homeScreen"
    );


    console.log(
      "KIO LOVE READY ✦"
    );

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      startApp,
      {
        once: true
      }
    );

  } else {

    startApp();

  }

})();
