export const els = {
  mainEl: document.querySelector(".main") as HTMLElement,
  loadingEl: document.getElementById("loading") as HTMLElement,
  loadingTextEl: document.getElementById("loading-text") as HTMLElement,
  errorEl: document.getElementById("error") as HTMLElement,
  errorMessageEl: document.getElementById("error-message") as HTMLElement,
  viewerEl: document.getElementById("viewer") as HTMLElement,
  canvasContainerEl: document.querySelector(".canvas-container") as HTMLElement,
  canvasEl: document.getElementById("pdf-canvas") as HTMLCanvasElement,
  textLayerEl: document.getElementById("text-layer") as HTMLElement,
  titleEl: document.getElementById("pdf-title") as HTMLElement,
  pageInputEl: document.getElementById("page-input") as HTMLInputElement,
  totalPagesEl: document.getElementById("total-pages") as HTMLElement,
  prevBtn: document.getElementById("prev-btn") as HTMLButtonElement,
  nextBtn: document.getElementById("next-btn") as HTMLButtonElement,
  zoomOutBtn: document.getElementById("zoom-out-btn") as HTMLButtonElement,
  zoomInBtn: document.getElementById("zoom-in-btn") as HTMLButtonElement,
  zoomLevelEl: document.getElementById("zoom-level") as HTMLElement,
  fullscreenBtn: document.getElementById("fullscreen-btn") as HTMLButtonElement,
  progressContainerEl: document.getElementById("progress-container") as HTMLElement,
  progressBarEl: document.getElementById("progress-bar") as HTMLElement,
  progressTextEl: document.getElementById("progress-text") as HTMLElement,
  selectionMenuEl: document.getElementById("selection-menu") as HTMLDivElement,
};

export function showLoading(text: string) {
  els.loadingTextEl.textContent = text;
  els.loadingEl.style.display = "flex";
  els.errorEl.style.display = "none";
  els.viewerEl.style.display = "none";
}

export function showError(message: string) {
  els.errorMessageEl.textContent = message;
  els.loadingEl.style.display = "none";
  els.errorEl.style.display = "block";
  els.viewerEl.style.display = "none";
}

export function showViewer() {
  els.loadingEl.style.display = "none";
  els.errorEl.style.display = "none";
  els.viewerEl.style.display = "flex";
}

export function updateControls(params: {
  pdfUrl: string;
  currentPage: number;
  totalPages: number;
  scale: number;
  onOpenLink: (url: string) => void;
}) {
  const { pdfUrl, currentPage, totalPages, scale, onOpenLink } = params;
  els.titleEl.textContent = pdfUrl;
  els.titleEl.title = pdfUrl;
  els.titleEl.style.textDecoration = "underline";
  els.titleEl.style.cursor = "pointer";
  els.titleEl.onclick = () => onOpenLink(pdfUrl);

  els.pageInputEl.value = String(currentPage);
  els.pageInputEl.max = String(totalPages);
  els.totalPagesEl.textContent = `of ${totalPages}`;
  els.prevBtn.disabled = currentPage <= 1;
  els.nextBtn.disabled = currentPage >= totalPages;
  els.zoomLevelEl.textContent = `${Math.round(scale * 100)}%`;
}

export function updateProgress(loaded: number, total: number) {
  const percent = Math.round((loaded / total) * 100);
  els.progressBarEl.style.width = `${percent}%`;
  els.progressTextEl.textContent = `${(loaded / 1024).toFixed(0)} KB / ${(total / 1024).toFixed(0)} KB (${percent}%)`;
}

export function updateFullscreenButton(isFullscreen: boolean) {
  els.fullscreenBtn.textContent = "⛶";
  els.fullscreenBtn.title = isFullscreen ? "Exit fullscreen" : "Fullscreen";
}

export function applySafeAreaInsets(insets: {
  top: number;
  right: number;
  bottom: number;
  left: number;
}) {
  els.mainEl.style.paddingTop = `${insets.top}px`;
  els.mainEl.style.paddingRight = `${insets.right}px`;
  els.mainEl.style.paddingBottom = `${insets.bottom}px`;
  els.mainEl.style.paddingLeft = `${insets.left}px`;
}
