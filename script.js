const menuButton = document.getElementById("menuButton");
const siteNav = document.getElementById("siteNav");

menuButton.addEventListener("click", () => {
  siteNav.classList.toggle("open");
});

document.querySelectorAll(".site-nav a").forEach((link) => {
  link.addEventListener("click", () => siteNav.classList.remove("open"));
});

function formatCountdown(ms) {
  if (ms < 0) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  return `${hours}h ${minutes}m ${seconds}s`;
}

function nextConquestTime() {
  const now = new Date();

  // Conquest times are UTC: 1300 UTC and 2000 UTC.
  const options = [
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 13, 0, 0)),
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 20, 0, 0)),
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 13, 0, 0))
  ];

  return options.find((time) => time > now);
}

function nextGuildClashTime() {
  const now = new Date();

  // Placeholder cycle anchor. Change this date/time later to match your actual Guild Clash reset.
  const anchor = new Date(2026, 0, 1, 20, 0, 0);
  const cycle = 2 * 24 * 60 * 60 * 1000;

  let next = new Date(anchor.getTime());
  while (next <= now) {
    next = new Date(next.getTime() + cycle);
  }

  return next;
}

function updateCountdowns() {
  const now = new Date();

  const conquest = nextConquestTime();
  const conquestEl = document.getElementById("conquestCountdown");
  conquestEl.textContent = `Next Conquest in ${formatCountdown(conquest - now)}`;

  const clash = nextGuildClashTime();
  const clashEl = document.getElementById("guildClashCountdown");
  clashEl.textContent = `Next cycle in ${formatCountdown(clash - now)}`;
}

updateCountdowns();
setInterval(updateCountdowns, 1000);
