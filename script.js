/* ==========================================================================
   CODE5IN — Premium Portfolio Marketplace
   Complete Production-Ready JavaScript
   ========================================================================== */

/* ─────────────────────────────────────────────────────────────────────────
   SCROLL POSITION RESTORATION MANAGER (Desktop & Mobile)
   ───────────────────────────────────────────────────────────────────────── */
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const SCROLL_POS_STORAGE_KEY = "code5in_saved_scroll_y";
const SCROLL_PATH_STORAGE_KEY = "code5in_saved_scroll_path";

let savedScrollY = 0;
try {
  const savedPath = sessionStorage.getItem(SCROLL_PATH_STORAGE_KEY);
  const currentPath = window.location.pathname;
  if (!savedPath || savedPath === currentPath) {
    const rawPos = sessionStorage.getItem(SCROLL_POS_STORAGE_KEY);
    if (rawPos !== null) {
      savedScrollY = Math.max(0, parseInt(rawPos, 10) || 0);
    }
  }
} catch (e) {
  savedScrollY = 0;
}

// Continuously save current scroll position
function recordCurrentScroll() {
  try {
    const currentY =
      window.pageYOffset ||
      window.scrollY ||
      document.documentElement.scrollTop ||
      0;
    sessionStorage.setItem(SCROLL_POS_STORAGE_KEY, Math.round(currentY));
    sessionStorage.setItem(SCROLL_PATH_STORAGE_KEY, window.location.pathname);
  } catch (e) {}
}

let scrollRecordRaf = null;
window.addEventListener(
  "scroll",
  () => {
    if (!scrollRecordRaf) {
      scrollRecordRaf = requestAnimationFrame(() => {
        recordCurrentScroll();
        scrollRecordRaf = null;
      });
    }
  },
  { passive: true }
);

window.addEventListener("beforeunload", recordCurrentScroll);
window.addEventListener("pagehide", recordCurrentScroll);

// Restore scroll position accurately without layout shift or browser clamping
function applyRestoredScroll() {
  if (savedScrollY <= 0) return;

  const maxScroll = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
    document.body.scrollHeight - window.innerHeight
  );
  const targetY = Math.min(
    savedScrollY,
    maxScroll > 0 ? maxScroll : savedScrollY
  );

  if (targetY > 0) {
    window.scrollTo({
      top: targetY,
      left: 0,
      behavior: "instant",
    });
    if (document.documentElement) document.documentElement.scrollTop = targetY;
    if (document.body) document.body.scrollTop = targetY;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Register GSAP Plugins
  gsap.registerPlugin(ScrollTrigger);

  // Early scroll restoration at DOMContentLoaded
  applyRestoredScroll();

  /* ═══════════════════════════════════════════════════════════════
       1. LOADING SCREEN & HERO INITIALIZATION
       ═══════════════════════════════════════════════════════════════ */
  const loadingScreen = document.getElementById("loadingScreen");
  const loaderContent = document.getElementById("loaderContent");
  const lampUnit = document.getElementById("lampUnit");
  const loaderBulb = document.getElementById("loaderBulb");
  const loaderLightBeam = document.getElementById("loaderLightBeam");
  const logoFrame = document.getElementById("loaderLogoFrame");
  const logo1 = document.getElementById("loaderLogo1");
  const logo2 = document.getElementById("loaderLogo2");
  const progressBarFill = document.getElementById("loaderBarFill");
  const percentageEl = document.getElementById("loaderPercentage");

  const isScrolledRefresh = savedScrollY > 60;
  const prefersReducedMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let isLoaderDismissed = false;

  // Percentage & bar updater
  const progressState = { percent: 0 };
  function setLoaderProgress(val) {
    const rounded = Math.min(100, Math.max(0, Math.round(val)));
    if (progressBarFill) {
      progressBarFill.style.width = rounded + "%";
    }
    if (percentageEl) {
      percentageEl.innerHTML = `LOADING&nbsp;&nbsp;${rounded}%`;
    }
  }

  // Bulb ON/OFF & Logo illumination state controller
  function setBulbState(isOn) {
    if (isOn) {
      if (loaderBulb) loaderBulb.classList.add("is-on");
      if (logoFrame) logoFrame.classList.add("is-illuminated");
    } else {
      if (loaderBulb) loaderBulb.classList.remove("is-on");
      if (logoFrame) logoFrame.classList.remove("is-illuminated");
    }
  }

  // Clean, unified dismiss and reveal function
  function dismissLoadingScreen(isInstant = false) {
    if (isLoaderDismissed) return;
    isLoaderDismissed = true;
    clearTimeout(safetyTimeout);

    // Ensure Logo 2 remains cleanly presented
    if (logo1) gsap.set(logo1, { opacity: 0 });
    if (logo2) gsap.set(logo2, { opacity: 1, x: 0, filter: "none", clipPath: "none" });
    setLoaderProgress(100);

    const finishHomepageReveal = () => {
      setBulbState(false);
      if (loadingScreen) {
        loadingScreen.style.display = "none";
      }
      document.body.classList.add("loaded");

      if (!isScrolledRefresh) {
        initHeroAnimations();
      } else {
        // Scrolled refresh: finalize hero elements in their ready state
        gsap.set(
          ".hero-badge, .hero-headline, .hero-description, .hero-cta-group, .hero-microcopy, .hero-showcase, .hero-stats-bar",
          { opacity: 1, y: 0, clearProps: "transform" }
        );
        applyRestoredScroll();
      }

      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh();
      }

      if (window.triggerStatsAnimationIfVisible) {
        window.triggerStatsAnimationIfVisible();
      }
    };

    if (!loadingScreen || isInstant) {
      finishHomepageReveal();
      return;
    }

    // If user restored a scrolled position or requested reduced motion: fade out rapidly
    if (isScrolledRefresh || prefersReducedMotion) {
      gsap.to(loadingScreen, {
        opacity: 0,
        duration: isScrolledRefresh ? 0.25 : 0.35,
        ease: "power2.inOut",
        onComplete: finishHomepageReveal,
      });
      return;
    }

    // Stage 4: Refined curtain-reveal transition
    const outTl = gsap.timeline({
      onComplete: finishHomepageReveal,
    });

    if (loaderContent) {
      outTl.to(loaderContent, {
        opacity: 0,
        y: -18,
        duration: 0.35,
        ease: "power2.in",
      });
    }

    outTl.to(
      loadingScreen,
      {
        yPercent: -100,
        duration: 0.8,
        ease: "power3.inOut",
      },
      "-=0.15"
    );
  }

  // Bulletproof safety fallback: ensure loading screen disappears even if any asset or animation fails
  const safetyTimeout = setTimeout(() => {
    dismissLoadingScreen(true);
  }, 4800);

  if (isScrolledRefresh || prefersReducedMotion) {
    setBulbState(false);
    if (logo1) gsap.set(logo1, { opacity: 0 });
    if (logo2) gsap.set(logo2, { opacity: 1, x: 0, filter: "none", clipPath: "none" });
    setLoaderProgress(100);
    // Quick exit for scrolled refresh or reduced motion
    setTimeout(() => {
      dismissLoadingScreen(false);
    }, prefersReducedMotion ? 120 : 200);
  } else if (loadingScreen && logo1 && logo2) {
    try {
      // Check actual page load status to prevent premature 100%
      let isWindowLoaded = document.readyState === "complete";
      if (!isWindowLoaded) {
        window.addEventListener(
          "load",
          () => {
            isWindowLoaded = true;
          },
          { once: true }
        );
      }

      const tl = gsap.timeline({
        onComplete: () => {
          dismissLoadingScreen(false);
        },
      });

      // Initialize: Show Loading Logo 1 centered, hide Logo 2, bulb is completely OFF
      gsap.set(logo1, { opacity: 1, x: 0, filter: "none", clipPath: "none" });
      gsap.set(logo2, { opacity: 0, x: 0, filter: "none", clipPath: "none" });
      setBulbState(false);

      // ─────────────────────────────────────────────────────────────
      // STAGE 1: Show Loading Logo 1 (Bulb is OFF while logo is normal)
      // ─────────────────────────────────────────────────────────────
      // Progress bar advances smoothly towards 38%
      tl.to(
        progressState,
        {
          percent: 38,
          duration: 0.85,
          ease: "power1.inOut",
          onUpdate: () => setLoaderProgress(progressState.percent),
        },
        0.20
      );

      // ─────────────────────────────────────────────────────────────
      // STAGE 2: Glitch Logo 1 (Bulb turns ON strictly with glitch pulses)
      // ─────────────────────────────────────────────────────────────

      // Glitch Pulse 1 Starts: Bulb turns ON with light pulse
      tl.add(() => {
        setBulbState(true);
        gsap.set(logo1, {
          x: -3,
          filter:
            "drop-shadow(-3px 0 0 rgba(0, 240, 255, 0.75)) drop-shadow(3px 0 0 rgba(255, 45, 85, 0.75))",
          clipPath: "polygon(0 18%, 100% 18%, 100% 46%, 0 46%)",
        });
      }, 1.10);

      // Glitch Pulse 1 Finishes: Bulb turns OFF immediately
      tl.add(() => {
        setBulbState(false);
        gsap.set(logo1, { x: 0, filter: "none", clipPath: "none" });
      }, 1.18);

      // Glitch Pulse 2 Starts: Bulb turns ON with light pulse
      tl.add(() => {
        setBulbState(true);
        gsap.set(logo1, {
          x: 3,
          filter:
            "drop-shadow(3px 0 0 rgba(0, 240, 255, 0.6)) drop-shadow(-3px 0 0 rgba(255, 45, 85, 0.6))",
          clipPath: "polygon(0 52%, 100% 52%, 100% 82%, 0 82%)",
        });
      }, 1.28);

      // Glitch Pulse 2 Finishes: Bulb turns OFF immediately
      tl.add(() => {
        setBulbState(false);
        gsap.set(logo1, { x: 0, filter: "none", clipPath: "none" });
      }, 1.36);

      // Progress bar advances towards 68% during the glitch sequence
      tl.to(
        progressState,
        {
          percent: 68,
          duration: 0.45,
          ease: "power1.out",
          onUpdate: () => setLoaderProgress(progressState.percent),
        },
        1.10
      );

      // ─────────────────────────────────────────────────────────────
      // STAGE 3: Transition to Loading Logo 2
      // ─────────────────────────────────────────────────────────────

      // Transition Glitch Starts: Bulb turns ON with decisive transition surge
      tl.add(() => {
        setBulbState(true);
        // Displace Logo 1
        gsap.set(logo1, {
          opacity: 1,
          x: 4,
          clipPath: "polygon(0 42%, 100% 42%, 100% 86%, 0 86%)",
          filter:
            "drop-shadow(4px 0 0 rgba(0, 240, 255, 0.8)) drop-shadow(-4px 0 0 rgba(255, 45, 85, 0.8))",
        });
        // Snap Logo 2 in at the exact same position and visual size
        gsap.set(logo2, {
          opacity: 1,
          x: -4,
          filter:
            "drop-shadow(-4px 0 0 rgba(0, 240, 255, 0.8)) drop-shadow(4px 0 0 rgba(255, 45, 85, 0.8))",
          clipPath: "polygon(0 0, 100% 0, 100% 58%, 0 58%)",
        });
      }, 1.45);

      tl.add(() => {
        // Complete transition handoff: Logo 1 hidden, Logo 2 prominent
        gsap.set(logo1, { opacity: 0, x: 0, filter: "none", clipPath: "none" });
        gsap.set(logo2, {
          opacity: 1,
          x: 1,
          filter: "drop-shadow(1px 0 0 rgba(0, 240, 255, 0.35))",
          clipPath: "none",
        });
      }, 1.54);

      // Micro-settle twitch on Logo 2
      tl.add(() => {
        gsap.set(logo2, {
          x: -1.5,
          filter: "drop-shadow(-2px 0 0 rgba(255, 45, 85, 0.5))",
          clipPath: "polygon(0 62%, 100% 62%, 100% 82%, 0 82%)",
        });
      }, 1.62);

      // Final Glitch Finishes Completely: Keep bulb ON continuously with steady warm glow
      tl.add(() => {
        setBulbState(true);
        gsap.set(logo2, {
          opacity: 1,
          x: 0,
          filter: "none",
          clipPath: "none",
        });
      }, 1.70);

      // ─────────────────────────────────────────────────────────────
      // STAGE 4: Logo 2 Displayed With Steady Warm Light -> 100% Progress -> Homepage Reveal
      // ─────────────────────────────────────────────────────────────

      // Complete progress smoothly to 100%
      tl.to(
        progressState,
        {
          percent: 100,
          duration: 0.55,
          ease: "power2.out",
          onUpdate: () => setLoaderProgress(progressState.percent),
        },
        1.70
      );

      // Hold Logo 2 displayed normally at 100% before curtain reveal
      tl.to({}, { duration: 0.4 }, 2.30);
    } catch (err) {
      console.warn("Loader animation error caught, falling back:", err);
      dismissLoadingScreen(true);
    }
  } else {
    dismissLoadingScreen(false);
  }

  /* ═══════════════════════════════════════════════════════════════
       2. CUSTOM CURSOR
       ═══════════════════════════════════════════════════════════════ */
  const cursorDot = document.getElementById("cursorDot");
  const cursorRing = document.getElementById("cursorRing");
  let mouseX = 0,
    mouseY = 0,
    ringX = 0,
    ringY = 0;

  if (window.innerWidth > 1024) {
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.left = mouseX + "px";
      cursorDot.style.top = mouseY + "px";
    });

    const animateRing = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      cursorRing.style.left = ringX + "px";
      cursorRing.style.top = ringY + "px";
      requestAnimationFrame(animateRing);
    };
    requestAnimationFrame(animateRing);

    const addCursorHover = () => {
      document
        .querySelectorAll(
          "a, button, .template-card, input, textarea, .filter-pill, .faq-header",
        )
        .forEach((el) => {
          el.addEventListener("mouseenter", () => {
            cursorDot.classList.add("cursor-hover");
            cursorRing.classList.add("cursor-hover");
          });
          el.addEventListener("mouseleave", () => {
            cursorDot.classList.remove("cursor-hover");
            cursorRing.classList.remove("cursor-hover");
          });
        });
    };
    // Delay to allow dynamic elements to load
    setTimeout(addCursorHover, 3000);
  }

  /* ═══════════════════════════════════════════════════════════════
       3. NAVIGATION
       ═══════════════════════════════════════════════════════════════ */
  const navbar = document.getElementById("navbar");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const navItems = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");

  // Scroll state with RAF throttling and passive listener
  let isScrollTicking = false;
  function handleScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }

    // Active nav link
    let current = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute("id");
      }
    });
    navItems.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + current) {
        link.classList.add("active");
      }
    });

    // Scroll progress
    updateScrollProgress();

    // Back to top
    updateBackToTop();

    isScrollTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!isScrollTicking) {
        requestAnimationFrame(handleScroll);
        isScrollTicking = true;
      }
    },
    { passive: true }
  );

  // Mobile navigation drawer controls
  const navBackdrop = document.getElementById("navBackdrop");

  const closeMobileNav = () => {
    if (navToggle) {
      navToggle.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
    }
    if (navLinks) navLinks.classList.remove("active");
    if (navBackdrop) navBackdrop.classList.remove("active");
    if (navbar) navbar.classList.remove("nav-open");
    document.body.classList.remove("no-scroll");
  };

  const openMobileNav = () => {
    if (navToggle) {
      navToggle.classList.add("active");
      navToggle.setAttribute("aria-expanded", "true");
    }
    if (navLinks) navLinks.classList.add("active");
    if (navBackdrop) navBackdrop.classList.add("active");
    if (navbar) navbar.classList.add("nav-open");
    document.body.classList.add("no-scroll");
  };

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks && navLinks.classList.contains("active");
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  if (navBackdrop) {
    navBackdrop.addEventListener("click", closeMobileNav);
  }

  // Close mobile on link click
  document.querySelectorAll(".nav-link, .mobile-nav-btn").forEach((link) => {
    link.addEventListener("click", closeMobileNav);
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks && navLinks.classList.contains("active")) {
      closeMobileNav();
    }
  });

  // Close drawer if window is resized above mobile breakpoint
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && navLinks && navLinks.classList.contains("active")) {
      closeMobileNav();
    }
  });

  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const targetPos =
          target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: targetPos, behavior: "smooth" });
      }
    });
  });

  /* ═══════════════════════════════════════════════════════════════
     3B. MOBILE SERVICES ACCORDION (Interactive on screens ≤ 767px)
     ═══════════════════════════════════════════════════════════════ */
  const serviceRows = document.querySelectorAll(".service-editorial-row");

  serviceRows.forEach((row) => {
    const trigger = row.querySelector(".service-mobile-trigger");
    const panel = row.querySelector(".service-collapse-panel");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", () => {
      // Only execute accordion behavior on mobile screens (≤ 767px)
      if (window.innerWidth > 767) return;

      const isExpanded = row.classList.contains("active");

      // Close all other service rows (one open at a time)
      serviceRows.forEach((otherRow) => {
        if (otherRow !== row && otherRow.classList.contains("active")) {
          otherRow.classList.remove("active");
          const otherTrigger = otherRow.querySelector(".service-mobile-trigger");
          const otherPanel = otherRow.querySelector(".service-collapse-panel");
          if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
          if (otherPanel) otherPanel.style.maxHeight = null;
        }
      });

      // Toggle current service row
      if (isExpanded) {
        row.classList.remove("active");
        trigger.setAttribute("aria-expanded", "false");
        panel.style.maxHeight = null;
      } else {
        row.classList.add("active");
        trigger.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });

  // Reset accordion inline styling if resized above mobile breakpoint
  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) {
      serviceRows.forEach((row) => {
        row.classList.remove("active");
        const trigger = row.querySelector(".service-mobile-trigger");
        const panel = row.querySelector(".service-collapse-panel");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
        if (panel) panel.style.maxHeight = null;
      });
    }
  });

  /* ═══════════════════════════════════════════════════════════════
       4. SCROLL PROGRESS BAR
       ═══════════════════════════════════════════════════════════════ */
  const scrollProgress = document.getElementById("scrollProgress");

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    scrollProgress.style.width = scrollPercent + "%";
  }

  /* ═══════════════════════════════════════════════════════════════
       5. HERO ANIMATIONS (Deliberate & Editorial)
       ═══════════════════════════════════════════════════════════════ */
  function initHeroAnimations() {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const tl = gsap.timeline({
      onComplete: () => {
        if (window.triggerStatsAnimationIfVisible) {
          window.triggerStatsAnimationIfVisible();
        }
      },
    });

    tl.from(".hero-badge", {
      opacity: 0,
      y: 18,
      duration: 0.5,
      ease: "power2.out",
    })
      .from(
        ".hero-headline",
        { opacity: 0, y: 30, duration: 0.7, ease: "power2.out" },
        "-=0.25",
      )
      .from(
        ".hero-description",
        { opacity: 0, y: 18, duration: 0.5, ease: "power2.out" },
        "-=0.35",
      )
      .from(
        ".hero-cta-group",
        { opacity: 0, y: 16, duration: 0.5, ease: "power2.out" },
        "-=0.3",
      )
      .from(
        ".hero-microcopy",
        { opacity: 0, y: 12, duration: 0.4, ease: "power2.out" },
        "-=0.2",
      );

    if (!isMobile) {
      tl.from(
        ".hero-showcase",
        { opacity: 0, y: 32, duration: 0.7, ease: "power2.out" },
        "-=0.25",
      );
    }

    tl.from(
      ".hero-stats-bar",
      {
        opacity: 0,
        y: 18,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          if (window.triggerStatsAnimationIfVisible) {
            window.triggerStatsAnimationIfVisible();
          }
        },
      },
      "-=0.3",
    );
  }

  // Understated mouse parallax on editorial preview cards
  const hero = document.getElementById("home");
  const showcaseCards = document.querySelectorAll(".showcase-card");

  if (hero && window.innerWidth > 1024) {
    hero.addEventListener("mousemove", (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      showcaseCards.forEach((card, i) => {
        const speed = (i + 1) * 6;
        gsap.to(card, {
          x: x * speed,
          y: y * speed,
          duration: 1.2,
          ease: "power2.out",
        });
      });
    });
  }

  // Hero Share Button Handler
  const heroShareBtn = document.getElementById("heroShareBtn");
  if (heroShareBtn) {
    heroShareBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const shareData = {
        title: "Code5in — Creative Portfolio Website Studio",
        text: "Explore Code5in portfolio templates and build your professional online presence.",
        url: window.location.href,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          // Handled gracefully when user cancels or dismisses share sheet
          if (err.name !== "AbortError") {
            console.log("Share dismissed");
          }
        }
      } else {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(window.location.href);
          } else {
            const tempInput = document.createElement("input");
            tempInput.value = window.location.href;
            tempInput.style.position = "fixed";
            tempInput.style.opacity = "0";
            document.body.appendChild(tempInput);
            tempInput.focus();
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);
          }
          showShareToast("Link copied to clipboard!");
        } catch (err) {
          showShareToast("Link copied to clipboard!");
        }
      }
    });
  }

  function showShareToast(message) {
    const existing = document.querySelector(".share-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "share-toast";
    toast.innerHTML = `<i class="fas fa-check-circle"></i> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  /* ═══════════════════════════════════════════════════════════════
       6. HERO PARTICLE SYSTEM
       ═══════════════════════════════════════════════════════════════ */
  const canvas = document.getElementById("heroParticles");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let canvasWidth, canvasHeight;

    function resizeCanvas() {
      canvasWidth = canvas.width = hero.offsetWidth;
      canvasHeight = canvas.height = hero.offsetHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class Particle {
      constructor() {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 2 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x > canvasWidth) this.x = 0;
        if (this.x < 0) this.x = canvasWidth;
        if (this.y > canvasHeight) this.y = 0;
        if (this.y < 0) this.y = canvasHeight;
      }
      draw() {
        ctx.fillStyle = "rgba(184, 165, 138, 0.3)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      const count = window.innerWidth > 768 ? 35 : 18;
      for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    let isHeroVisible = true;
    let particleRafId = null;

    function animateParticles() {
      if (!isHeroVisible) {
        particleRafId = null;
        return;
      }
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.strokeStyle = `rgba(184, 165, 138, ${0.1 - dist / 1200})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      particleRafId = requestAnimationFrame(animateParticles);
    }

    if ("IntersectionObserver" in window) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isHeroVisible = entry.isIntersecting;
            if (isHeroVisible && !particleRafId) {
              particleRafId = requestAnimationFrame(animateParticles);
            }
          });
        },
        { threshold: 0 }
      );
      heroObserver.observe(hero);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        isHeroVisible = false;
      } else if (hero.getBoundingClientRect().bottom > 0) {
        isHeroVisible = true;
        if (!particleRafId) {
          particleRafId = requestAnimationFrame(animateParticles);
        }
      }
    });

    initParticles();
    animateParticles();
  }

  /* ═══════════════════════════════════════════════════════════════
       7. GSAP SCROLL ANIMATIONS
       ═══════════════════════════════════════════════════════════════ */
  gsap.utils.toArray(".fade-up").forEach((el) => {
    // Skip hero elements that are animated by initHeroAnimations timeline
    if (el.closest(".hero")) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      },
    );
  });

  gsap.utils.toArray(".fade-left").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: -60 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      },
    );
  });

  gsap.utils.toArray(".fade-right").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, x: 60 },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      },
    );
  });

  gsap.utils.toArray(".scale-in").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      },
    );
  });

  gsap.utils.toArray(".stagger-container").forEach((container) => {
    const items = container.querySelectorAll(".stagger-item");
    if (items.length > 0) {
      gsap.fromTo(
        items,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: container, start: "top 85%", once: true },
        },
      );
    }
  });

  /* Workflow Timeline Scroll Animation */
  const workflowTimeline = document.getElementById("workflowTimeline");
  const workflowProgressLine = document.getElementById("workflowProgressLine");
  const workflowSteps = document.querySelectorAll(".workflow-step");

  if (workflowTimeline && workflowSteps.length > 0) {
    gsap.to(workflowProgressLine, {
      height: "100%",
      ease: "none",
      scrollTrigger: {
        trigger: workflowTimeline,
        start: "top 75%",
        end: "bottom 60%",
        scrub: 0.3,
      },
    });

    workflowSteps.forEach((step) => {
      ScrollTrigger.create({
        trigger: step,
        start: "top 75%",
        onEnter: () => step.classList.add("active"),
        onLeaveBack: () => step.classList.remove("active"),
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
       8. TEMPLATE DATA
       ═══════════════════════════════════════════════════════════════ */
  const templates = [
    {
      id: "001",
      name: "NOVA",
      profession: "Universal Portfolio",
      category: "multipurpose",
      style: "Clean, Minimal, Professional",
      image: "./images/templates/nova.png",
      prices: {
        INR: { price: 1499, oldPrice: 4999 },
        USD: { price: 29, oldPrice: 109 },
      },
      features: [
        "Universal Portfolio",
        "Skills",
        "Experience",
        "Projects",
        "Download CV",
        "Responsive",
      ],
      link: "./template001/files/template001.html",
    },
    {
      id: "002",
      name: "CURA",
      profession: "Doctor",
      category: "healthcare",
      style: "Medical, Clean, Trust",
      image: "./images/templates/cura.png",
      prices: {
        INR: { price: 1799, oldPrice: 7999 },
        USD: { price: 59, oldPrice: 181 },
      },
      features: [
        "Appointments",
        "Reviews",
        "Services",
        "Healthcare Profile",
        "Patient Portal",
        "Responsive",
      ],
      link: "./template002/files/index.html",
    },
    {
      id: "003",
      name: "LEXORA",
      profession: "Lawyer",
      category: "professional",
      style: "Authoritative, Elegant, Refined",
      image: "./images/templates/lexora.png",
      prices: {
        INR: { price: 1699, oldPrice: 6999 },
        USD: { price: 59, oldPrice: 177 },
      },
      features: [
        "Practice Areas",
        "Case Studies",
        "Consultation Form",
        "Legal Services",
        "Team Section",
        "Responsive",
      ],
      link: "./template003/",
    },
    {
      id: "004",
      name: "FORMA",
      profession: "Architect",
      category: "creative",
      style: "Bold, Structural, Modern",
      image: "./images/templates/forma.png",
      prices: {
        INR: { price: 1499, oldPrice: 5499 },
        USD: { price: 69, oldPrice: 234 },
      },
      features: [
        "Projects",
        "Design Process",
        "Portfolio Gallery",
        "Case Studies",
        "3D Showcase",
        "Responsive",
      ],
      link: "./template004/",
    },
    {
      id: "005",
      name: "VANTA",
      profession: "Photographer",
      category: "creative",
      style: "Minimal, Visual, Premium",
      image: "./images/templates/vanta.png",
      prices: {
        INR: { price: 1799, oldPrice: 7999 },
        USD: { price: 69, oldPrice: 250 },
      },
      features: [
        "Photo Gallery",
        "Portfolio",
        "Services",
        "Client Reviews",
        "Booking Form",
        "Responsive",
      ],
      link: "./template005/",
    },
    {
      id: "006",
      name: "ASCEND",
      profession: "Business Consultant",
      category: "business",
      style: "Strategic, Growth, Professional",
      image: "./images/templates/ascend.png",
      prices: {
        INR: { price: 1699, oldPrice: 6999 },
        USD: { price: 59, oldPrice: 178 },
      },
      features: [
        "Consulting Services",
        "Strategy Process",
        "Growth Metrics",
        "Client Results",
        "Case Studies",
        "Responsive",
      ],
      link: "./template006/",
    },
    {
      id: "007",
      name: "LEDGER CA",
      profession: "Chartered Accountant",
      category: "finance",
      style: "Precise, Trustworthy, Clean",
      image: "./images/templates/ledger-ca.png",
      prices: {
        INR: { price: 1599, oldPrice: 5999 },
        USD: { price: 55, oldPrice: 165 },
      },
      features: [
        "GST Services",
        "Audit",
        "Tax Planning",
        "Compliance",
        "Consultation",
        "Responsive",
      ],
      link: "./template007/",
    },
    {
      id: "008",
      name: "ATELIER",
      profession: "Makeup Artist",
      category: "creative",
      style: "Glamorous, Artistic, Vibrant",
      image: "./images/templates/atelier.png",
      prices: {
        INR: { price: 1699, oldPrice: 6499 },
        USD: { price: 55, oldPrice: 172 },
      },
      features: [
        "Pricing",
        "Gallery",
        "Booking",
        "Services",
        "Before & After",
        "Responsive",
      ],
      link: "./template008/",
    },
    {
      id: "009",
      name: "VYBE",
      profession: "Female Influencer",
      category: "creative",
      style: "Trendy, Bold, Social",
      image: "./images/templates/vybe.png",
      prices: {
        INR: { price: 1549, oldPrice: 5499 },
        USD: { price: 55, oldPrice: 146 },
      },
      features: [
        "Brand Collaborations",
        "Social Stats",
        "Media Kit",
        "Content Feed",
        "Contact",
        "Responsive",
      ],
      link: "./template009/",
    },
    {
      id: "010",
      name: "DRIFT",
      profession: "Male Influencer",
      category: "creative",
      style: "Edgy, Dynamic, Modern",
      image: "./images/templates/drift.png",
      prices: {
        INR: { price: 1599, oldPrice: 5499 },
        USD: { price: 55, oldPrice: 153 },
      },
      features: [
        "Content Showcase",
        "Analytics",
        "Brand Deals",
        "Social Feed",
        "Contact",
        "Responsive",
      ],
      link: "./template010/",
    },
    {
      id: "011",
      name: "ESTATE",
      profession: "Real Estate Agent",
      category: "business",
      style: "Luxury, Trust, Property",
      image: "./images/templates/estate.png",
      prices: {
        INR: { price: 1799, oldPrice: 7999 },
        USD: { price: 79, oldPrice: 269 },
      },
      features: [
        "Property Listings",
        "Virtual Tours",
        "Inquiry Form",
        "Market Reports",
        "Testimonials",
        "Responsive",
      ],
      link: "./template011/",
    },
    {
      id: "012",
      name: "PULSE",
      profession: "Music Artist",
      category: "creative",
      style: "Vibrant, Rhythmic, Bold",
      image: "./images/templates/pulse.png",
      prices: {
        INR: { price: 1699, oldPrice: 6999 },
        USD: { price: 59, oldPrice: 180 },
      },
      features: [
        "Music Player",
        "Albums",
        "Videos",
        "Events",
        "Merch",
        "Responsive",
      ],
      link: "./template012/",
    },
    {
      id: "013",
      name: "MOMENT",
      profession: "Event Management",
      category: "business",
      style: "Elegant, Celebratory, Refined",
      image: "./images/templates/moment.png",
      prices: {
        INR: { price: 1499, oldPrice: 5999 },
        USD: { price: 59, oldPrice: 175 },
      },
      features: [
        "Weddings",
        "Corporate Events",
        "Booking System",
        "Gallery",
        "Testimonials",
        "Responsive",
      ],
      link: "./template013/",
    },
    {
      id: "014",
      name: "STRUCTA",
      profession: "Civil Engineer",
      category: "professional",
      style: "Technical, Precise, Industrial",
      image: "./images/templates/structa.png",
      prices: {
        INR: { price: 1599, oldPrice: 5999 },
        USD: { price: 55, oldPrice: 167 },
      },
      features: [
        "Projects",
        "Technical Drawings",
        "Timeline",
        "Certifications",
        "Contact",
        "Responsive",
      ],
      link: "./template014/",
    },
    {
      id: "015",
      name: "METRIC",
      profession: "CMA",
      category: "finance",
      style: "Analytical, Data-Driven, Clean",
      image: "./images/templates/metric.png",
      prices: {
        INR: { price: 1649, oldPrice: 6499 },
        USD: { price: 55, oldPrice: 171 },
      },
      features: [
        "Cost Analysis",
        "KPI Dashboard",
        "Reporting",
        "Consultation",
        "Resources",
        "Responsive",
      ],
      link: "./template015/",
    },
    {
      id: "016",
      name: "AMPLIFY",
      profession: "Digital Marketer",
      category: "creative",
      style: "Dynamic, Growth, Digital",
      image: "./images/templates/amplify.png",
      prices: {
        INR: { price: 1699, oldPrice: 6799 },
        USD: { price: 59, oldPrice: 184 },
      },
      features: [
        "SEO",
        "Google Ads",
        "Analytics",
        "Case Studies",
        "Strategy",
        "Responsive",
      ],
      link: "./template016/",
    },
    {
      id: "017",
      name: "LEDGER PRO",
      profession: "Accountant",
      category: "finance",
      style: "Professional, Reliable, Clean",
      image: "./images/templates/ledger-pro.png",
      prices: {
        INR: { price: 1649, oldPrice: 6299 },
        USD: { price: 55, oldPrice: 166 },
      },
      features: [
        "Bookkeeping",
        "GST Filing",
        "Payroll",
        "Tax Services",
        "Consultation",
        "Responsive",
      ],
      link: "./template017/",
    },
    {
      id: "018",
      name: "PHARMA",
      profession: "Pharmacist",
      category: "healthcare",
      style: "Medical, Trustworthy, Clean",
      image: "./images/templates/pharma.png",
      prices: {
        INR: { price: 1549, oldPrice: 5699 },
        USD: { price: 55, oldPrice: 148 },
      },
      features: [
        "Prescription Review",
        "Patient Support",
        "Medication Consulting",
        "Health Tips",
        "Contact",
        "Responsive",
      ],
      link: "./template018/",
    },
    {
      id: "019",
      name: "NOMAD",
      profession: "Travel Guide",
      category: "creative",
      style: "Adventurous, Wanderlust, Vibrant",
      image: "./images/templates/nomad.png",
      prices: {
        INR: { price: 1599, oldPrice: 6199 },
        USD: { price: 55, oldPrice: 173 },
      },
      features: [
        "Destinations",
        "Travel Packages",
        "Booking",
        "Blog",
        "Reviews",
        "Responsive",
      ],
      link: "./template019/",
    },
    {
      id: "020",
      name: "APEX",
      profession: "Universal Professional",
      category: "multipurpose",
      style: "Versatile, Modern, Adaptive",
      image: "./images/templates/apex.png",
      prices: {
        INR: { price: 1799, oldPrice: 7999 },
        USD: { price: 99, oldPrice: 349 },
      },
      features: [
        "Services",
        "Projects",
        "Testimonials",
        "Blog",
        "Contact",
        "Responsive",
      ],
      link: "./template020/",
    },
  ];

  /* ═══════════════════════════════════════════════════════════════
       8B. CURRENCY STATE & HELPERS
       ═══════════════════════════════════════════════════════════════ */
  let currentCurrency = "INR";

  function formatPrice(val, currency = currentCurrency) {
    if (currency === "USD") {
      return "$" + val;
    }
    return "₹" + val.toLocaleString("en-IN");
  }

  function calcDiscount(original, current) {
    return Math.round(((original - current) / original) * 100) + "% OFF";
  }

  function getTemplatePrices(template, currency = currentCurrency) {
    const p =
      template.prices && template.prices[currency]
        ? template.prices[currency]
        : template.prices.INR;
    return {
      price: formatPrice(p.price, currency),
      oldPrice: formatPrice(p.oldPrice, currency),
      discount: calcDiscount(p.oldPrice, p.price),
      rawPrice: p.price,
      rawOldPrice: p.oldPrice,
    };
  }

  /* ═══════════════════════════════════════════════════════════════
       9. TEMPLATE RENDERING & FILTERING
       ═══════════════════════════════════════════════════════════════ */
  const templatesGrid = document.getElementById("templatesGrid");
  const showMoreBtn = document.getElementById("showMoreBtn");
  const showMoreWrapper = document.getElementById("showMoreWrapper");
  const filterPills = document.querySelectorAll(".filter-pill");
  const searchInput = document.getElementById("templateSearch");

  let visibleCount = 6;
  const increment = 6;
  let filteredTemplates = [...templates];
  let debounceTimer;

  function renderTemplates(startFrom = 0) {
    if (startFrom === 0) templatesGrid.innerHTML = "";

    const templatesToRender = filteredTemplates.slice(startFrom, visibleCount);

    templatesToRender.forEach((template) => {
      const featuresHTML = template.features
        .slice(0, 4)
        .map((f) => `<span class="feature-chip">${f}</span>`)
        .join("");

      const prices = getTemplatePrices(template, currentCurrency);
      const baseImg = template.image.replace(/\.png$/i, "");

      const card = document.createElement("div");
      card.className = "template-card";
      card.setAttribute("data-id", template.id);
      card.setAttribute("data-category", template.category);
      card.setAttribute("data-tilt", "");
      card.setAttribute("data-tilt-max", "6");
      card.setAttribute("data-tilt-speed", "400");
      card.setAttribute("data-tilt-glare", "");
      card.setAttribute("data-tilt-max-glare", "0.15");

      card.innerHTML = `
                <div class="card-shine"></div>
                <div class="card-header">
                    <span class="template-number">#${template.id}</span>
                    <span class="template-discount-badge">${prices.discount}</span>
                </div>
                <div class="template-preview-wrapper">
                    <img
                        src="${baseImg}.webp"
                        srcset="${baseImg}-480.webp 480w, ${baseImg}-800.webp 800w, ${baseImg}.webp 1200w"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                        alt="${template.name} — ${template.profession} Portfolio Template"
                        class="template-preview-img"
                        width="1200"
                        height="600"
                        loading="lazy"
                        decoding="async">
                </div>
                <div class="card-body">
                    <div class="template-title-row">
                        <h3 class="template-name">${template.name}</h3>
                        <div class="template-price-box">
                            <span class="template-old-price">${prices.oldPrice}</span>
                            <span class="template-price">${prices.price}</span>
                        </div>
                    </div>
                    <p class="template-profession">${template.profession}</p>
                    <p class="template-style">${template.style}</p>
                    <div class="template-features">${featuresHTML}</div>
                </div>
                <div class="card-footer">
                    <a href="${template.link}" class="btn-preview" target="_blank" rel="noopener noreferrer">Live Preview</a>
                    <button class="btn-details" data-id="${template.id}">View Details</button>
                </div>
                <a href="https://wa.me/919747506274?text=${encodeURIComponent("Hi Code5in, I want to get the " + template.name + " (" + template.profession + ") template.")}" class="btn-make-yours" target="_blank" rel="noopener noreferrer">
                    <span>Make It Yours</span>
                    <i class="fab fa-whatsapp"></i>
                </a>
            `;

      templatesGrid.appendChild(card);

      // Details button
      card.querySelector(".btn-details").addEventListener("click", function () {
        openTemplateModal(this.getAttribute("data-id"));
      });
    });

    // Init VanillaTilt on new cards
    if (typeof VanillaTilt !== "undefined") {
      const allCards = templatesGrid.querySelectorAll(".template-card");
      const newCards = Array.from(allCards).slice(startFrom);
      VanillaTilt.init(newCards);
    }

    // Animate new cards
    const allCards = templatesGrid.querySelectorAll(".template-card");
    const newCards = Array.from(allCards).slice(startFrom);
    gsap.fromTo(
      newCards,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power3.out" },
    );

    updateShowMore();
  }

  function updateShowMore() {
    if (visibleCount >= filteredTemplates.length) {
      showMoreWrapper.style.display = "none";
    } else {
      showMoreWrapper.style.display = "block";
      showMoreBtn.innerHTML = `<span>View All ${filteredTemplates.length} Templates</span> <span class="btn-arrow">&darr;</span>`;
    }
  }

  showMoreBtn.addEventListener("click", () => {
    const start = visibleCount;
    visibleCount += increment;
    renderTemplates(start);
  });

  // Filter by category
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      const category = pill.getAttribute("data-filter");
      const searchTerm = searchInput.value;
      applyFilters(category, searchTerm);
    });
  });

  // Search
  searchInput.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const activeCat =
        document
          .querySelector(".filter-pill.active")
          ?.getAttribute("data-filter") || "all";
      applyFilters(activeCat, e.target.value);
    }, 300);
  });

  function applyFilters(category, searchTerm) {
    filteredTemplates = templates.filter((t) => {
      // Always show Template 001 (NOVA) in search/filter results
      if (t.id === "001") return true;

      const matchCat = category === "all" || t.category === category;
      const s = searchTerm.toLowerCase();
      const matchSearch =
        !s ||
        t.name.toLowerCase().includes(s) ||
        t.profession.toLowerCase().includes(s) ||
        t.features.some((f) => f.toLowerCase().includes(s));
      return matchCat && matchSearch;
    });
    visibleCount = 6;
    renderTemplates(0);
  }

  // Initial render
  renderTemplates(0);
  applyRestoredScroll();

  // Initialize VanillaTilt for Why Portfolio Cards & Stat Cards
  if (typeof VanillaTilt !== "undefined") {
    const tiltCards = document.querySelectorAll(
      ".why-portfolio-card, .stat-card",
    );
    if (tiltCards.length > 0) {
      VanillaTilt.init(tiltCards, {
        max: 6,
        speed: 400,
        glare: true,
        "max-glare": 0.12,
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
       10. TEMPLATE MODAL
       ═══════════════════════════════════════════════════════════════ */
  const templateModal = document.getElementById("templateModal");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalContent = document.getElementById("modalContent");

  function openTemplateModal(id) {
    const template = templates.find((t) => t.id === id);
    if (!template) return;

    const prices = getTemplatePrices(template, currentCurrency);
    const modalBaseImg = template.image.replace(/\.png$/i, "");

    modalContent.innerHTML = `
            <button class="modal-close" id="modalClose">&times;</button>
            <div class="modal-header-row">
                <p class="modal-template-number">#${template.id}</p>
                <span class="modal-discount-badge">${prices.discount}</span>
            </div>
            <div class="modal-image-wrapper">
                <img
                    src="${modalBaseImg}.webp"
                    srcset="${modalBaseImg}-480.webp 480w, ${modalBaseImg}-800.webp 800w, ${modalBaseImg}.webp 1200w"
                    sizes="(max-width: 768px) 90vw, 680px"
                    alt="${template.name} — ${template.profession}"
                    class="modal-img"
                    width="1200"
                    height="600"
                    loading="lazy"
                    decoding="async">
            </div>
            <div class="modal-title-row">
                <h2 class="modal-title">${template.name}</h2>
                <div class="modal-price-box">
                    <span class="modal-old-price">${prices.oldPrice}</span>
                    <span class="modal-price">${prices.price}</span>
                </div>
            </div>
            <p class="modal-profession">${template.profession} &bull; <span style="color:var(--text-tertiary);">${template.style}</span></p>
            <p class="modal-section-title">Features Included</p>
            <div class="modal-features-list">
                ${template.features.map((f) => `<div class="modal-feature-item"><i class="fas fa-check-circle"></i><span>${f}</span></div>`).join("")}
            </div>
            <div class="modal-actions">
                <a href="${template.link}" class="btn-modal-preview" target="_blank" rel="noopener noreferrer">
                    <span>Live Preview</span>
                    <i class="fas fa-arrow-up-right-from-square"></i>
                </a>
                <a href="https://wa.me/919747506274?text=${encodeURIComponent("Hi Code5in, I want to get the " + template.name + " (" + template.profession + ") template.")}" class="btn-modal-order" target="_blank" rel="noopener noreferrer" id="modalOrderBtn">
                    <span>Get This Template</span>
                    <i class="fab fa-whatsapp"></i>
                </a>
            </div>
        `;

    templateModal.classList.add("active");
    document.body.classList.add("no-scroll");

    // Animate in
    gsap.fromTo(
      modalContent,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "back.out(1.5)",
      },
    );

    // Close handlers
    document.getElementById("modalClose").addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", closeModal);
  }

  function closeModal() {
    gsap.to(modalContent, {
      opacity: 0,
      y: 20,
      scale: 0.95,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        templateModal.classList.remove("active");
        document.body.classList.remove("no-scroll");
      },
    });
  }

  window.openTemplateModal = openTemplateModal;

  /* ═══════════════════════════════════════════════════════════════
       11. CURRENCY SWITCHER CONTROLLER
       ═══════════════════════════════════════════════════════════════ */
  function setCurrency(currency) {
    if (currentCurrency === currency) return;
    currentCurrency = currency;

    // Visual highlight for buttons
    const currencyButtons = document.querySelectorAll(".currency-btn");
    const currencyToggle = document.querySelector(".currency-toggle");
    if (currencyToggle) {
      currencyToggle.setAttribute("data-active-currency", currency);
      currencyToggle.style.setProperty(
        "--currency-slider-offset",
        currency === "USD" ? "100%" : "0%",
      );
    }
    currencyButtons.forEach((btn) => {
      const isMatch = btn.getAttribute("data-currency") === currency;
      btn.classList.toggle("active", isMatch);
      btn.setAttribute("aria-pressed", isMatch ? "true" : "false");
      btn.style.setProperty(
        "--currency-button-color",
        isMatch ? "#ffffff" : "var(--muted)",
      );
    });

    // Instant update on all rendered template cards without reload
    const renderedCards = templatesGrid.querySelectorAll(".template-card");
    renderedCards.forEach((card) => {
      const id = card.getAttribute("data-id");
      const template = templates.find((t) => t.id === id);
      if (template) {
        const prices = getTemplatePrices(template, currentCurrency);
        const oldPriceEl = card.querySelector(".template-old-price");
        const priceEl = card.querySelector(".template-price");
        const discountEl = card.querySelector(".template-discount-badge");
        if (oldPriceEl) oldPriceEl.textContent = prices.oldPrice;
        if (priceEl) priceEl.textContent = prices.price;
        if (discountEl) discountEl.textContent = prices.discount;
      }
    });

    // Update modal prices if open
    if (templateModal && templateModal.classList.contains("active")) {
      const modalNumber = modalContent.querySelector(".modal-template-number");
      if (modalNumber) {
        const id = modalNumber.textContent.replace("#", "").trim();
        const template = templates.find((t) => t.id === id);
        if (template) {
          const prices = getTemplatePrices(template, currentCurrency);
          const modalOldPriceEl =
            modalContent.querySelector(".modal-old-price");
          const modalPriceEl = modalContent.querySelector(".modal-price");
          const modalDiscountEl = modalContent.querySelector(
            ".modal-discount-badge",
          );
          if (modalOldPriceEl) modalOldPriceEl.textContent = prices.oldPrice;
          if (modalPriceEl) modalPriceEl.textContent = prices.price;
          if (modalDiscountEl) modalDiscountEl.textContent = prices.discount;
        }
      }
    }
  }

  // Attach listeners to currency switcher buttons
  const currencyButtons = document.querySelectorAll(".currency-btn");
  const currencyTip = document.getElementById("currencyTip");
  const currencyTipClose = document.getElementById("currencyTipClose");
  const templatesSection = document.getElementById("templates");
  const currencyTipStorageKey = "code5in-currency-tip-seen";
  let currencyTipSeen = false;
  let currencyTipObserver;

  try {
    currencyTipSeen = sessionStorage.getItem(currencyTipStorageKey) === "true";
  } catch (error) {
    currencyTipSeen = false;
  }

  function hideCurrencyTip() {
    if (!currencyTip) return;
    currencyTip.classList.remove("is-visible");
    currencyTip.setAttribute("aria-hidden", "true");
    currencyTipSeen = true;
    try {
      sessionStorage.setItem(currencyTipStorageKey, "true");
    } catch (error) {
      // Keep dismissal functional when session storage is unavailable.
    }
  }

  function showCurrencyTipWhenReached() {
    if (
      !currencyTip ||
      !templatesSection ||
      currencyTipSeen ||
      window.scrollY < 1
    ) {
      return;
    }

    const sectionBounds = templatesSection.getBoundingClientRect();
    const sectionInView =
      sectionBounds.top < window.innerHeight * 0.85 &&
      sectionBounds.bottom > window.innerHeight * 0.15;
    if (!sectionInView) return;

    currencyTip.classList.add("is-visible");
    currencyTip.setAttribute("aria-hidden", "false");
    currencyTipSeen = true;
    try {
      sessionStorage.setItem(currencyTipStorageKey, "true");
    } catch (error) {
      // Keep the one-time display behavior for this page when storage is unavailable.
    }
    currencyTipObserver?.disconnect();
  }

  if (currencyTipClose) {
    currencyTipClose.addEventListener("click", hideCurrencyTip);
  }

  if (
    "IntersectionObserver" in window &&
    currencyTip &&
    templatesSection &&
    !currencyTipSeen
  ) {
    currencyTipObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          showCurrencyTipWhenReached();
        }
      },
      { threshold: 0.01 },
    );
    currencyTipObserver.observe(templatesSection);
  }

  window.addEventListener("scroll", showCurrencyTipWhenReached, {
    passive: true,
  });
  window.addEventListener("resize", showCurrencyTipWhenReached);

  currencyButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      hideCurrencyTip();
      const targetCurrency = btn.getAttribute("data-currency");
      if (targetCurrency) {
        setCurrency(targetCurrency);
      }
    });
  });

  /* ═══════════════════════════════════════════════════════════════
       12. ANIMATED COUNTERS
       - Desktop (> 767px): Original ScrollTrigger (completely unchanged)
       - Mobile (≤ 767px): IntersectionObserver + rAF (starts at 0, replay on revisit)
       ═══════════════════════════════════════════════════════════════ */
  const isMobileScreen = window.matchMedia("(max-width: 767px)").matches;

  if (!isMobileScreen) {
    // ─────────────────────────────────────────────────────────────
    // DESKTOP: Original ScrollTrigger Animation (UNTOUCHED)
    // ─────────────────────────────────────────────────────────────
    const statNumbers = document.querySelectorAll(
      ".hero-stats-bar .stat-number",
    );

    statNumbers.forEach((counter) => {
      const target = parseInt(counter.getAttribute("data-target"), 10);

      ScrollTrigger.create({
        trigger: counter,
        start: "top 90%",
        once: true,
        onEnter: () => {
          let startTime = null;
          const duration = 2000;

          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // easeOutQuart
            const eased = 1 - Math.pow(1 - progress, 4);
            counter.textContent = Math.floor(eased * target);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              counter.textContent = target;
            }
          };
          requestAnimationFrame(step);
        },
      });
    });
  } else {
    // ─────────────────────────────────────────────────────────────
    // MOBILE (≤ 767px): Standalone, Robust IntersectionObserver + rAF
    // ─────────────────────────────────────────────────────────────
    const statsBar = document.querySelector(".hero-stats-bar");
    const statNumbers = statsBar
      ? statsBar.querySelectorAll(".stat-number")
      : [];

    if (statsBar && statNumbers.length > 0) {
      const activeRafMap = new Map();
      let hasAnimated = false;
      let isVisibleOnScreen = false;

      // Reset all numbers strictly to 0
      function resetStats() {
        statNumbers.forEach((counter) => {
          if (activeRafMap.has(counter)) {
            cancelAnimationFrame(activeRafMap.get(counter));
            activeRafMap.delete(counter);
          }
          counter.textContent = "0";
        });
        hasAnimated = false;
      }

      // Start the 2-second count-up animation
      function startCountUp() {
        if (hasAnimated) return;
        hasAnimated = true;

        statNumbers.forEach((counter) => {
          const target = parseInt(counter.getAttribute("data-target"), 10);
          if (isNaN(target)) return;

          if (activeRafMap.has(counter)) {
            cancelAnimationFrame(activeRafMap.get(counter));
            activeRafMap.delete(counter);
          }

          counter.textContent = "0";
          const duration = 2000; // ~2 seconds with smooth easing
          let startTime = null;

          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress >= 1) {
              // Guaranteed exact final value
              counter.textContent = String(target);
              activeRafMap.delete(counter);
              return;
            }

            // Smooth quartic easing: 1 - (1 - progress)^4
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = Math.round(eased * target);
            counter.textContent = String(current);

            const rafId = requestAnimationFrame(step);
            activeRafMap.set(counter, rafId);
          };

          const rafId = requestAnimationFrame(step);
          activeRafMap.set(counter, rafId);
        });
      }

      // Initialize all numbers to 0 immediately on mobile
      resetStats();

      // Check loader state: only animate if preloader is gone
      function isPageReady() {
        const loader = document.getElementById("loadingScreen");
        if (!loader) return true;
        return (
          loader.style.display === "none" ||
          document.body.classList.contains("loaded")
        );
      }

      // Viewport bounds check for mobile
      function isStatsInViewport() {
        const rect = statsBar.getBoundingClientRect();
        const vh =
          window.innerHeight || document.documentElement.clientHeight;
        return rect.top < vh && rect.bottom > 0;
      }

      function handleIntersectChange(intersecting) {
        if (intersecting) {
          isVisibleOnScreen = true;
          if (isPageReady()) {
            if (!hasAnimated) {
              startCountUp();
            }
          }
        } else {
          isVisibleOnScreen = false;
          // When scrolled completely away from stats section: reset to 0
          resetStats();
        }
      }

      // Native IntersectionObserver for 60fps reliable mobile detection
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              handleIntersectChange(entry.isIntersecting);
            });
          },
          {
            threshold: 0.1, // Trigger when 10% of stats bar is visible
          },
        );
        observer.observe(statsBar);
      } else {
        // Fallback for older mobile browsers
        window.addEventListener(
          "scroll",
          () => {
            handleIntersectChange(isStatsInViewport());
          },
          { passive: true },
        );
      }

      // When loader completes: if stats section is in view on mobile, start animation immediately
      window.triggerStatsAnimationIfVisible = () => {
        if (isVisibleOnScreen || isStatsInViewport()) {
          resetStats();
          startCountUp();
        }
      };
    }
  }

  /* ═══════════════════════════════════════════════════════════════
       13. TESTIMONIALS CAROUSEL
       ═══════════════════════════════════════════════════════════════ */
  const testimonials = [
    {
      name: "Priya S.",
      role: "Freelance Designer",
      text: "Code5in delivered an outstanding portfolio. The design quality is exceptional and the animations are buttery smooth.",
      rating: 5,
      initial: "P",
    },
    {
      name: "Arjun M.",
      role: "Business Consultant",
      text: "Professional, responsive, and the animations are world-class. My clients are impressed every time they visit my site.",
      rating: 5,
      initial: "A",
    },
    {
      name: "Dr. Meera K.",
      role: "Healthcare Professional",
      text: "My medical practice website looks incredible. Patients love the clean design and easy appointment booking.",
      rating: 5,
      initial: "M",
    },
    {
      name: "Rahul P.",
      role: "Real Estate Agent",
      text: "The real estate template transformed my business. Lead generation increased by 40% in the first month alone.",
      rating: 5,
      initial: "R",
    },
    {
      name: "Sneha R.",
      role: "Music Artist",
      text: "Best investment for my music career. The portfolio showcases my work beautifully with the integrated music player.",
      rating: 5,
      initial: "S",
    },
  ];

  const testimonialsTrack = document.getElementById("testimonialsTrack");

  function generateTestimonialCard(t) {
    return `
            <div class="testimonial-card">
                <div class="testimonial-quote"><i class="fas fa-quote-left"></i></div>
                <div class="testimonial-rating"><span class="stars">★★★★★</span></div>
                <p class="testimonial-text">"${t.text}"</p>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">${t.initial}</div>
                    <div class="author-info">
                        <h4>${t.name}</h4>
                        <span>${t.role}</span>
                    </div>
                </div>
            </div>
        `;
  }

  // Duplicate for infinite scroll
  const cardsHTML = testimonials.map(generateTestimonialCard).join("");
  testimonialsTrack.innerHTML = cardsHTML + cardsHTML;

  // Auto-scroll
  let trackX = 0;
  let isPaused = false;

  testimonialsTrack.addEventListener("mouseenter", () => (isPaused = true));
  testimonialsTrack.addEventListener("mouseleave", () => (isPaused = false));

  function scrollTestimonials() {
    if (!isPaused) {
      trackX -= 0.7;
      if (Math.abs(trackX) >= testimonialsTrack.scrollWidth / 2) {
        trackX = 0;
      }
      testimonialsTrack.style.transform = `translateX(${trackX}px)`;
    }
    requestAnimationFrame(scrollTestimonials);
  }
  setTimeout(() => requestAnimationFrame(scrollTestimonials), 2500);

  /* ═══════════════════════════════════════════════════════════════
       14. FAQ ACCORDION
       ═══════════════════════════════════════════════════════════════ */
  const faqData = [
    {
      q: "What is Code5in?",
      a: "Code5in is a premium digital portfolio agency that creates profession-specific portfolio websites. We offer 20+ ready-made templates and custom portfolio solutions for professionals across various industries.",
    },
    {
      q: "Can I customize a template?",
      a: "Absolutely! Every template can be fully customized to match your brand, profession, and requirements. We offer custom colors, layouts, animations, and additional pages.",
    },
    {
      q: "How long does delivery take?",
      a: "Standard templates are delivered within 5-7 business days. Custom projects typically take 2-4 weeks depending on complexity and requirements.",
    },
    {
      q: "Do you provide ongoing support?",
      a: "Yes, all our plans include support. Premium and Custom plans include priority and 24/7 support to ensure your portfolio runs smoothly.",
    },
    {
      q: "Are the websites mobile responsive?",
      a: "Yes, every template is fully responsive and optimized for all devices — mobile, tablet, laptop, and desktop.",
    },
    {
      q: "What technologies do you use?",
      a: "We use modern web technologies including HTML5, CSS3, JavaScript, GSAP animations, and follow best practices for performance, SEO, and accessibility.",
    },
  ];

  const faqList = document.getElementById("faqList");
  faqList.innerHTML = faqData
    .map(
      (faq) => `
        <div class="faq-item fade-up">
            <button class="faq-header">
                <span class="faq-question">${faq.q}</span>
                <span class="faq-icon">+</span>
            </button>
            <div class="faq-content">
                <p>${faq.a}</p>
            </div>
        </div>
    `,
    )
    .join("");

  // Accordion logic
  document.querySelectorAll(".faq-header").forEach((header) => {
    header.addEventListener("click", () => {
      const item = header.parentElement;
      const content = header.nextElementSibling;
      const icon = header.querySelector(".faq-icon");

      // Close all others
      document.querySelectorAll(".faq-item").forEach((other) => {
        if (other !== item && other.classList.contains("active")) {
          other.classList.remove("active");
          other.querySelector(".faq-content").style.maxHeight = null;
          other.querySelector(".faq-icon").textContent = "+";
        }
      });

      // Toggle current
      item.classList.toggle("active");
      if (item.classList.contains("active")) {
        content.style.maxHeight = content.scrollHeight + "px";
        icon.textContent = "−";
      } else {
        content.style.maxHeight = null;
        icon.textContent = "+";
      }
    });
  });

  // Re-trigger GSAP for FAQ items
  setTimeout(() => {
    document.querySelectorAll(".faq-item.fade-up").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    });
  }, 200);

  /* ═══════════════════════════════════════════════════════════════
       15. CONTACT FORM (Web3Forms)
       ═══════════════════════════════════════════════════════════════ */
  const contactForm = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  const formSuccess = document.getElementById("formSuccess");

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validate
    const required = contactForm.querySelectorAll("[required]");
    let valid = true;
    required.forEach((input) => {
      if (!input.value.trim()) {
        valid = false;
        input.style.borderColor = "#ef4444";
        setTimeout(() => (input.style.borderColor = ""), 2000);
      }
    });
    if (!valid) return;

    // Loading state
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    const formData = new FormData(contactForm);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        contactForm.style.display = "none";
        formSuccess.classList.add("show");
      } else {
        showFormError("Something went wrong. Please try again.");
      }
    } catch (err) {
      showFormError("Network error. Please check your connection.");
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  });

  function showFormError(msg) {
    const existing = contactForm.querySelector(".form-error");
    if (existing) existing.remove();

    const el = document.createElement("div");
    el.className = "form-error";
    el.style.cssText =
      "margin-top:12px;padding:12px 16px;border-radius:10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#ef4444;font-size:0.9rem;";
    el.textContent = msg;
    contactForm.appendChild(el);
    setTimeout(() => el.remove(), 5000);
  }

  // Reset form (global for inline onclick)
  window.resetForm = function () {
    contactForm.reset();
    contactForm.style.display = "block";
    formSuccess.classList.remove("show");
  };

  /* ═══════════════════════════════════════════════════════════════
       16. BACK TO TOP
       ═══════════════════════════════════════════════════════════════ */
  const backToTop = document.getElementById("backToTop");

  function updateBackToTop() {
    if (window.scrollY > 500) {
      backToTop.classList.add("visible");
    } else {
      backToTop.classList.remove("visible");
    }
  }

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ═══════════════════════════════════════════════════════════════
       17. LAZY LOADING IMAGES
       ═══════════════════════════════════════════════════════════════ */
  if ("IntersectionObserver" in window) {
    const lazyImages = document.querySelectorAll("img[data-src]");
    const imgObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.getAttribute("data-src");
            img.removeAttribute("data-src");
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: "0px 0px 100px 0px" },
    );
    lazyImages.forEach((img) => imgObserver.observe(img));
  }

  /* ═══════════════════════════════════════════════════════════════
       18. FINAL ASSET LOAD SCROLL STABILIZATION
       ═══════════════════════════════════════════════════════════════ */
  window.addEventListener("load", () => {
    applyRestoredScroll();
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
    }
    setTimeout(applyRestoredScroll, 100);
    setTimeout(() => {
      applyRestoredScroll();
      if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh();
      }
    }, 300);
  });

  /* ═══════════════════════════════════════════════════════════════
       INIT COMPLETE
       ═══════════════════════════════════════════════════════════════ */
  console.log("Code5in — Premium Portfolio Marketplace loaded successfully.");
});
