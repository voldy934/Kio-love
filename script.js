/* =========================================================
   KIO LOVE — FINAL CSS
   ========================================================= */

:root {
  --pink: #ff2aa3;
  --pink-soft: #ff8bd0;
  --pink-pale: #fff1f8;

  --purple: #8e5cff;
  --purple-soft: #c698ff;

  --black: #111111;
  --white: #ffffff;

  --grey: #777;
  --border: 3px solid var(--black);

  --shadow:
    8px 9px 0
    rgba(17, 17, 17, 0.95);

  --radius: 28px;
}


/* =========================================================
   RESET
   ========================================================= */

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  background: #fff7fb;
}

body {
  margin: 0;
  min-height: 100vh;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background:
    radial-gradient(
      circle at 100% 0%,
      rgba(255, 112, 196, 0.24),
      transparent 34%
    ),
    radial-gradient(
      circle at 0% 60%,
      rgba(181, 112, 255, 0.15),
      transparent 32%
    ),
    #fff7fb;

  color: var(--black);

  overflow-x: hidden;

  padding-bottom:
    calc(
      102px +
      env(safe-area-inset-bottom)
    );
}

button,
input,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

img {
  max-width: 100%;
}

.hidden {
  display: none !important;
}


/* =========================================================
   TOP BAR
   ========================================================= */

.topbar {
  position: sticky;
  top: 0;

  z-index: 800;

  width: 100%;

  min-height: 88px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 16px;

  padding:
    calc(
      12px +
      env(safe-area-inset-top)
    )
    18px
    12px;

  background:
    rgba(
      255,
      248,
      252,
      0.94
    );

  backdrop-filter:
    blur(18px);

  -webkit-backdrop-filter:
    blur(18px);

  border-bottom:
    3px solid var(--black);
}

.logo-button {
  border: 0;
  background: transparent;

  padding: 0;

  width: 140px;

  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.logo-image {
  display: block;

  width: 100%;
  height: auto;

  object-fit: contain;
}

.top-actions {
  display: flex;
  align-items: center;

  gap: 10px;
}

.queue-bubble,
.menu-button {
  width: 58px;
  height: 58px;

  border:
    3px solid var(--black);

  border-radius: 50%;

  background: var(--white);

  color: var(--black);

  font-weight: 1000;

  box-shadow:
    4px 5px 0
    var(--black);
}

.queue-bubble {
  font-size: 19px;

  box-shadow:
    4px 5px 0
    var(--pink);
}

.menu-button {
  font-size: 24px;
}


/* =========================================================
   APP
   ========================================================= */

.app-main {
  position: relative;

  z-index: 10;

  width: min(
    100%,
    760px
  );

  margin:
    0 auto;

  padding:
    0 18px 40px;
}

.screen {
  width: 100%;

  animation:
    screenIn
    0.22s
    ease;
}

@keyframes screenIn {
  from {
    opacity: 0;
    transform:
      translateY(6px);
  }

  to {
    opacity: 1;
    transform:
      translateY(0);
  }
}


/* =========================================================
   TYPO
   ========================================================= */

.eyebrow,
.section-kicker {
  margin: 0 0 8px;

  font-size: 12px;
  font-weight: 1000;

  letter-spacing: 4px;

  text-transform:
    uppercase;
}

.page-heading {
  display: flex;
  align-items: center;

  gap: 16px;

  margin:
    28px 0
    14px;
}

.page-heading h2,
.swipe-heading h2 {
  margin: 0;

  font-size:
    clamp(
      40px,
      9vw,
      66px
    );

  line-height: 0.92;

  font-style: italic;
  font-weight: 1000;

  letter-spacing:
    -3px;
}

.page-intro {
  margin:
    0 0
    20px;

  max-width: 600px;

  line-height: 1.55;

  font-size: 16px;
  font-weight: 700;
}

.back-button {
  width: 48px;
  height: 48px;

  flex: 0 0 auto;

  border:
    3px solid var(--black);

  border-radius:
    50%;

  background:
    var(--white);

  font-size:
    24px;

  font-weight:
    1000;

  box-shadow:
    4px 4px 0
    var(--black);
}


/* =========================================================
   HERO
   ========================================================= */

.hero {
  position: relative;

  isolation: isolate;

  overflow: hidden;

  min-height: 720px;

  margin-top: 18px;

  border:
    4px solid var(--black);

  border-radius:
    34px;

  background:
    linear-gradient(
      145deg,
      #fff7fb 0%,
      #ffd7ee 53%,
      #e4cbff 100%
    );

  box-shadow:
    9px 10px 0
    var(--black);
}

.hero::before {
  content: "";

  position: absolute;

  width: 280px;
  height: 280px;

  right: -90px;
  top: 200px;

  border-radius: 50%;

  background:
    rgba(
      255,
      255,
      255,
      0.34
    );

  filter:
    blur(2px);

  z-index: -1;
}

.hero::after {
  content: "";

  position: absolute;

  left: -100px;
  bottom: -100px;

  width: 300px;
  height: 300px;

  border-radius: 50%;

  background:
    rgba(
      180,
      100,
      255,
      0.15
    );

  z-index: -1;
}

.hero-copy {
  position: relative;

  z-index: 5;

  width: 58%;

  padding:
    28px 0
    0 28px;
}

.hero-title {
  margin: 0;

  font-size:
    clamp(
      58px,
      12vw,
      92px
    );

  line-height:
    0.84;

  font-weight:
    1000;

  font-style:
    italic;

  letter-spacing:
    -5px;
}

.hero-title span {
  color:
    var(--pink);

  -webkit-text-stroke:
    2px var(--black);
}

.hero-description {
  max-width: 310px;

  margin-top:
    28px;

  font-size:
    18px;

  line-height:
    1.55;

  font-weight:
    800;
}

.hero-model-wrap {
  position:
    absolute;

  right:
    -22px;

  bottom:
    -3px;

  z-index:
    2;

  width:
    59%;

  max-width:
    445px;

  background:
    transparent !important;

  border:
    0 !important;

  box-shadow:
    none !important;
}

.hero-model {
  display:
    block;

  width:
    100%;

  height:
    auto;

  background:
    transparent !important;

  object-fit:
    contain;

  filter:
    drop-shadow(
      -8px
      14px
      12px
      rgba(
        0,
        0,
        0,
        0.13
      )
    );
}

.hero-star {
  position:
    absolute;

  z-index:
    6;

  font-size:
    54px;

  color:
    var(--white);

  -webkit-text-stroke:
    2px var(--black);
}

.hero-star-one {
  right:
    28px;

  top:
    155px;

  transform:
    rotate(12deg);
}

.hero-star-two {
  left:
    42px;

  bottom:
    250px;

  color:
    var(--pink);

  transform:
    rotate(-12deg);
}


/* =========================================================
   START CARDS
   ========================================================= */

.start-section {
  margin-top:
    34px;
}

.section-kicker {
  margin-left:
    4px;

  margin-bottom:
    18px;
}

.feature-card {
  width:
    100%;

  min-height:
    112px;

  margin-bottom:
    18px;

  padding:
    16px;

  display:
    grid;

  grid-template-columns:
    68px
    1fr
    48px;

  align-items:
    center;

  gap:
    14px;

  text-align:
    left;

  border:
    var(--border);

  border-radius:
    28px;

  background:
    var(--white);

  box-shadow:
    7px 8px 0
    var(--black);
}

.feature-card:active {
  transform:
    translate(
      3px,
      3px
    );

  box-shadow:
    4px 5px 0
    var(--black);
}

.feature-icon {
  width:
    64px;
  height:
    64px;

  display:
    grid;
  place-items:
    center;

  border:
    3px solid
    var(--black);

  border-radius:
    20px;

  background:
    linear-gradient(
      145deg,
      #fff,
      #f8d6ff
    );

  font-size:
    30px;
}

.feature-content {
  min-width:
    0;

  display:
    flex;

  flex-direction:
    column;

  gap:
    7px;
}

.feature-content strong {
  font-size:
    20px;

  font-weight:
    1000;
}

.feature-content small {
  font-size:
    15px;

  line-height:
    1.4;

  color:
    #5d5d5d;
}

.primary-feature
.feature-content strong {
  color:
    #188fe6;
}

.feature-arrow {
  font-size:
    34px;

  font-weight:
    1000;

  text-align:
    center;
}


/* =========================================================
   MANUAL PANEL
   ========================================================= */

.manual-panel {
  margin:
    4px 0
    26px;

  padding:
    18px;

  border:
    var(--border);

  border-radius:
    24px;

  background:
    #ffdff1;

  box-shadow:
    6px 7px 0
    var(--black);
}

.input-label {
  display:
    block;

  margin-bottom:
    8px;

  font-size:
    12px;

  font-weight:
    1000;

  letter-spacing:
    2px;
}

.manual-panel textarea {
  width:
    100%;

  min-height:
    120px;

  resize:
    vertical;

  padding:
    14px;

  border:
    3px solid
    var(--black);

  border-radius:
    16px;

  background:
    var(--white);

  outline:
    none;

  font-size:
    16px;

  font-weight:
    700;
}

.manual-panel textarea:focus {
  border-color:
    var(--pink);

  box-shadow:
    3px 3px 0
    var(--pink);
}


/* =========================================================
   BUTTONS
   ========================================================= */

.main-button,
.secondary-button,
.tiny-button {
  border:
    3px solid var(--black);

  font-weight:
    1000;

  text-transform:
    uppercase;

  letter-spacing:
    1px;
}

.main-button {
  width:
    100%;

  min-height:
    58px;

  margin-top:
    14px;

  border-radius:
    18px;

  background:
    var(--pink);

  color:
    var(--white);

  box-shadow:
    5px 6px 0
    var(--black);
}

.secondary-button {
  min-height:
    54px;

  padding:
    0 20px;

  border-radius:
    16px;

  background:
    var(--white);

  box-shadow:
    4px 5px 0
    var(--black);
}

.tiny-button {
  padding:
    10px 12px;

  border-radius:
    12px;

  background:
    var(--white);

  font-size:
    11px;
}


/* =========================================================
   IMPORT
   ========================================================= */

.photo-dropzone {
  min-height:
    230px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  flex-direction:
    column;

  gap:
    12px;

  padding:
    28px;

  border:
    4px dashed
    var(--black);

  border-radius:
    28px;

  background:
    linear-gradient(
      145deg,
      #ffffff,
      #ffe0f2
    );

  text-align:
    center;

  cursor:
    pointer;
}

.dropzone-icon {
  font-size:
    52px;
}

.photo-dropzone strong {
  font-size:
    22px;

  font-weight:
    1000;
}

.photo-dropzone small {
  max-width:
    300px;

  color:
    #777;

  line-height:
    1.45;
}

.hidden-input {
  display:
    none;
}

.photo-preview-list {
  display:
    grid;

  grid-template-columns:
    repeat(
      2,
      minmax(
        0,
        1fr
      )
    );

  gap:
    12px;

  margin-top:
    20px;
}

.photo-preview {
  position:
    relative;

  overflow:
    hidden;

  aspect-ratio:
    9 / 16;

  border:
    3px solid
    var(--black);

  border-radius:
    20px;

  background:
    #eee;
}

.photo-preview img {
  width:
    100%;

  height:
    100%;

  display:
    block;

  object-fit:
    cover;
}

.photo-preview button {
  position:
    absolute;

  top:
    8px;
  right:
    8px;

  width:
    38px;
  height:
    38px;

  border:
    2px solid
    var(--black);

  border-radius:
    50%;

  background:
    var(--white);

  font-size:
    24px;

  font-weight:
    1000;
}

.analyse-actions {
  display:
    grid;

  grid-template-columns:
    1fr
    auto;

  gap:
    12px;

  margin-top:
    18px;

  align-items:
    end;
}


/* =========================================================
   OCR
   ========================================================= */

.ocr-loading {
  margin-top:
    24px;

  padding:
    20px;

  border:
    var(--border);

  border-radius:
    24px;

  background:
    var(--white);

  text-align:
    center;
}

.scanner-box {
  position:
    relative;

  overflow:
    hidden;

  height:
    150px;

  display:
    grid;

  place-items:
    center;

  border:
    3px solid
    var(--black);

  border-radius:
    20px;

  background:
    linear-gradient(
      135deg,
      #ffd7ec,
      #d8c5ff
    );

  font-weight:
    1000;

  letter-spacing:
    3px;
}

.scanner-line {
  position:
    absolute;

  left:
    0;

  top:
    0;

  width:
    100%;

  height:
    4px;

  background:
    var(--pink);

  box-shadow:
    0 0 18px
    var(--pink);

  animation:
    scannerMove
    1.7s
    ease-in-out
    infinite alternate;
}

@keyframes scannerMove {
  from {
    top:
      0;
  }

  to {
    top:
      calc(
        100% - 4px
      );
  }
}

.ocr-results {
  margin-top:
    24px;

  padding:
    18px;

  border:
    var(--border);

  border-radius:
    26px;

  background:
    var(--white);

  box-shadow:
    6px 7px 0
    var(--black);
}

.result-header {
  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    12px;
}

.result-header h3 {
  margin:
    0;

  font-size:
    28px;
}

.result-warning {
  padding:
    12px;

  border:
    2px solid
    var(--black);

  border-radius:
    14px;

  background:
    #fff0c9;

  font-size:
    13px;

  line-height:
    1.4;

  font-weight:
    700;
}

.detected-list {
  display:
    flex;

  flex-direction:
    column;

  gap:
    10px;

  margin-top:
    16px;
}

.detected-item {
  display:
    flex;

  align-items:
    center;

  gap:
    10px;

  padding:
    10px;

  border:
    2px solid
    var(--black);

  border-radius:
    16px;

  background:
    #fff7fb;
}

.detected-item
input[type="checkbox"] {
  width:
    22px;

  height:
    22px;

  flex:
    0 0 auto;

  accent-color:
    var(--pink);
}

.detected-username-input {
  width:
    100%;

  min-width:
    0;

  padding:
    10px 12px;

  border:
    2px solid
    var(--black);

  border-radius:
    12px;

  background:
    var(--white);

  color:
    #178ce2;

  outline:
    none;

  font-size:
    16px;

  font-weight:
    900;
}

.detected-username-input:focus {
  border-color:
    var(--pink);

  box-shadow:
    3px 3px 0
    var(--pink);
}

.detected-username-input.invalid {
  border-color:
    #ff1744;

  color:
    #ff1744;
}


/* =========================================================
   SWIPE HEADER
   ========================================================= */

.swipe-heading {
  display:
    flex;

  align-items:
    flex-end;

  justify-content:
    space-between;

  gap:
    16px;

  margin:
    28px 0
    18px;
}

.swipe-heading h2 span {
  color:
    var(--pink);
}

.swipe-counter {
  min-width:
    106px;

  height:
    66px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  gap:
    4px;

  padding:
    0 16px;

  border:
    3px solid
    var(--black);

  border-radius:
    26px;

  background:
    var(--white);

  box-shadow:
    5px 6px 0
    var(--black);
}

.swipe-counter strong {
  color:
    var(--pink);

  font-size:
    28px;
}


/* =========================================================
   GUIDE
   ========================================================= */

.swipe-guide {
  display:
    grid;

  grid-template-columns:
    1fr
    auto
    1fr;

  align-items:
    center;

  gap:
    8px;

  padding:
    12px;

  border:
    var(--border);

  border-radius:
    24px;

  background:
    var(--white);

  box-shadow:
    6px 7px 0
    var(--black);
}

.guide-side {
  display:
    flex;

  align-items:
    center;

  gap:
    10px;
}

.save-guide {
  justify-content:
    flex-end;

  text-align:
    right;
}

.guide-side strong {
  display:
    block;

  font-size:
    14px;

  font-weight:
    1000;
}

.guide-side small {
  color:
    #777;

  font-size:
    11px;
}

.guide-icon {
  width:
    48px;

  height:
    48px;

  display:
    grid;

  place-items:
    center;

  flex:
    0 0 auto;

  border:
    3px solid
    var(--black);

  border-radius:
    50%;

  background:
    var(--white);

  font-size:
    24px;
}

.guide-icon.heart {
  background:
    var(--pink);

  color:
    var(--white);
}

.guide-center {
  color:
    var(--pink);

  font-size:
    28px;

  font-weight:
    1000;
}


/* =========================================================
   METERS
   ========================================================= */

.swipe-meters {
  display:
    grid;

  grid-template-columns:
    1fr 1fr;

  gap:
    14px;

  margin:
    22px 0
    16px;
}

.meter-label {
  margin-bottom:
    7px;

  font-size:
    11px;

  font-weight:
    1000;

  letter-spacing:
    1px;
}

.meter-label.save {
  text-align:
    right;

  color:
    var(--pink);
}

.meter-track {
  height:
    11px;

  overflow:
    hidden;

  border:
    2px solid
    var(--black);

  border-radius:
    999px;

  background:
    var(--white);
}

.meter-fill {
  width:
    0%;

  height:
    100%;

  transition:
    width
    0.05s linear;
}

.pass-meter {
  margin-left:
    auto;

  background:
    #111;
}

.save-meter {
  background:
    linear-gradient(
      90deg,
      var(--pink),
      var(--purple)
    );
}


/* =========================================================
   DECK
   ========================================================= */

.deck {
  position:
    relative;

  width:
    100%;

  height:
    min(
      61vh,
      560px
    );

  min-height:
    455px;

  overflow:
    hidden;

  border-radius:
    30px;

  contain:
    paint;
}

.swipe-card {
  position:
    absolute;

  inset:
    10px 0 18px;

  overflow:
    hidden;

  width:
    100%;

  border:
    4px solid
    var(--black);

  border-radius:
    30px;

  background:
    linear-gradient(
      145deg,
      var(--card-a),
      var(--card-b)
    );

  box-shadow:
    9px 10px 0
    rgba(
      17,
      17,
      17,
      0.95
    );

  transform-origin:
    center;

  user-select:
    none;

  touch-action:
    pan-y;

  will-change:
    transform,
    opacity;
}

.swipe-card.active {
  z-index:
    30;
}

.swipe-card-bg {
  position:
    absolute;

  inset:
    0;

  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(
        255,
        255,
        255,
        0.30
      ),
      transparent
      32%
    ),
    linear-gradient(
      145deg,
      transparent,
      rgba(
        255,
        255,
        255,
        0.13
      )
    );
}

.card-status {
  position:
    absolute;

  left:
    22px;

  top:
    22px;

  z-index:
    4;

  padding:
    9px
    14px;

  border:
    3px solid
    var(--black);

  background:
    var(--white);

  font-size:
    11px;

  font-weight:
    1000;

  letter-spacing:
    1.5px;

  transform:
    rotate(3deg);

  box-shadow:
    3px 4px 0
    var(--black);
}

.highlight-chip {
  position:
    absolute;

  top:
    26px;

  right:
    18px;

  z-index:
    4;

  max-width:
    170px;

  padding:
    9px 12px;

  background:
    var(--black);

  color:
    var(--pink);

  font-size:
    10px;

  font-weight:
    1000;

  letter-spacing:
    1.5px;

  transform:
    rotate(4deg);
}

.card-profile {
  position:
    absolute;

  z-index:
    8;

  left:
    20px;

  right:
    20px;

  bottom:
    24px;

  padding:
    18px;

  border:
    4px solid
    var(--black);

  border-radius:
    22px;

  background:
    rgba(
      255,
      255,
      255,
      0.96
    );

  box-shadow:
    7px 8px 0
    var(--black);
}

.card-number {
  display:
    inline-block;

  margin-bottom:
    10px;

  padding:
    6px
    10px;

  border:
    2px solid
    var(--black);

  background:
    var(--pink);

  color:
    var(--white);

  font-size:
    10px;

  font-weight:
    1000;

  letter-spacing:
    1px;
}

.kio-username-link {
  display:
    block;

  width:
    100%;

  border:
    0;

  padding:
    0;

  background:
    transparent;

  color:
    var(--black);

  text-align:
    left;

  font-size:
    clamp(
      28px,
      8vw,
      46px
    );

  line-height:
    1.05;

  font-weight:
    1000;

  letter-spacing:
    -2px;

  text-decoration:
    underline;

  text-decoration-color:
    var(--pink);

  text-decoration-thickness:
    4px;

  text-underline-offset:
    6px;

  overflow-wrap:
    anywhere;
}

.kio-username-link:active {
  color:
    var(--pink);
}

.card-profile p {
  margin:
    12px 0 0;

  color:
    #666;

  font-size:
    13px;

  line-height:
    1.45;
}


/* =========================================================
   SAVE / PASS OVERLAY
   ========================================================= */

.swipe-label {
  position:
    absolute;

  z-index:
    12;

  opacity:
    0;

  top:
    115px;

  padding:
    14px 18px;

  border:
    4px solid
    var(--black);

  border-radius:
    14px;

  background:
    var(--white);

  font-size:
    34px;

  font-weight:
    1000;

  transition:
    opacity
    0.05s linear;

  pointer-events:
    none;
}

.like-label {
  right:
    24px;

  color:
    var(--pink);

  transform:
    rotate(4deg);
}

.pass-label {
  left:
    24px;

  color:
    var(--black);

  transform:
    rotate(-4deg);
}


/* =========================================================
   SWIPE ACTIONS
   ========================================================= */

.swipe-actions {
  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  gap:
    24px;

  margin-top:
    24px;
}

.round-action {
  width:
    76px;

  height:
    76px;

  border:
    4px solid
    var(--black);

  border-radius:
    50%;

  background:
    var(--white);

  font-size:
    32px;

  font-weight:
    1000;

  box-shadow:
    6px 7px 0
    var(--black);
}

.round-action:active {
  transform:
    translate(
      3px,
      3px
    );

  box-shadow:
    3px 4px 0
    var(--black);
}

.instagram-action {
  width:
    92px;

  height:
    92px;

  color:
    var(--white);

  background:
    linear-gradient(
      145deg,
      #8b4cff,
      #ff2aa3,
      #ff6748
    );

  font-size:
    19px;
}

.save-action {
  background:
    var(--pink);

  color:
    var(--white);
}

.swipe-help {
  margin:
    20px auto
    0;

  max-width:
    450px;

  text-align:
    center;

  color:
    #666;

  font-size:
    12px;

  line-height:
    1.5;

  font-weight:
    700;
}


/* =========================================================
   EMPTY
   ========================================================= */

.empty-state {
  width:
    100%;

  min-height:
    300px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  flex-direction:
    column;

  text-align:
    center;

  padding:
    30px;

  border:
    3px dashed
    var(--black);

  border-radius:
    26px;

  background:
    rgba(
      255,
      255,
      255,
      0.7
    );
}

.empty-icon {
  font-size:
    54px;

  color:
    var(--pink);
}

.empty-state h3 {
  margin:
    12px 0
    6px;

  font-size:
    25px;
}

.empty-state p {
  max-width:
    280px;

  color:
    #777;

  line-height:
    1.5;
}


/* =========================================================
   LIBRARY
   ========================================================= */

.library-grid {
  display:
    grid;

  grid-template-columns:
    1fr;

  gap:
    16px;

  margin:
    22px 0;
}

.library-card {
  overflow:
    hidden;

  min-height:
    130px;

  border:
    4px solid
    var(--black);

  border-radius:
    26px;

  background:
    linear-gradient(
      135deg,
      var(--card-a),
      var(--card-b)
    );

  box-shadow:
    6px 7px 0
    var(--black);
}

.library-card button {
  width:
    100%;

  min-height:
    130px;

  display:
    flex;

  align-items:
    flex-end;

  padding:
    18px;

  border:
    0;

  background:
    transparent;

  text-align:
    left;
}

.library-info {
  width:
    100%;

  padding:
    14px;

  border:
    3px solid
    var(--black);

  border-radius:
    16px;

  background:
    rgba(
      255,
      255,
      255,
      0.94
    );
}

.library-info strong {
  display:
    block;

  font-size:
    21px;

  font-weight:
    1000;

  color:
    #168ce3;

  overflow-wrap:
    anywhere;
}

.library-info small {
  display:
    block;

  margin-top:
    6px;

  color:
    #777;

  font-size:
    10px;

  font-weight:
    900;

  letter-spacing:
    1px;
}


/* =========================================================
   BOTTOM NAV
   ========================================================= */

.bottom-nav {
  position:
    fixed;

  z-index:
    700;

  left:
    14px;

  right:
    14px;

  bottom:
    calc(
      12px +
      env(safe-area-inset-bottom)
    );

  width:
    min(
      calc(
        100% - 28px
      ),
      730px
    );

  margin:
    0 auto;

  display:
    grid;

  grid-template-columns:
    repeat(
      4,
      1fr
    );

  gap:
    8px;

  padding:
    9px;

  border:
    4px solid
    var(--black);

  border-radius:
    28px;

  background:
    rgba(
      255,
      255,
      255,
      0.97
    );

  backdrop-filter:
    blur(14px);

  -webkit-backdrop-filter:
    blur(14px);

  box-shadow:
    7px 8px 0
    var(--black);
}

.nav-button {
  min-width:
    0;

  min-height:
    64px;

  display:
    flex;

  flex-direction:
    column;

  align-items:
    center;

  justify-content:
    center;

  gap:
    4px;

  border:
    0;

  border-radius:
    19px;

  background:
    transparent;

  color:
    var(--black);

  font-weight:
    1000;
}

.nav-button span {
  font-size:
    20px;
}

.nav-button small {
  font-size:
    9px;

  font-weight:
    1000;

  letter-spacing:
    0.8px;
}

.nav-button.active {
  border:
    3px solid
    var(--black);

  background:
    var(--pink);

  color:
    var(--white);

  box-shadow:
    3px 4px 0
    var(--black);
}


/* =========================================================
   SIDE MENU
   ========================================================= */

.side-menu {
  position:
    fixed;

  inset:
    0;

  z-index:
    1000;

  pointer-events:
    none;

  visibility:
    hidden;
}

.side-menu.open {
  pointer-events:
    auto;

  visibility:
    visible;
}

.menu-backdrop {
  position:
    absolute;

  inset:
    0;

  background:
    rgba(
      0,
      0,
      0,
      0.48
    );

  opacity:
    0;

  transition:
    opacity
    0.22s;
}

.side-menu.open
.menu-backdrop {
  opacity:
    1;
}

.menu-panel {
  position:
    absolute;

  right:
    0;

  top:
    0;

  width:
    min(
      88vw,
      390px
    );

  height:
    100%;

  overflow-y:
    auto;

  padding:
    calc(
      20px +
      env(safe-area-inset-top)
    )
    18px
    30px;

  border-left:
    4px solid
    var(--black);

  background:
    #fff7fb;

  transform:
    translateX(
      102%
    );

  transition:
    transform
    0.25s ease;
}

.side-menu.open
.menu-panel {
  transform:
    translateX(0);
}

.menu-top {
  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  gap:
    15px;
}

.menu-logo {
  width:
    150px;

  height:
    auto;
}

.close-menu {
  width:
    48px;
  height:
    48px;

  border:
    3px solid
    var(--black);

  border-radius:
    50%;

  background:
    var(--white);

  font-size:
    21px;

  font-weight:
    1000;
}

.menu-by {
  margin:
    12px 0
    22px;

  font-size:
    11px;

  font-weight:
    1000;

  letter-spacing:
    3px;
}

.menu-stats {
  display:
    grid;

  grid-template-columns:
    repeat(
      2,
      1fr
    );

  gap:
    10px;

  margin-bottom:
    22px;
}

.menu-stats div {
  padding:
    14px;

  border:
    3px solid
    var(--black);

  border-radius:
    18px;

  background:
    var(--white);
}

.menu-stats strong {
  display:
    block;

  color:
    var(--pink);

  font-size:
    27px;
}

.menu-stats span {
  font-size:
    9px;

  font-weight:
    1000;

  letter-spacing:
    1px;
}

.menu-links {
  display:
    flex;

  flex-direction:
    column;

  gap:
    10px;
}

.menu-links button,
.menu-danger button {
  width:
    100%;

  min-height:
    54px;

  padding:
    0 15px;

  border:
    3px solid
    var(--black);

  border-radius:
    15px;

  background:
    var(--white);

  text-align:
    left;

  font-size:
    13px;

  font-weight:
    1000;
}

.menu-danger {
  display:
    flex;

  flex-direction:
    column;

  gap:
    10px;

  margin-top:
    30px;
}

.menu-danger button {
  color:
    #d5003d;
}


/* =========================================================
   TUTORIAL
   ========================================================= */

.tutorial-overlay {
  position:
    fixed;

  inset:
    0;

  z-index:
    1200;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  padding:
    20px;

  background:
    rgba(
      0,
      0,
      0,
      0.58
    );

  backdrop-filter:
    blur(8px);

  -webkit-backdrop-filter:
    blur(8px);
}

.tutorial-card {
  width:
    min(
      100%,
      430px
    );

  padding:
    24px;

  border:
    4px solid
    var(--black);

  border-radius:
    28px;

  background:
    #fff7fb;

  box-shadow:
    8px 9px 0
    var(--pink);
}

.tutorial-card h3 {
  margin:
    0;

  font-size:
    42px;

  font-style:
    italic;

  font-weight:
    1000;
}

.tutorial-card p {
  line-height:
    1.5;
}

.tutorial-directions {
  display:
    grid;

  grid-template-columns:
    1fr 1fr;

  gap:
    12px;

  margin:
    20px 0;
}

.tutorial-directions div {
  min-height:
    120px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  flex-direction:
    column;

  gap:
    8px;

  border:
    3px solid
    var(--black);

  border-radius:
    20px;

  background:
    var(--white);
}

.tutorial-directions span {
  font-size:
    42px;

  color:
    var(--pink);
}


/* =========================================================
   TOAST
   ========================================================= */

.toast {
  position:
    fixed;

  z-index:
    1500;

  left:
    50%;

  bottom:
    calc(
      110px +
      env(safe-area-inset-bottom)
    );

  width:
    max-content;

  max-width:
    calc(
      100% - 40px
    );

  padding:
    13px 18px;

  border:
    3px solid
    var(--black);

  border-radius:
    16px;

  background:
    var(--black);

  color:
    var(--white);

  font-size:
    13px;

  font-weight:
    900;

  text-align:
    center;

  opacity:
    0;

  transform:
    translate(
      -50%,
      14px
    );

  pointer-events:
    none;

  transition:
    0.2s ease;
}

.toast.show {
  opacity:
    1;

  transform:
    translate(
      -50%,
      0
    );
}


/* =========================================================
   FLOATING STICKERS
   ========================================================= */

.floating-sticker-layer {
  position:
    fixed;

  inset:
    0;

  z-index:
    60;

  pointer-events:
    none;

  overflow:
    hidden;
}

.floating-sticker {
  position:
    fixed;

  width:
    74px;

  height:
    auto;

  pointer-events:
    auto;

  touch-action:
    none;

  user-select:
    none;

  -webkit-user-drag:
    none;

  opacity:
    0.82;

  filter:
    drop-shadow(
      0 7px 7px
      rgba(
        0,
        0,
        0,
        0.14
      )
    );

  animation:
    stickerFloat
    var(
      --float-speed,
      6s
    )
    ease-in-out
    infinite alternate;
}

.floating-sticker.dragging,
.floating-sticker.kio-dragging {
  animation-play-state:
    paused;

  z-index:
    999;

  opacity:
    1;

  transform:
    scale(1.06);
}

@keyframes stickerFloat {
  from {
    transform:
      translateY(0)
      rotate(
        var(
          --sticker-rotate,
          0deg
        )
      );
  }

  to {
    transform:
      translateY(-9px)
      rotate(
        var(
          --sticker-rotate-end,
          3deg
        )
      );
  }
}


/* =========================================================
   MOBILE
   ========================================================= */

@media (
  max-width: 600px
) {

  .app-main {
    padding:
      0 14px
      34px;
  }

  .topbar {
    min-height:
      78px;

    padding-left:
      14px;

    padding-right:
      14px;
  }

  .logo-button {
    width:
      118px;
  }

  .queue-bubble,
  .menu-button {
    width:
      54px;

    height:
      54px;
  }


  .hero {
    min-height:
      660px;

    border-radius:
      28px;
  }

  .hero-copy {
    width:
      65%;

    padding:
      25px 0
      0 20px;
  }

  .hero-title {
    font-size:
      clamp(
        53px,
        15vw,
        72px
      );

    letter-spacing:
      -4px;
  }

  .hero-description {
    max-width:
      230px;

    font-size:
      16px;
  }

  .hero-model-wrap {
    width:
      57%;

    right:
      -22px;
  }

  .hero-star-one {
    right:
      13px;
  }

  .hero-star-two {
    left:
      16px;
  }


  .feature-card {
    grid-template-columns:
      58px
      1fr
      36px;

    padding:
      13px;

    min-height:
      102px;
  }

  .feature-icon {
    width:
      56px;

    height:
      56px;
  }

  .feature-content strong {
    font-size:
      17px;
  }

  .feature-content small {
    font-size:
      13px;
  }


  .swipe-heading {
    align-items:
      center;

    margin-top:
      24px;
  }

  .swipe-heading h2 {
    font-size:
      clamp(
        42px,
        12vw,
        58px
      );
  }

  .swipe-counter {
    min-width:
      92px;

    height:
      58px;
  }

  .swipe-counter strong {
    font-size:
      24px;
  }


  .guide-center {
    font-size:
      22px;
  }

  .guide-icon {
    width:
      42px;

    height:
      42px;

    font-size:
      20px;
  }

  .guide-side strong {
    font-size:
      12px;
  }

  .guide-side small {
    font-size:
      9px;
  }


  .deck {
    height:
      min(
        58vh,
        520px
      );

    min-height:
      430px;
  }

  .swipe-card {
    inset:
      8px 0
      18px;
  }

  .card-profile {
    left:
      14px;

    right:
      14px;

    bottom:
      18px;

    padding:
      15px;
  }

  .kio-username-link {
    font-size:
      clamp(
        27px,
        9vw,
        40px
      );
  }

  .swipe-label {
    top:
      100px;

    font-size:
      28px;
  }


  .swipe-actions {
    gap:
      20px;

    margin-top:
      20px;
  }

  .round-action {
    width:
      70px;

    height:
      70px;
  }

  .instagram-action {
    width:
      84px;

    height:
      84px;
  }


  .bottom-nav {
    left:
      10px;

    right:
      10px;

    width:
      calc(
        100% - 20px
      );

    padding:
      7px;

    gap:
      5px;
  }

  .nav-button {
    min-height:
      60px;
  }

  .nav-button small {
    font-size:
      8px;
  }


  .floating-sticker {
    width:
      62px;
  }

}


/* =========================================================
   VERY SMALL IPHONE
   ========================================================= */

@media (
  max-width: 380px
) {

  .hero {
    min-height:
      610px;
  }

  .hero-copy {
    width:
      68%;
  }

  .hero-title {
    font-size:
      49px;
  }

  .hero-model-wrap {
    width:
      56%;
  }

  .swipe-guide {
    padding:
      9px;
  }

  .guide-side small {
    display:
      none;
  }

  .swipe-actions {
    gap:
      14px;
  }

  .round-action {
    width:
      64px;

    height:
      64px;
  }

  .instagram-action {
    width:
      78px;

    height:
      78px;
  }

}
