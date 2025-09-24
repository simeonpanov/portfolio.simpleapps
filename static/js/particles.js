const canvas = document.getElementById("background");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// handle resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// --- Particle system ---
const particleCount = 120;
const maxDistance = 120;
let particles = [];

// generate particles
for (let i = 0; i < particleCount; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 2 + 1,
    alpha: Math.random() * 0.5 + 0.5,
  });
}

// detect current theme
function getParticleColor(alpha = 1) {
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
}

// listen for theme changes
document.getElementById("theme-toggle").addEventListener("click", () => {
  setTimeout(() => {
    // rerender after theme toggle (slight delay to let class change)
  }, 50);
});

// --- animation loop ---
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw particles
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;

    // bounce off edges
    if (p.x <= 0 || p.x >= canvas.width) p.vx *= -1;
    if (p.y <= 0 || p.y >= canvas.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = getParticleColor(p.alpha);
    ctx.fill();
  });

  // draw connecting lines
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let dx = particles[i].x - particles[j].x;
      let dy = particles[i].y - particles[j].y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < maxDistance) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = getParticleColor(1 - dist / maxDistance);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

animate();
