(() => {
  "use strict";

  const STORAGE_KEY = "kio-love-final-v2";
  const TUTORIAL_KEY = "kio-love-tutorial-seen";
  const TESSERACT_CDN =
    "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";

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
    history: [],
    seed: ""
  };

  let photos = [];
  let detected = [];

  let toastTimer = null;
  let swipeLocked = false;
  let tesseractPromise = null;


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
        "KIO save error",
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

      const data =
        JSON.parse(raw);

      if (
        !data ||
        !Array.isArray(data.profiles)
      ) {
        return;
      }

      state.profiles =
        data.profiles
          .map((profile) => ({
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
            (profile) =>
              profile.username
          )
          .slice(
            0,
            MAX_PROFILES
          );


      const validIds =
        new Set(
          state.profiles.map(
            (profile) =>
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
                (history) =>
                  history &&
                  validIds.has(
                    history.id
                  )
              )
              .map(
                (history) => ({
                  id:
                    history.id,

                  action:
                    [
                      "saved",
                      "passed",
                      "opened"
                    ].includes(
                      history.action
                    )
                      ? history.action
                      : "opened",

                  at:
                    Number(
                      history.at
                    ) ||
                    Date.now()
                })
              )
          : [];


      state.seed =
        typeof data.seed ===
        "string"
          ? data.seed
          : "";

    } catch (error) {
      console.warn(
        "KIO load error",
        error
      );
    }
  }


  function uniqueIds(
    list,
    validIds
  ) {
    if (!Array.isArray(list)) {
      return [];
    }

    const seen =
      new Set();

    return list.filter(
      (id) => {
        if (
          typeof id !== "string" ||
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


  /* =========================================================
     USERNAMES
     ========================================================= */

  function normalizeUsername(
    value
  ) {
    if (!value) {
      return null;
    }


    let text =
      String(value)
        .normalize("NFKC")
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
        .split(/[/?#]/)[0]
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
      !/^[A-Za-z0-9._]+$/.test(
        text
      )
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
    const matches =
      String(text || "")
        .match(
          /(?:https?:\/\/(?:www\.)?instagram\.com\/)?@?[A-Za-z0-9._]{1,30}/gi
        ) || [];


    const seen =
      new Set();

    const output = [];


    for (
      const token of matches
    ) {
      const username =
        normalizeUsername(
          token
        );


      if (!username) {
        continue;
      }


      const key =
        username
          .toLowerCase();


      if (
        seen.has(key)
      ) {
        continue;
      }


      seen.add(key);

      output.push(
        username
      );
    }


    return output;
  }


  function makeId() {
    if (
      window.crypto
        ?.randomUUID
    ) {
      return crypto.randomUUID();
    }


    return (
      Date.now()
        .toString(36) +
      "-" +
      Math.random()
        .toString(36)
        .slice(2)
    );
  }


  function getProfile(
    id
  ) {
    return (
      state.profiles.find(
        (profile) =>
          profile.id === id
      ) || null
    );
  }


  function profileExists(
    username
  ) {
    const key =
      username.toLowerCase();


    return state.profiles.some(
      (profile) =>
        profile.username
          .toLowerCase() === key
    );
  }


  function addProfiles(
    usernames
  ) {
    const added = [];


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
        (history) =>
          history.id !== id
      );


    state.history.unshift({
      id,
      action,
      at:
        Date.now()
    });
  }


  function processCard(
    id,
    action
  ) {
    state.queue =
      state.queue.filter(
        (profileId) =>
          profileId !== id
      );


    if (
      action === "saved" &&
      !state.saved.includes(
        id
      )
    ) {
      state.saved.unshift(
        id
      );
    }


    addHistory(
      id,
      action
    );


    saveState();

    renderAll();

    refreshFloatingStickers();
  }


  /* =========================================================
     TOAST
     ========================================================= */

  function toast(
    message
  ) {
    const element =
      $("#toast");


    if (!element) {
      return;
    }


    element.textContent =
      message;


    element.classList.add(
      "show"
    );


    clearTimeout(
      toastTimer
    );


    toastTimer =
      setTimeout(
        () => {
          element
            .classList
            .remove(
              "show"
            );
        },
        2300
      );
  }


  /* =========================================================
     NAVIGATION
     ========================================================= */

  function showScreen(
    id
  ) {
    $$(".screen").forEach(
      (screen) =>
        screen
          .classList
          .add(
            "hidden"
          )
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
        (button) => {
          button
            .classList
            .toggle(
              "active",
              button.dataset
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
      behavior: "smooth"
    });
  }


  function openMenu() {
    const menu =
      $("#sideMenu");


    if (!menu) {
      return;
    }


    menu
      .classList
      .add(
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


    menu
      .classList
      .remove(
        "open"
      );


    menu.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  /* =========================================================
     DECORATION / STICKERS
     ========================================================= */

  function random(
    min,
    max
  ) {
    return (
      Math.random() *
        (max - min) +
      min
    );
  }


  function hash(
    text
  ) {
    let value = 0;


    for (
      let i = 0;
      i < text.length;
      i += 1
    ) {
      value =
        text.charCodeAt(i) +
        ((value << 5) -
          value);


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
        "#ff4eae",
        "#9a5cff"
      ],

      [
        "#ff70c4",
        "#e65cff"
      ],

      [
        "#ff388e",
        "#ff9bcf"
      ],

      [
        "#d26cff",
        "#ff4ca6"
      ],

      [
        "#ff85c9",
        "#7658ff"
      ],

      [
        "#ee58ac",
        "#b789ff"
      ],

      [
        "#ff659f",
        "#dd8cff"
      ],

      [
        "#ff9cd0",
        "#955aff"
      ]
    ];


    return palettes[
      hash(username) %
        palettes.length
    ];
  }


  function refreshFloatingStickers() {
    const layer =
      $("#floatingStickerLayer");


    if (!layer) {
      return;
    }


    layer.innerHTML = "";


    const count =
      window.innerWidth < 500
        ? 4
        : 6;


    const files =
      [...STICKERS]
        .sort(
          () =>
            Math.random() -
            0.5
        )
        .slice(
          0,
          count
        );


    files.forEach(
      (
        file,
        index
      ) => {
        const image =
          document
            .createElement(
              "img"
            );


        image.className =
          "floating-sticker";


        image.src =
          file;


        image.alt =
          "";


        const left =
          index % 2 === 0
            ? random(
                -3,
                17
              )
            : random(
                80,
                94
              );


        image.style.left =
          `${left}%`;


        image.style.top =
          `${random(
            12,
            84
          )}%`;


        image.style.setProperty(
          "--sticker-size",
          `${Math.round(
            random(
              55,
              105
            )
          )}px`
        );


        image.style.setProperty(
          "--sticker-opacity",
          random(
            0.2,
            0.48
          ).toFixed(2)
        );


        image.style.setProperty(
          "--sticker-speed",
          `${random(
            4.5,
            8
          ).toFixed(1)}s`
        );


        image.style.setProperty(
          "--sticker-rotate",
          `${random(
            -14,
            2
          ).toFixed(1)}deg`
        );


        image.style.setProperty(
          "--sticker-rotate-end",
          `${random(
            2,
            14
          ).toFixed(1)}deg`
        );


        image.addEventListener(
          "error",
          () =>
            image.remove(),
          {
            once: true
          }
        );


        layer.appendChild(
          image
        );
      }
    );
  }


  function addCardStickers(
    card
  ) {
    const files =
      [...STICKERS]
        .sort(
          () =>
            Math.random() -
            0.5
        )
        .slice(
          0,
          2
        );


    files.forEach(
      (
        file,
        index
      ) => {
        const image =
          document
            .createElement(
              "img"
            );


        image.src =
          file;


        image.alt =
          "";


        image.draggable =
          false;


        Object.assign(
          image.style,
          {
            position:
              "absolute",

            zIndex:
              "4",

            width:
              index === 0
                ? "92px"
                : "72px",

            height:
              "auto",

            opacity:
              index === 0
                ? "0.36"
                : "0.28",

            pointerEvents:
              "none",

            filter:
              "drop-shadow(3px 4px 0 rgba(0,0,0,.15))",

            left:
              index === 0
                ? "8px"
                : "auto",

            right:
              index === 0
                ? "auto"
                : "9px",

            top:
              index === 0
                ? "88px"
                : "43%",

            transform:
              `rotate(${
                index === 0
                  ? -11
                  : 9
              }deg)`
          }
        );


        image.addEventListener(
          "error",
          () =>
            image.remove(),
          {
            once: true
          }
        );


        card.appendChild(
          image
        );
      }
    );
  }


  /* =========================================================
     MANUAL / SEED
     ========================================================= */

  function addManualProfiles() {
    const input =
      $("#manualInput");


    const usernames =
      parseUsernames(
        input?.value || ""
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
      input.value = "";
    }


    $("#manualPanel")
      ?.classList
      .add(
        "hidden"
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


    showScreen(
      "swipeScreen"
    );


    maybeShowTutorial();
  }


  function startFromSeed() {
    const username =
      normalizeUsername(
        $("#seedInput")
          ?.value || ""
      );


    if (!username) {
      toast(
        "Entre un @username valide."
      );

      return;
    }


    state.seed =
      username;


    const added =
      addProfiles([
        username
      ]);


    saveState();


    if (
      !added.length &&
      !state.queue.length
    ) {
      toast(
        "Ce compte est déjà enregistré."
      );

      return;
    }


    toast(
      "Compte ajouté. La découverte auto viendra avec le backend ✦"
    );


    showScreen(
      "swipeScreen"
    );


    maybeShowTutorial();
  }


  /* =========================================================
     PHOTO IMPORT
     ========================================================= */

  function addPhotoFiles(
    fileList
  ) {
    const files =
      [...(fileList || [])]
        .filter(
          (file) =>
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
          (photo) =>
            photo.file.name ===
              file.name &&
            photo.file.size ===
              file.size
        );


      if (
        duplicate
      ) {
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
        (photo) =>
          photo.id === id
      );


    if (item) {
      URL
        .revokeObjectURL(
          item.url
        );
    }


    photos =
      photos.filter(
        (photo) =>
          photo.id !== id
      );


    renderPhotoPreviews();
  }


  function clearPhotos() {
    photos.forEach(
      (photo) =>
        URL
          .revokeObjectURL(
            photo.url
          )
    );


    photos = [];

    detected = [];


    const input =
      $("#photoInput");


    if (input) {
      input.value = "";
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


    list.innerHTML = "";


    photos.forEach(
      (item) => {
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
          (event) => {
            event
              .preventDefault();


            event
              .stopPropagation();


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


  async function loadTesseract() {
    if (
      window.Tesseract
    ) {
      return window
        .Tesseract;
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
                  window
                    .Tesseract
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
            () =>
              reject(
                new Error(
                  "Impossible de charger l'OCR"
                )
              );


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
    const element =
      $("#ocrProgressText");


    if (!element) {
      return;
    }


    if (
      typeof data ===
      "string"
    ) {
      element.textContent =
        data;

      return;
    }


    const status =
      String(
        data?.status ||
          "Analyse"
      ).replaceAll(
        "_",
        " "
      );


    const progress =
      Number(
        data?.progress
      );


    element.textContent =
      Number.isFinite(
        progress
      ) &&
      progress > 0
        ? `${status} — ${Math.round(
            progress * 100
          )}%`
        : status;
  }


  const OCR_STOP =
    new Set([
      "abonne",
      "abonnes",
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
      "all",
      "tout"
    ]);


  function extractUsernamesFromOCR(
    text
  ) {
    const lines =
      String(text || "")
        .normalize(
          "NFKC"
        )
        .split(
          /\r?\n/
        )
        .map(
          (line) =>
            line.trim()
        )
        .filter(Boolean);


    const candidates =
      [];


    for (
      const rawLine
      of lines
    ) {
      const line =
        rawLine
          .replace(
            /[|¦]/g,
            "I"
          )
          .trim();


      (
        line.match(
          /@[A-Za-z0-9._]{1,30}/g
        ) || []
      ).forEach(
        (token) => {
          candidates.push({
            value:
              token,

            score:
              6
          });
        }
      );


      const clean =
        line.replace(
          /^@/,
          ""
        );


      if (
        /^[A-Za-z0-9._]{1,30}$/.test(
          clean
        )
      ) {
        let score =
          2;


        if (
          /[0-9._]/.test(
            clean
          )
        ) {
          score += 2;
        }


        candidates.push({
          value:
            clean,

          score
        });
      }


      (
        line.match(
          /[A-Za-z0-9._]{2,30}/g
        ) || []
      ).forEach(
        (token) => {
          let score =
            0;


          if (
            /[0-9]/.test(
              token
            )
          ) {
            score += 2;
          }


          if (
            /[._]/.test(
              token
            )
          ) {
            score += 2;
          }


          if (
            token.length >=
            4
          ) {
            score += 1;
          }


          if (
            score >= 3
          ) {
            candidates.push({
              value:
                token,

              score
            });
          }
        }
      );
    }


    const best =
      new Map();


    candidates.forEach(
      (candidate) => {
        const username =
          normalizeUsername(
            candidate.value
          );


        if (!username) {
          return;
        }


        const key =
          username
            .toLowerCase();


        if (
          OCR_STOP.has(
            key
          )
        ) {
          return;
        }


        if (
          /^\d+$/.test(
            username
          )
        ) {
          return;
        }


        const old =
          best.get(
            key
          );


        if (
          !old ||
          candidate.score >
            old.score
        ) {
          best.set(
            key,
            {
              username,
              score:
                candidate.score
            }
          );
        }
      }
    );


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
        (item) =>
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
          result?.data
            ?.text || ""
        );
      }


      detected =
        extractUsernamesFromOCR(
          texts.join(
            "\n"
          )
        ).map(
          (username) => ({
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


      if (
        detected.length
      ) {
        toast(
          `${detected.length} compte${
            detected.length >
            1
              ? "s"
              : ""
          } détecté${
            detected.length >
            1
              ? "s"
              : ""
          } ✦`
        );
      } else {
        toast(
          "Aucun pseudo clair détecté. Essaie une capture plus nette."
        );
      }

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


  function renderDetected() {
    const list =
      $("#detectedUsernameList");


    if (!list) {
      return;
    }


    list.innerHTML = "";


    detected.forEach(
      (
        item,
        index
      ) => {
        const label =
          document
            .createElement(
              "label"
            );


        label.className =
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


        checkbox
          .addEventListener(
            "change",
            () => {
              detected[
                index
              ].selected =
                checkbox.checked;


              updateDetectedButton();
            }
          );


        const text =
          document
            .createElement(
              "span"
            );


        text.textContent =
          `@${item.username}`;


        label.append(
          checkbox,
          text
        );


        list.appendChild(
          label
        );
      }
    );


    const count =
      $("#detectedCount");


    if (count) {
      count.textContent =
        String(
          detected.length
        );
    }


    updateDetectedButton();
  }


  function updateDetectedButton() {
    const selected =
      detected.filter(
        (item) =>
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
        (item) =>
          item.selected
      );


    detected.forEach(
      (item) => {
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
          (item) =>
            item.selected
        )
        .map(
          (item) =>
            item.username
        );


    if (
      !selected.length
    ) {
      toast(
        "Sélectionne au moins un profil."
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


    showScreen(
      "swipeScreen"
    );


    maybeShowTutorial();
  }


  /* =========================================================
     INSTAGRAM
     ========================================================= */

  function openInstagram(
    id
  ) {
    const profile =
      getProfile(
        id
      );


    if (!profile) {
      return;
    }


    const link =
      document
        .createElement(
          "a"
        );


    link.href =
      `https://www.instagram.com/${encodeURIComponent(
        profile.username
      )}/`;


    link.target =
      "_blank";


    link.rel =
      "noopener noreferrer";


    document.body
      .appendChild(
        link
      );


    link.click();

    link.remove();


    addHistory(
      id,
      "opened"
    );


    saveState();

    renderHistory();

    updateStats();
  }


  /* =========================================================
     SWIPE CARDS
     ========================================================= */

  function escapeHTML(
    value
  ) {
    return String(value)
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
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
        "translateY(10px) scale(.975)";


      card.style.opacity =
        ".78";
    }


    if (
      index === 2
    ) {
      card.style.transform =
        "translateY(19px) scale(.95)";


      card.style.opacity =
        ".5";
    }


    const number =
      state.profiles.findIndex(
        (item) =>
          item.id ===
          profile.id
      ) + 1;


    card.innerHTML = `
      <div class="swipe-card-bg"></div>

      <div class="card-status">
        READY
      </div>

      <div class="highlight-chip">
        CHECK HIGHLIGHTS
      </div>

      <div class="swipe-label like-label">
        SAVE ♥
      </div>

      <div class="swipe-label pass-label">
        ✕ PASS
      </div>

      <div class="card-profile">

        <span class="card-number">
          SIGNAL ${String(
            Math.max(
              number,
              1
            )
          ).padStart(
            2,
            "0"
          )}
        </span>

        <h3>
          @${escapeHTML(
            profile.username
          )}
        </h3>

        <p>
          Ouvre Instagram pour vérifier le profil et ses stories à la une.
        </p>

      </div>
    `;


    addCardStickers(
      card
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
        (card) =>
          card.remove()
      );


    resetSwipeMeters();


    state.queue =
      state.queue.filter(
        (id) =>
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
            empty || null
          );
        }
      );


    updateStats();
  }


  function resetSwipeMeters() {
    const pass =
      $("#passMeterFill");


    const save =
      $("#saveMeterFill");


    if (pass) {
      pass.style.width =
        "0%";
    }


    if (save) {
      save.style.width =
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
      ) * 100;


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
        105,
        window.innerWidth *
          0.24
      );


    const like =
      $(".like-label", card);


    const pass =
      $(".pass-label", card);


    function pointerDown(
      event
    ) {
      if (
        swipeLocked
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


      card
        .classList
        .add(
          "dragging"
        );


      try {
        card
          .setPointerCapture(
            event.pointerId
          );
      } catch (_) {}
    }


    function pointerMove(
      event
    ) {
      if (
        !dragging
      ) {
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
            1.5 &&
        Math.abs(dx) <
          20
      ) {
        return;
      }


      currentX =
        dx;


      card.style.transform =
        `translate(${dx}px, ${
          Math.abs(dx) *
          0.025
        }px) rotate(${
          dx / 18
        }deg)`;


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


    function pointerUp(
      event
    ) {
      if (
        !dragging
      ) {
        return;
      }


      dragging =
        false;


      card
        .classList
        .remove(
          "dragging"
        );


      try {
        card
          .releasePointerCapture(
            event.pointerId
          );
      } catch (_) {}


      if (
        currentX >=
        threshold
      ) {
        animateSwipe(
          card,
          "right",
          () => {
            processCard(
              id,
              "saved"
            );


            toast(
              "Saved ♥"
            );
          }
        );


        return;
      }


      if (
        currentX <=
        -threshold
      ) {
        animateSwipe(
          card,
          "left",
          () =>
            processCard(
              id,
              "passed"
            )
        );


        return;
      }


      card.style.transition =
        "transform .22s ease";


      card.style.transform =
        "translate(0,0) rotate(0deg)";


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
        230
      );
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


    swipeLocked =
      true;


    const x =
      direction ===
      "right"
        ? window.innerWidth *
          1.45
        : -window.innerWidth *
          1.45;


    const rotate =
      direction ===
      "right"
        ? 24
        : -24;


    card.style.transition =
      "transform .28s ease, opacity .28s ease";


    card.style.transform =
      `translate(${x}px, 35px) rotate(${rotate}deg)`;


    card.style.opacity =
      "0";


    setSwipeMeters(
      direction ===
      "right"
        ? 999
        : -999,
      100
    );


    setTimeout(
      () => {
        callback();

        swipeLocked =
          false;

        resetSwipeMeters();
      },
      285
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


    animateSwipe(
      $(".swipe-card.active"),
      "left",
      () =>
        processCard(
          id,
          "passed"
        )
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


    animateSwipe(
      $(".swipe-card.active"),
      "right",
      () => {
        processCard(
          id,
          "saved"
        );


        toast(
          "Saved ♥"
        );
      }
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


    openInstagram(
      id
    );
  }


  /* =========================================================
     SAVED / HISTORY
     ========================================================= */

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


    button.innerHTML = `
      <div class="library-info">

        <strong>
          @${escapeHTML(
            profile.username
          )}
        </strong>

        <small>
          ${escapeHTML(
            label
          )}
        </small>

      </div>
    `;


    button
      .addEventListener(
        "click",
        () =>
          openInstagram(
            profile.id
          )
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
        .filter(Boolean);


    profiles.forEach(
      (profile) => {
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
      state.history.filter(
        (history) =>
          getProfile(
            history.id
          )
      );


    entries.forEach(
      (history) => {
        const profile =
          getProfile(
            history.id
          );


        const label =
          history.action ===
          "saved"
            ? "SAVED"
            : history.action ===
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
      state.saved.filter(
        (id) =>
          getProfile(id)
      ).length;


    const left =
      state.queue.filter(
        (id) =>
          getProfile(id)
      ).length;


    const seen =
      state.history.filter(
        (history) =>
          getProfile(
            history.id
          )
      ).length;


    const processed =
      Math.max(
        total - left,
        0
      );


    const current =
      left
        ? Math.min(
            processed + 1,
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
    ).forEach(
      ([
        id,
        value
      ]) => {
        const element =
          document
            .getElementById(
              id
            );


        if (element) {
          element.textContent =
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


  /* =========================================================
     TUTORIAL
     ========================================================= */

  function maybeShowTutorial() {
    if (
      !state.queue.length
    ) {
      return;
    }


    try {
      if (
        localStorage.getItem(
          TUTORIAL_KEY
        ) === "1"
      ) {
        return;
      }
    } catch (_) {}


    setTimeout(
      () =>
        $("#swipeTutorial")
          ?.classList
          .remove(
            "hidden"
          ),
      300
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


  /* =========================================================
     RESET / HISTORY
     ========================================================= */

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
        "Supprimer tous les profils, saved et historique KIO ?"
      )
    ) {
      return;
    }


    state = {
      profiles: [],
      queue: [],
      saved: [],
      history: [],
      seed: ""
    };


    try {
      localStorage.removeItem(
        STORAGE_KEY
      );


      localStorage.removeItem(
        TUTORIAL_KEY
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


    if (
      $("#seedInput")
    ) {
      $("#seedInput")
        .value =
        "";
    }


    renderAll();

    refreshFloatingStickers();

    showScreen(
      "homeScreen"
    );


    toast(
      "KIO remis à zéro ✦"
    );
  }


  /* =========================================================
     EVENTS
     ========================================================= */

  function bindEvents() {
    $("#logoBtn")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "homeScreen"
          )
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
        () =>
          showScreen(
            "importScreen"
          )
      );


    $("#emptyImportBtn")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "importScreen"
          )
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


    $("#startSeedBtn")
      ?.addEventListener(
        "click",
        startFromSeed
      );


    $("#seedInput")
      ?.addEventListener(
        "keydown",
        (event) => {
          if (
            event.key ===
            "Enter"
          ) {
            startFromSeed();
          }
        }
      );


    $("#photoInput")
      ?.addEventListener(
        "change",
        (event) =>
          addPhotoFiles(
            event.target.files
          )
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


    $$("[data-screen]")
      .forEach(
        (button) => {
          button
            .addEventListener(
              "click",
              () =>
                showScreen(
                  button.dataset
                    .screen
                )
            );
        }
      );


    $$(".nav-button")
      .forEach(
        (button) => {
          button
            .addEventListener(
              "click",
              () =>
                showScreen(
                  button.dataset
                    .screen
                )
            );
        }
      );


    $("#menuImportBtn")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "importScreen"
          )
      );


    $("#menuNewScanBtn")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "homeScreen"
          )
      );


    $("#menuSavedBtn")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "savedScreen"
          )
      );


    $("#menuHistoryBtn")
      ?.addEventListener(
        "click",
        () =>
          showScreen(
            "historyScreen"
          )
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


    document
      .addEventListener(
        "keydown",
        (event) => {
          if (
            event.key ===
            "Escape"
          ) {
            closeMenu();
          }


          const visible =
            !$("#swipeScreen")
              ?.classList
              .contains(
                "hidden"
              );


          if (
            !visible
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


  /* =========================================================
     START
     ========================================================= */

  function startApp() {
    loadState();

    bindEvents();

    refreshFloatingStickers();

    renderAll();


    showScreen(
      state.queue.length
        ? "swipeScreen"
        : "homeScreen"
    );


    console.log(
      "KIO LOVE READY ✦ by 2boyzer"
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
