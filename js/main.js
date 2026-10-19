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
