const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#nav-links");
const progressBar = document.querySelector(".scroll-progress");
const backToTopButtons = document.querySelectorAll(".back-to-top, .floating-top");
const year = document.querySelector("#year");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const filterButtons = document.querySelectorAll(".filter-button");
const projectCards = document.querySelectorAll(".project-card");

if (year) {
  year.textContent = String(new Date().getFullYear());
}

if (menuButton && navigation) {
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    navigation.classList.remove("is-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    navigation.classList.toggle("is-open", !isOpen);
  });

  navigation.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuButton.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) closeMenu();
  });
}

const sectionLinks = [...document.querySelectorAll(".nav-links a[href^='#'], .site-header .brand[href='#home']")];
const observedSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter((section) => section instanceof HTMLElement);

if ("IntersectionObserver" in window) {
  const navigationObserver = new IntersectionObserver((entries) => {
    const visibleSection = entries
      .filter((entry) => entry.isIntersecting)
      .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

    if (!visibleSection) return;
    sectionLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${visibleSection.target.id}`) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }, { rootMargin: "-22% 0px -60% 0px", threshold: [0, 0.15, 0.4, 0.7] });

  observedSections.forEach((section) => navigationObserver.observe(section));
}

let scrollFrame = 0;
const updateScrollDecorations = () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    if (progressBar) progressBar.style.width = `${Math.min(progress * 100, 100)}%`;

    document.querySelector(".floating-top")?.classList.toggle("is-visible", window.scrollY > 620);
  });
};

window.addEventListener("scroll", updateScrollDecorations, { passive: true });
window.addEventListener("resize", updateScrollDecorations);
updateScrollDecorations();

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    if (!filter) return;

    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });

    projectCards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
});

if (!reducedMotion.matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  projectCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5;
      const vertical = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty("--card-tilt-x", `${(horizontal * 3).toFixed(2)}deg`);
      card.style.setProperty("--card-tilt-y", `${(-vertical * 3).toFixed(2)}deg`);
    }, { passive: true });
    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--card-tilt-x");
      card.style.removeProperty("--card-tilt-y");
    });
  });
}

backToTopButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  });
});

const revealItems = document.querySelectorAll(".reveal");
let revealObserver;
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  revealItems.forEach((item) => item.classList.add("is-pending"));
  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      entry.target.classList.remove("is-pending");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  revealItems.forEach((item) => {
    const bounds = item.getBoundingClientRect();
    if (bounds.top >= window.innerHeight || bounds.bottom <= 0) return;
    item.classList.add("is-visible");
    item.classList.remove("is-pending");
    revealObserver?.unobserve(item);
  });
});

const heroVisual = document.querySelector("#hero-visual");
if (heroVisual) heroVisual.dataset.renderMode = "css-fallback";
if (heroVisual && !reducedMotion.matches && "WebGLRenderingContext" in window) {
  const startThreeScene = async () => {
    try {
      const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js");
      if (reducedMotion.matches || !heroVisual.isConnected) return;
      renderDataNetwork(THREE, heroVisual);
    } catch {
      heroVisual.dataset.renderMode = "css-fallback";
      heroVisual.setAttribute("aria-label", "Animated CSS illustration of a data network; 3D rendering is unavailable.");
    }
  };

  if ("IntersectionObserver" in window) {
    const sceneObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      startThreeScene();
    }, { rootMargin: "120px" });
    sceneObserver.observe(heroVisual);
  } else {
    startThreeScene();
  }
} else if (heroVisual) {
  heroVisual.dataset.renderMode = "css-fallback";
heroVisual.setAttribute("aria-label", "Animated CSS illustration of a data network; 3D rendering is unavailable.");
}

function renderDataNetwork(THREE, container) {
  const canvas = container.querySelector(".webgl-canvas");
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
      precision: "mediump"
    });
  } catch {
    container.dataset.renderMode = "css-fallback";
    container.setAttribute("aria-label", "Animated CSS illustration of a data network; 3D rendering is unavailable.");
    return;
  }

  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 40);
  camera.position.set(0, 0, 8.2);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
  renderer.setSize(width, height, false);

  const ambient = new THREE.AmbientLight(0x93cfff, 1.15);
  scene.add(ambient);
  const keyLight = new THREE.PointLight(0x58caff, 2.2, 14);
  keyLight.position.set(-3, 3, 4);
  scene.add(keyLight);

  const network = new THREE.Group();
  scene.add(network);

  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.08, 2),
    new THREE.MeshBasicMaterial({ color: 0x278ad0, wireframe: true, transparent: true, opacity: 0.24 })
  );
  network.add(shell);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.75, 2),
    new THREE.MeshStandardMaterial({
      color: 0x0b1c36,
      emissive: 0x123d64,
      emissiveIntensity: 0.9,
      roughness: 0.45,
      metalness: 0.35,
      wireframe: true,
      transparent: true,
      opacity: 0.87
    })
  );
  network.add(core);

  const nodeCount = window.innerWidth < 700 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ? 78 : 122;
  const nodePositions = new Float32Array(nodeCount * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < nodeCount; index += 1) {
    const y = 1 - (index / (nodeCount - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = goldenAngle * index;
    nodePositions[index * 3] = Math.cos(angle) * radius * 2.12;
    nodePositions[index * 3 + 1] = y * 2.12;
    nodePositions[index * 3 + 2] = Math.sin(angle) * radius * 2.12;
  }

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
  const nodeMaterial = new THREE.PointsMaterial({
    color: 0x88edff,
    size: window.innerWidth < 700 ? 0.047 : 0.04,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.92
  });
  network.add(new THREE.Points(pointGeometry, nodeMaterial));

  const linePositions = [];
  for (let first = 0; first < nodeCount; first += 1) {
    const ax = nodePositions[first * 3];
    const ay = nodePositions[first * 3 + 1];
    const az = nodePositions[first * 3 + 2];
    for (let second = first + 1; second < nodeCount; second += 1) {
      const dx = ax - nodePositions[second * 3];
      const dy = ay - nodePositions[second * 3 + 1];
      const dz = az - nodePositions[second * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < 0.47) {
        linePositions.push(ax, ay, az, nodePositions[second * 3], nodePositions[second * 3 + 1], nodePositions[second * 3 + 2]);
      }
    }
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  network.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({
    color: 0x48b9ed,
    transparent: true,
    opacity: 0.29,
    blending: THREE.AdditiveBlending
  })));

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x3ebde8, transparent: true, opacity: 0.17 });
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.53, 0.006, 4, 112), ringMaterial);
  ringA.rotation.set(0.92, 0.28, -0.32);
  network.add(ringA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.68, 0.004, 4, 112), ringMaterial.clone());
  ringB.material.opacity = 0.11;
  ringB.rotation.set(-0.72, 0.3, 0.47);
  network.add(ringB);

  const particleCount = window.innerWidth < 700 ? 115 : 190;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let index = 0; index < particleCount; index += 1) {
    particlePositions[index * 3] = (Math.random() - 0.5) * 8.8;
    particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 8.8;
    particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 5;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
    color: 0x75cfff,
    size: 0.018,
    transparent: true,
    opacity: 0.48,
    sizeAttenuation: true
  }));
  scene.add(particles);

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let isOnScreen = true;
  let lastFrame = 0;
  const frameInterval = 1000 / 30;
  const resizeObserver = new ResizeObserver(() => {
    const nextWidth = Math.max(container.clientWidth, 1);
    const nextHeight = Math.max(container.clientHeight, 1);
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight, false);
  });
  resizeObserver.observe(container);

  container.addEventListener("pointermove", (event) => {
    const bounds = container.getBoundingClientRect();
    target.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.34;
    target.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.24;
  }, { passive: true });
  container.addEventListener("pointerleave", () => {
    target.x = 0;
    target.y = 0;
  });

  const render = (time = 0) => {
    if (!isOnScreen || document.hidden) return;
    if (time - lastFrame >= frameInterval) {
      lastFrame = time;
      const seconds = time * 0.00022;
      network.rotation.y += (target.x + seconds - network.rotation.y) * 0.035;
      network.rotation.x += (-target.y + Math.sin(seconds * 0.8) * 0.045 - network.rotation.x) * 0.035;
      core.rotation.y -= 0.0015;
      ringA.rotation.z += 0.00055;
      ringB.rotation.z -= 0.00035;
      particles.rotation.y -= 0.00012;
      renderer.render(scene, camera);
    }
  };

  renderer.setAnimationLoop(render);
  const visibilityObserver = new IntersectionObserver((entries) => {
    isOnScreen = entries.some((entry) => entry.isIntersecting);
    renderer.setAnimationLoop(isOnScreen && !document.hidden ? render : null);
  }, { threshold: 0.01 });
  visibilityObserver.observe(container);
  document.addEventListener("visibilitychange", () => {
    renderer.setAnimationLoop(isOnScreen && !document.hidden ? render : null);
  });
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    container.classList.remove("webgl-ready");
    container.dataset.renderMode = "css-fallback";
    container.setAttribute("aria-label", "Animated CSS illustration of a data network; 3D rendering is unavailable.");
  });
  container.classList.add("webgl-ready");
  container.dataset.renderMode = "threejs";
  container.setAttribute("aria-label", "Interactive Three.js 3D network of connected data points, with subtle pointer-controlled rotation.");
}

const contactForm = document.querySelector("#contact-form");
if (contactForm instanceof HTMLFormElement) {
  const EMAILJS_SERVICE_ID = "service_lxwwfev";
  const EMAILJS_TEMPLATE_ID = "template_ui2v96o";
  const EMAILJS_PUBLIC_KEY = "HuAcRTyS88ktI8zPx";
  const MIN_FORM_AGE_MS = 2_500;
  let emailJsReady = false;
  const status = document.querySelector("#form-status");
  const submitButton = contactForm.querySelector(".submit-button");
  const submitLabel = contactForm.querySelector(".submit-label");
  const startedAt = contactForm.querySelector("#form-started-at");
  if (startedAt instanceof HTMLInputElement) {
    startedAt.value = String(Date.now());
  }

  if (window.emailjs) {
    try {
      window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      emailJsReady = true;
    } catch (error) {
      console.error("[Contact form] EmailJS initialization failed.", {
        error: error instanceof Error ? error.name : "UnknownError"
      });
    }
  } else {
    console.error("[Contact form] EmailJS Browser SDK did not load.");
  }

  contactForm.querySelectorAll("input:not([type='hidden']), textarea").forEach((field) => {
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!(status instanceof HTMLElement) || !(submitButton instanceof HTMLButtonElement) || !(submitLabel instanceof HTMLElement)) return;
    if (submitButton.disabled) return;

    status.textContent = "";
    status.className = "form-status";

    const invalidField = contactForm.querySelector(":invalid");
    if (invalidField instanceof HTMLInputElement || invalidField instanceof HTMLTextAreaElement) {
      invalidField.setAttribute("aria-invalid", "true");
      invalidField.focus();
      invalidField.reportValidity();
      return;
    }

    const honeypot = contactForm.querySelector("#website");
    if (honeypot instanceof HTMLInputElement && honeypot.value.trim()) {
      console.warn("[Contact form] Submission blocked because the honeypot field was filled.");
      status.textContent = "The spam check was triggered. Reload the page and try again, or email me directly.";
      status.classList.add("is-error");
      return;
    }

    const startedAtValue = startedAt instanceof HTMLInputElement ? Number(startedAt.value) : 0;
    const formAge = Date.now() - startedAtValue;
    if (!Number.isSafeInteger(startedAtValue) || formAge < MIN_FORM_AGE_MS || formAge > 60 * 60 * 1000) {
      console.warn("[Contact form] Submission blocked because the form timestamp was invalid or expired.");
      status.textContent = "Please reload the page and try sending your message again.";
      status.classList.add("is-error");
      return;
    }

    if (!emailJsReady || !window.emailjs) {
      status.textContent = "The email service could not load. Please refresh and try again, or email me directly.";
      status.classList.add("is-error");
      return;
    }

    submitButton.disabled = true;
    submitButton.classList.add("is-loading");
    submitLabel.textContent = "Sending…";
    status.textContent = "Sending your message securely…";

    try {
      await window.emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, contactForm);

      contactForm.reset();
      if (startedAt instanceof HTMLInputElement) startedAt.value = String(Date.now());
      status.textContent = "Your message was sent successfully. Thank you — I'll be in touch.";
      status.classList.add("is-success");
    } catch (error) {
      console.error("[Contact form] EmailJS rejected the message.", {
        status: error && typeof error === "object" && "status" in error ? error.status : undefined,
        error: error instanceof Error ? error.name : "UnknownError"
      });
      status.textContent = "Your message could not be sent. Check the EmailJS service, template, and recipient settings, then try again.";
      status.classList.add("is-error");
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");
      submitLabel.textContent = "Send Message";
    }
  });
}
