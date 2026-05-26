type SlideName =
  | "intro"
  | "mom"
  | "momReal"
  | "momMission"
  | "dad"
  | "dadReal"
  | "dadMission"
  | "endChoice"
  | "finale";

type PathName = "mom" | "dad" | null;

const app = document.querySelector<HTMLElement>("[data-app]");
const slides = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
const progress = document.querySelector<HTMLElement>("[data-progress]");
const nextButton = document.querySelector<HTMLButtonElement>('[data-action="next"]');
const prevButton = document.querySelector<HTMLButtonElement>('[data-action="prev"]');
const cursorLight = document.querySelector<HTMLElement>("[data-cursor-light]");
const sparkLayer = document.querySelector<HTMLElement>("[data-sparks]");
const endMessage = document.querySelector<HTMLElement>("[data-end-message]");
const finalButton = document.querySelector<HTMLButtonElement>("[data-final-button]");

const paths: Record<"mom" | "dad", SlideName[]> = {
  mom: ["mom", "momReal", "momMission", "endChoice"],
  dad: ["dad", "dadReal", "dadMission", "endChoice"],
};

let currentSlide: SlideName = "intro";
let currentPath: PathName = null;
let touchStartX = 0;
let touchStartY = 0;
const visited = new Set<"mom" | "dad">();
const activePieces = new Set<string>();
const colors = ["#11865a", "#ffc83d", "#ff6b57", "#2563eb"];

function slideIndex(name: SlideName) {
  return slides.findIndex((slide) => slide.dataset.slide === name);
}

function currentPathPosition() {
  if (!currentPath) return -1;
  return paths[currentPath].indexOf(currentSlide);
}

function updateEndChoice() {
  const bothReady = visited.has("mom") && visited.has("dad");
  if (finalButton) finalButton.disabled = !bothReady;
  if (!endMessage) return;
  endMessage.textContent = bothReady
    ? "Ya vimos los dos trabajos. Ahora podemos cerrar con lo que tienen en común."
    : "Ahora regresa al inicio y elige el otro trabajo.";
}

function showSlide(name: SlideName) {
  currentSlide = name;
  slides.forEach((slide) => {
    slide.classList.toggle("is-active", slide.dataset.slide === currentSlide);
  });

  const index = slideIndex(currentSlide);
  if (progress && index >= 0) progress.style.width = `${((index + 1) / slides.length) * 100}%`;

  const canGoBack = currentSlide !== "intro";
  if (prevButton) prevButton.disabled = !canGoBack;

  if (nextButton) {
    nextButton.textContent = currentSlide === "finale" ? "Inicio" : "Siguiente";
    nextButton.hidden = currentSlide === "endChoice";
  }

  if (currentSlide === "endChoice") updateEndChoice();
}

function startPath(path: "mom" | "dad") {
  currentPath = path;
  showSlide(paths[path][0]);
}

function restart() {
  currentPath = null;
  showSlide("intro");
}

function goNext() {
  if (currentSlide === "intro") {
    showSlide("mom");
    currentPath = "mom";
    return;
  }
  if (currentSlide === "finale") {
    restart();
    return;
  }
  if (!currentPath) return;

  const path = paths[currentPath];
  const position = currentPathPosition();
  if (position < path.length - 1) {
    const nextSlide = path[position + 1];
    if (nextSlide === "endChoice") visited.add(currentPath);
    showSlide(nextSlide);
  }
}

function goPrev() {
  if (currentSlide === "intro") return;
  if (currentSlide === "finale" || currentSlide === "endChoice" || !currentPath) {
    restart();
    return;
  }

  const path = paths[currentPath];
  const position = currentPathPosition();
  if (position <= 0) {
    restart();
    return;
  }
  showSlide(path[position - 1]);
}

function burst(x = window.innerWidth / 2, y = window.innerHeight / 2) {
  if (!sparkLayer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (let index = 0; index < 22; index += 1) {
    const spark = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 22;
    const distance = 70 + Math.random() * 90;
    spark.className = "spark";
    spark.style.background = colors[index % colors.length];
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    sparkLayer.append(spark);
    spark.animate(
      [
        { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
        {
          opacity: 0,
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
        },
      ],
      { duration: 760, easing: "cubic-bezier(.16,1,.3,1)" },
    ).onfinish = () => spark.remove();
  }
}

function updatePhone() {
  const phone = document.querySelector<HTMLElement>("[data-phone]");
  const card = document.querySelector<HTMLElement>("[data-phone-card]");
  if (!phone || !card) return;

  if (activePieces.size === 0) card.textContent = "Toca las piezas";
  if (activePieces.size > 0 && activePieces.size < 3) card.textContent = `${activePieces.size} de 3 piezas`;
  if (activePieces.size === 3) {
    card.textContent = "La app funciona";
    phone.classList.remove("is-alive");
    window.requestAnimationFrame(() => phone.classList.add("is-alive"));
    burst(window.innerWidth / 2, window.innerHeight * 0.56);
  }
}

document.querySelectorAll<HTMLButtonElement>("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.jump as SlideName | "mom" | "dad";
    if (target === "mom" || target === "dad") startPath(target);
    else showSlide(target);
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((button) => {
  button.addEventListener("click", () => button.classList.toggle("is-on"));
});

document.querySelectorAll<HTMLButtonElement>("[data-mom-tasks] .task").forEach((task) => {
  task.addEventListener("click", () => {
    task.classList.toggle("is-on");
    const done = document.querySelectorAll("[data-mom-tasks] .task.is-on").length;
    const badge = document.querySelector<HTMLElement>("[data-mom-badge]");
    if (badge) badge.textContent = done === 6 ? "Misión completa" : `${done} de 6 tareas listas`;
    if (done === 6) burst(window.innerWidth / 2, window.innerHeight * 0.52);
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-piece]").forEach((piece) => {
  piece.addEventListener("click", () => {
    const name = piece.dataset.piece ?? "";
    piece.classList.toggle("is-on");
    if (activePieces.has(name)) activePieces.delete(name);
    else activePieces.add(name);
    updatePhone();
  });
});

document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
  button.addEventListener("click", async () => {
    const action = button.dataset.action;
    if (action === "next") goNext();
    if (action === "prev") goPrev();
    if (action === "restart") restart();
    if (action === "fullscreen") {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") goNext();
  if (event.key === "ArrowLeft") goPrev();
  if (event.key.toLowerCase() === "m") startPath("mom");
  if (event.key.toLowerCase() === "p") startPath("dad");
});

app?.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  },
  { passive: true },
);

app?.addEventListener(
  "touchend",
  (event) => {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    dx < 0 ? goNext() : goPrev();
  },
  { passive: true },
);

app?.addEventListener("pointermove", (event) => {
  if (!cursorLight) return;
  cursorLight.style.left = `${event.clientX}px`;
  cursorLight.style.top = `${event.clientY}px`;
});

document.querySelectorAll<HTMLElement>("[data-float]").forEach((element) => {
  element.animate(
    [
      { transform: "translateY(0)" },
      { transform: "translateY(-12px)" },
      { transform: "translateY(0)" },
    ],
    { duration: 4200, iterations: Infinity, easing: "ease-in-out" },
  );
});

const initialSlide = new URLSearchParams(window.location.search).get("slide") as SlideName | null;
if (initialSlide && slideIndex(initialSlide) >= 0) {
  if (initialSlide.startsWith("mom")) currentPath = "mom";
  if (initialSlide.startsWith("dad")) currentPath = "dad";
  showSlide(initialSlide);
} else {
  showSlide("intro");
}
