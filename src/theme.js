(() => {
  const storageKey = "theme";
  const root = document.documentElement;

  function preferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function apply(theme) {
    root.dataset.theme = theme;
    const button = document.getElementById("theme-toggle");
    if (!button) return;
    const dark = theme === "dark";
    button.setAttribute("aria-pressed", dark ? "true" : "false");
    button.setAttribute("aria-label", dark ? "切换到浅色模式" : "切换到深色模式");
    button.textContent = dark ? "☀" : "☾";
  }

  apply(preferredTheme());

  document.addEventListener("DOMContentLoaded", () => {
    apply(preferredTheme());
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem(storageKey, next);
      apply(next);
    });

    const nav = document.getElementById("nav");
    const menu = document.getElementById("nav-menu");
    function setMenu(open) {
      if (!nav) return;
      nav.classList.toggle("is-open", open);
      menu?.setAttribute("aria-expanded", open ? "true" : "false");
      menu?.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    }
    menu?.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
    nav?.querySelectorAll(".ds-nav-links a").forEach((a) => {
      a.addEventListener("click", () => setMenu(false));
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 734) setMenu(false);
    });
    function onScroll() {
      nav?.classList.toggle("scrolled", window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const lbox = document.getElementById("lightbox");
    const limg = lbox?.querySelector("img");
    if (lbox && limg) {
      function closeLb() {
        lbox.hidden = true;
        limg.removeAttribute("src");
        document.body.style.overflow = "";
      }
      document.querySelectorAll(".zoom").forEach((el) => {
        el.addEventListener("click", (event) => {
          event.preventDefault();
          const img = el.tagName === "IMG" ? el : el.querySelector("img");
          const src = el.getAttribute("data-full") || img?.currentSrc || img?.src;
          if (!src) return;
          limg.src = src;
          limg.alt = img?.alt || "";
          lbox.hidden = false;
          document.body.style.overflow = "hidden";
        });
      });
      lbox.addEventListener("click", closeLb);
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !lbox.hidden) closeLb();
      });
    }
  });

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (!localStorage.getItem(storageKey)) {
      apply(event.matches ? "dark" : "light");
    }
  });
})();
