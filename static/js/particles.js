const canvas = document.getElementById("background");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

canvas.width = width;
canvas.height = height;

const particleCount = 120;
const maxDistance = 120;
let particles = [];

for (let i = 0; i < particleCount; i++) {
  particles.push({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    radius: Math.random() * 2 + 1,
    alpha: Math.random() * 0.5 + 0.5,
  });
}

function getParticleColor(alpha = 1) {
  return document.documentElement.classList.contains("dark")
    ? `rgba(255,255,255,${alpha})`
    : `rgba(0,0,0,${alpha})`;
}

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}

window.addEventListener("resize", resizeCanvas);

document.getElementById("theme-toggle").addEventListener("click", () => {
  setTimeout(() => {}, 50);
});

function animate() {
  ctx.clearRect(0, 0, width, height);

  particles.forEach((p) => {
    p.x += p.vx / width;
    p.y += p.vy / height;

    if (p.x <= 0 || p.x >= 1) p.vx *= -1;
    if (p.y <= 0 || p.y >= 1) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = getParticleColor(p.alpha);
    ctx.fill();
  });

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let dx = particles[i].x - particles[j].x;
      let dy = particles[i].y - particles[j].y;
      let dist = Math.sqrt(dx * dx + dy * dy) * Math.max(width, height);

      if (dist < maxDistance) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x * width, particles[i].y * height);
        ctx.lineTo(particles[j].x * width, particles[j].y * height);
        ctx.strokeStyle = getParticleColor(1 - dist / maxDistance);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

animate();
