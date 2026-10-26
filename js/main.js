(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Footer year
     --------------------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     Header shrink on scroll
     --------------------------------------------------------------------- */
  var header = document.getElementById("siteHeader");
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  document.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------------------------------------------------------------------
     Mobile nav toggle
     --------------------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  function closeMobileMenu() {
    document.body.classList.remove("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var isOpen = document.body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }
  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMobileMenu);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMobileMenu();
  });

  /* ---------------------------------------------------------------------
     Scroll reveal (IntersectionObserver)
     --------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Work filter
     --------------------------------------------------------------------- */
  var filterButtons = document.querySelectorAll(".filter-btn");
  var workItems = document.querySelectorAll(".work-item");
  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");
      filterButtons.forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      workItems.forEach(function (item) {
        var match = filter === "all" || item.getAttribute("data-cat") === filter;
        item.classList.toggle("hidden", !match);
      });
    });
  });

  /* ---------------------------------------------------------------------
     Lightbox
     --------------------------------------------------------------------- */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxTitle = document.getElementById("lightboxTitle");
  var lightboxCat = document.getElementById("lightboxCat");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxPrev = document.getElementById("lightboxPrev");
  var lightboxNext = document.getElementById("lightboxNext");
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".work-item"));
  var currentIndex = -1;
  var lastFocused = null;

  function visibleItems() {
    return galleryItems.filter(function (item) { return !item.classList.contains("hidden"); });
  }

  function openLightbox(item) {
    var items = visibleItems();
    currentIndex = items.indexOf(item);
    if (currentIndex === -1) { items = galleryItems; currentIndex = items.indexOf(item); }
    renderLightbox(items);
    lastFocused = document.activeElement;
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }

  function renderLightbox(items) {
    var item = items[currentIndex];
    if (!item) return;
    var fullSrc = item.getAttribute("href");
    lightboxImg.src = fullSrc;
    lightboxImg.alt = item.querySelector("img").alt;
    lightboxTitle.textContent = item.getAttribute("data-title") || "";
    lightboxCat.textContent = item.getAttribute("data-cat-label") || "";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.style.overflow = "";
    lightboxImg.src = "";
    if (lastFocused) lastFocused.focus();
  }

  function stepLightbox(delta) {
    var items = visibleItems();
    if (!items.length) return;
    currentIndex = (currentIndex + delta + items.length) % items.length;
    renderLightbox(items);
  }

  galleryItems.forEach(function (item) {
    item.addEventListener("click", function (e) {
      e.preventDefault();
      openLightbox(item);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", function () { stepLightbox(-1); });
  if (lightboxNext) lightboxNext.addEventListener("click", function () { stepLightbox(1); });

  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") stepLightbox(-1);
    if (e.key === "ArrowRight") stepLightbox(1);
  });

  /* ---------------------------------------------------------------------
     Shop card -> contact form deep link
     --------------------------------------------------------------------- */
  var shopLinks = document.querySelectorAll(".shop-card-link");
  var projectSelect = document.getElementById("project");
  shopLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      var project = link.getAttribute("data-project");
      if (projectSelect && project) {
        projectSelect.value = project;
      }
      var contactSection = document.getElementById("contact");
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        var nameField = document.getElementById("name");
        window.setTimeout(function () {
          if (nameField) nameField.focus();
        }, prefersReducedMotion ? 0 : 500);
      }
    });
  });

  /* ---------------------------------------------------------------------
     Contact form (client-side validation + mailto handoff)
     --------------------------------------------------------------------- */
  var form = document.getElementById("contactForm");
  var formStatus = document.getElementById("formStatus");
  var CONTACT_EMAIL = "11x11printlab@gmail.com";

  function setFieldError(field, hasError) {
    field.closest(".field").classList.toggle("has-error", hasError);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = document.getElementById("name");
      var email = document.getElementById("email");
      var details = document.getElementById("details");
      var project = document.getElementById("project");
      var budget = document.getElementById("budget");

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      var valid = true;

      if (!name.value.trim()) { setFieldError(name, true); valid = false; } else { setFieldError(name, false); }
      if (!emailPattern.test(email.value.trim())) { setFieldError(email, true); valid = false; } else { setFieldError(email, false); }
      if (!details.value.trim()) { setFieldError(details, true); valid = false; } else { setFieldError(details, false); }

      if (!valid) {
        var firstError = form.querySelector(".has-error input, .has-error textarea");
        if (firstError) firstError.focus();
        return;
      }

      var subject = "Custom Order Inquiry — " + project.options[project.selectedIndex].text;
      var bodyLines = [
        "Name: " + name.value.trim(),
        "Email: " + email.value.trim(),
        "Project Type: " + project.options[project.selectedIndex].text,
        "Budget: " + (budget.value ? budget.options[budget.selectedIndex].text : "Not specified"),
        "",
        "Details:",
        details.value.trim()
      ];
      var mailto = "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyLines.join("\n"));

      window.location.href = mailto;

      if (formStatus) {
        formStatus.textContent = "Opening your email app to send this inquiry…";
        formStatus.classList.add("is-visible");
      }
      showToast("Opening your email app…");
    });

    ["name", "email", "details"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", function () { setFieldError(el, false); });
      }
    });
  }

  /* ---------------------------------------------------------------------
     Toast
     --------------------------------------------------------------------- */
  var toast = document.getElementById("toast");
  var toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3800);
  }

  /* ---------------------------------------------------------------------
     Back to top
     --------------------------------------------------------------------- */
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------------------------------------------------------------
     Subtle hero visual parallax on pointer move (desktop only, respects RM)
     --------------------------------------------------------------------- */
  var heroVisual = document.querySelector(".hero-visual");
  if (heroVisual && !prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    var rafId = null;
    heroVisual.addEventListener("pointermove", function (e) {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        var rect = heroVisual.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
        var y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
        heroVisual.style.transform = "rotateX(" + (-y * 0.4) + "deg) rotateY(" + (x * 0.4) + "deg)";
        rafId = null;
      });
    });
    heroVisual.addEventListener("pointerleave", function () {
      heroVisual.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
    heroVisual.style.transformStyle = "preserve-3d";
    heroVisual.style.transition = "transform 400ms cubic-bezier(.16,.84,.44,1)";
  }
})();

/* ---------------------------------------------------------------------
   Store: Buy Now buttons -> Square checkout links
   --------------------------------------------------------------------- */
(function () {
  "use strict";
  document.querySelectorAll(".buy-btn").forEach(function (btn) {
    var url = (btn.getAttribute("data-square-url") || "").trim();
    if (/^https:\/\//i.test(url)) {
      btn.href = url;
      btn.target = "_blank";
      btn.rel = "noopener";
      btn.setAttribute("aria-label", "Buy " + (btn.getAttribute("data-product") || "this item") + " (opens secure Square checkout)");
    } else {
      btn.textContent = "Coming Soon";
      btn.setAttribute("aria-disabled", "true");
      btn.addEventListener("click", function (e) { e.preventDefault(); });
    }
  });
})();

/* ---------------------------------------------------------------------
   Product page: team + size options, gallery, Buy Now
   --------------------------------------------------------------------- */
(function () {
  "use strict";

  var form = document.getElementById("productForm");
  if (!form) return;

  var teamSelect = document.getElementById("teamSelect");
  var sizeSelect = document.getElementById("sizeSelect");
  var buyBtn = document.getElementById("productBuy");
  var summary = document.getElementById("productSelection");
  var mainImg = document.getElementById("galleryMain");
  var thumbs = Array.prototype.slice.call(document.querySelectorAll(".gallery-thumb"));
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 5000);
  }

  function showImage(thumb) {
    if (!thumb || !mainImg) return;
    mainImg.src = thumb.getAttribute("data-full");
    mainImg.alt = thumb.querySelector("img").alt;
    thumbs.forEach(function (t) { t.setAttribute("aria-pressed", t === thumb ? "true" : "false"); });
  }

  thumbs.forEach(function (thumb) {
    thumb.addEventListener("click", function () { showImage(thumb); });
  });

  function setError(field, on) {
    field.closest(".field").classList.toggle("has-error", on);
  }

  function selectionText() {
    return teamSelect.value + " · " + sizeSelect.value;
  }

  function update() {
    var ready = teamSelect.value && sizeSelect.value;
    summary.textContent = ready ? selectionText() : "Pick your team and size";
    // Show a matching photo when we have one for the chosen team
    var match = thumbs.filter(function (t) { return t.getAttribute("data-team") === teamSelect.value; })[0];
    if (match) showImage(match);
  }

  [teamSelect, sizeSelect].forEach(function (el) {
    el.addEventListener("change", function () { setError(el, false); update(); });
  });

  // Preselect a team from the URL, e.g. team-koozies.html?team=Dallas%20Cowboys
  var preset = new URLSearchParams(window.location.search).get("team");
  if (preset) {
    teamSelect.value = preset;
    if (teamSelect.value !== preset) teamSelect.value = "";
  }
  update();

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var missing = [teamSelect, sizeSelect].filter(function (el) { return !el.value; });
    missing.forEach(function (el) { setError(el, true); });
    if (missing.length) { missing[0].focus(); return; }

    var product = form.getAttribute("data-product");
    var price = form.getAttribute("data-price");
    var shipping = form.getAttribute("data-shipping");
    var squareUrl = (buyBtn.getAttribute("data-square-url") || "").trim();
    var order = product + " — " + selectionText();

    if (/^https:\/\//i.test(squareUrl)) {
      // Square checkout can't receive our options, so copy them for the order note
      if (navigator.clipboard) navigator.clipboard.writeText(order).catch(function () {});
      window.open(squareUrl, "_blank", "noopener");
      showToast("Copied “" + selectionText() + "”. Paste it in the order note at checkout.");
      return;
    }

    var subject = "Order: " + order;
    var body = "Hi 11:11 Printlab,\n\nI'd like to order:\n\n" +
      "Product: " + product + "\n" +
      "Team: " + teamSelect.value + "\n" +
      "Size: " + sizeSelect.value + "\n" +
      "Price: $" + price + " + $" + shipping + " shipping = $" + (Number(price) + Number(shipping)) + "\n\n" +
      "Ship to:\n\n\nThanks!";
    window.location.href = "mailto:11x11printlab@gmail.com?subject=" +
      encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    showToast("Opening your email app to send your order…");
  });
})();

/* ---------------------------------------------------------------------
   Opening sequence, hero entrance, hero spotlight, story video
   --------------------------------------------------------------------- */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canAnimate = typeof Element.prototype.animate === "function";
  var intro = document.getElementById("intro");

  function heroPlay() {
    if (!reduce) root.classList.add("hero-play");
  }

  function runIntro() {
    var stage = document.getElementById("introStage");
    var line1 = document.getElementById("introL1");
    var line2 = document.getElementById("introL2");
    var tag = document.getElementById("introTag");
    var zoom = document.getElementById("introZoom");
    var flash = document.getElementById("introFlash");
    var skip = document.getElementById("introSkip");
    var timers = [];
    var done = false;
    var calm = root.classList.contains("intro-calm");

    function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }

    function build(el) {
      var text = el.getAttribute("data-text") || "";
      var spans = [];
      for (var i = 0; i < text.length; i++) {
        var s = document.createElement("span");
        s.className = "intro-ch";
        s.textContent = text.charAt(i);
        el.appendChild(s);
        spans.push(s);
      }
      return spans;
    }

    var SLAM = calm ? 420 : 560;

    function shake() {
      stage.animate([
        { transform: "translate(0,0)" },
        { transform: "translate(-9px,7px)" },
        { transform: "translate(7px,-6px)" },
        { transform: "translate(-3px,2px)" },
        { transform: "translate(0,0)" }
      ], { duration: 240, easing: "ease-out" });
    }

    function pulse() {
      flash.animate([{ opacity: 0 }, { opacity: 0.16 }, { opacity: 0 }], { duration: 320 });
    }

    function slam(el, delay) {
      if (calm) {
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: SLAM, delay: delay, easing: "ease-out", fill: "both" });
        return;
      }
      el.animate([
        { opacity: 0, transform: "scale(3.2) translateY(-10%)", filter: "blur(20px)" },
        { opacity: 1, transform: "scale(0.88) translateY(3%)", filter: "blur(0px)", offset: 0.58 },
        { opacity: 1, transform: "scale(1) translateY(0)", filter: "blur(0px)" }
      ], { duration: SLAM, delay: delay, easing: "cubic-bezier(.16,.84,.3,1)", fill: "both" });
      later(shake, delay + SLAM * 0.58);
    }

    var first = build(line1);
    var second = build(line2);

    // "11:11" lands first, one character at a time, then "PRINTLAB"
    // a beat of pure black first, a slow hammer for 11:11, a long pause, then PRINTLAB
    var start1 = calm ? 500 : 800, step1 = calm ? 220 : 340;
    var start2 = calm ? 1900 : 3200, step2 = calm ? 110 : 170;
    first.forEach(function (el, i) { slam(el, start1 + i * step1); });
    second.forEach(function (el, i) { slam(el, start2 + i * step2); });
    if (!calm) {
      later(pulse, start1 + (first.length - 1) * step1 + SLAM * 0.58);
      later(pulse, start2 + (second.length - 1) * step2 + SLAM * 0.58);
    }

    tag.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 700, delay: calm ? 3300 : 5100, easing: "ease-out", fill: "both" });

    // a slow, steady push toward the screen while the letters land
    if (!calm) {
      zoom.animate([{ transform: "scale(1)" }, { transform: "scale(1.07)" }],
        { duration: 7600, easing: "linear", fill: "both" });
    }

    function finish(fast) {
      if (done) return;
      done = true;
      timers.forEach(window.clearTimeout);
      document.removeEventListener("keydown", onKey);
      var wipe = (fast || calm)
        ? intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fast ? 260 : 700, easing: "ease-out", fill: "forwards" })
        : intro.animate([{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }],
            { duration: 1000, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" });
      window.setTimeout(heroPlay, (fast || calm) ? 80 : 420);
      var ended = false;
      function cleanup() {
        if (ended) return;
        ended = true;
        root.classList.remove("intro-pending");
        try { sessionStorage.setItem("intro-seen", "1"); } catch (e) {}
        window.scrollTo(0, 0);
      }
      wipe.onfinish = cleanup;
      window.setTimeout(cleanup, (fast || calm) ? 1000 : 1500);
    }

    function onKey(e) {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        finish(true);
      }
    }
    document.addEventListener("keydown", onKey);
    intro.addEventListener("click", function () { finish(true); });
    skip.addEventListener("click", function (e) { e.stopPropagation(); finish(true); });
    skip.focus({ preventScroll: true });

    later(function () { finish(false); }, calm ? 4600 : 6700);
  }

  if (intro && canAnimate && root.classList.contains("intro-pending")) {
    runIntro();
  } else {
    root.classList.remove("intro-pending");
    heroPlay();
  }

  /* hero spotlight follows the pointer (desktop only) */
  var hero = document.querySelector(".hero");
  if (hero && !reduce && window.matchMedia("(hover: hover)").matches) {
    var ticking = false;
    hero.addEventListener("pointermove", function (e) {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", (e.clientX - r.left) + "px");
        hero.style.setProperty("--my", (e.clientY - r.top) + "px");
        ticking = false;
      });
    });
  }

  /* story video: poster + big play button, native controls once playing */
  var card = document.getElementById("videoCard");
  var vid = document.getElementById("storyVideo");
  var playBtn = document.getElementById("videoPlay");
  if (card && vid && playBtn) {
    playBtn.addEventListener("click", function () {
      var p = vid.play();
      if (p && p.catch) p.catch(function () {});
    });
    vid.addEventListener("play", function () { card.classList.add("is-playing"); });
    vid.addEventListener("ended", function () { card.classList.remove("is-playing"); });
  }
})();
