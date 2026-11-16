(() => {
    const STORAGE_KEY = "theme";
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    function systemTheme() {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function currentTheme() {
        const value = root.dataset.theme;
        return value === "dark" || value === "light" ? value : systemTheme();
    }

    function withoutTransitions(fn) {
        const style = document.createElement("style");
        style.appendChild(
            document.createTextNode("*,*::before,*::after{transition:none !important}")
        );
        document.head.appendChild(style);
        fn();
        // Force a reflow so the new theme commits while transitions are off
        void document.body.offsetHeight;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => style.remove());
        });
    }

    function applyTheme(theme, { persist = true, animate = true } = {}) {
        const next = theme === "dark" ? "dark" : "light";
        const commit = () => {
            root.dataset.theme = next;
            root.style.colorScheme = next;
            if (metaTheme) metaTheme.setAttribute("content", next === "dark" ? "#0f0f0f" : "#111111");
            if (persist) localStorage.setItem(STORAGE_KEY, next);
            document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next } }));
            syncToggle();
        };

        if (animate) withoutTransitions(commit);
        else commit();
    }

    function syncToggle() {
        const btn = document.getElementById("theme-toggle");
        if (!btn) return;
        const dark = currentTheme() === "dark";
        btn.setAttribute("aria-checked", dark ? "true" : "false");
        btn.setAttribute("aria-label", dark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren");
        btn.title = dark ? "Hellmodus" : "Dunkelmodus";
    }

    function initFromStorage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        applyTheme(stored === "dark" || stored === "light" ? stored : systemTheme(), {
            persist: false,
            animate: false,
        });
    }

    if (!root.dataset.theme) initFromStorage();
    else {
        root.style.colorScheme = currentTheme();
        if (metaTheme) metaTheme.setAttribute("content", currentTheme() === "dark" ? "#0f0f0f" : "#111111");
    }

    function bindToggle() {
        syncToggle();
        const btn = document.getElementById("theme-toggle");
        if (!btn || btn.dataset.bound) return;
        btn.dataset.bound = "1";
        btn.addEventListener("click", () => {
            applyTheme(currentTheme() === "dark" ? "light" : "dark");
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindToggle);
    } else {
        bindToggle();
    }

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
        if (localStorage.getItem(STORAGE_KEY)) return;
        applyTheme(event.matches ? "dark" : "light", { persist: false });
    });
})();
