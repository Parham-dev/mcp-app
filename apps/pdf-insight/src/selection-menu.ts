export type SelectionMenuOptions = {
  viewerEl: HTMLElement;
  mainEl: HTMLElement;
  menuEl: HTMLDivElement;
  onExplain: (text: string) => void | Promise<void>;
  onSelectionChange?: (text: string) => void;
};

export function createSelectionMenu(options: SelectionMenuOptions) {
  const { viewerEl, mainEl, menuEl, onExplain, onSelectionChange } = options;
  let selectionText = "";
  let selectionUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

  function getSelectionText(): string {
    const sel = window.getSelection();
    return sel?.toString().replace(/\s+/g, " ").trim() ?? "";
  }

  function selectionWithinViewer(): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    return viewerEl.contains(range.commonAncestorContainer);
  }

  function hideMenu() {
    menuEl.style.display = "none";
  }

  function showMenuAt(x: number, y: number) {
    menuEl.style.left = `${x}px`;
    menuEl.style.top = `${y}px`;
    menuEl.style.display = "inline-flex";
  }

  function positionMenu() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = mainEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2 - containerRect.left;
    const y = rect.top - containerRect.top - 8;
    showMenuAt(x, y);
  }

  function handleSelectionAction() {
    const text = getSelectionText();
    if (!text || text.length < 3) {
      selectionText = "";
      hideMenu();
      return;
    }
    if (!selectionWithinViewer()) {
      selectionText = "";
      hideMenu();
      return;
    }
    selectionText = text;
    positionMenu();
  }

  async function handleExplainSelection() {
    if (!selectionText) return;
    hideMenu();
    await onExplain(selectionText);
  }

  document.addEventListener("selectionchange", () => {
    if (selectionUpdateTimeout) clearTimeout(selectionUpdateTimeout);
    selectionUpdateTimeout = setTimeout(() => {
      const text = getSelectionText();
      selectionText = text;
      if (text.length > 2) {
        onSelectionChange?.(text);
      } else {
        hideMenu();
      }
    }, 300);
  });

  document.addEventListener("mouseup", handleSelectionAction);
  document.addEventListener("touchend", handleSelectionAction, { passive: true });
  document.addEventListener("scroll", hideMenu, true);
  document.addEventListener("mousedown", (event) => {
    const target = event.target as Node;
    if (menuEl.contains(target)) return;
    hideMenu();
  });

  viewerEl.addEventListener("contextmenu", (event) => {
    const text = getSelectionText();
    if (text.length >= 3 && selectionWithinViewer()) {
      event.preventDefault();
      selectionText = text;
      positionMenu();
    }
  });

  menuEl.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== "BUTTON") return;
    if (target.classList.contains("disabled")) return;
    const action = target.getAttribute("data-action");
    if (action === "explain") {
      await handleExplainSelection();
    } else {
      hideMenu();
    }
  });

  return {
    getSelectionText: () => selectionText,
    hideMenu,
  };
}

export type SelectionMenu = ReturnType<typeof createSelectionMenu>;
