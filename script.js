/* =========================
   GLOBAL STATE
========================= */
let allCoins = [];

/* =========================
   THEME DROPDOWN
========================= */
const THEMES = ["dark", "light", "neon", "glass"];
const themeSelect = document.getElementById("themeSelect");

function setTheme(theme) {
  document.body.classList.remove(...THEMES);
  document.body.classList.add(theme);
  localStorage.setItem("theme", theme);
}

// Load saved theme on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);
  themeSelect.value = savedTheme;
});

// Change theme on dropdown change
themeSelect.addEventListener("change", (e) => {
  setTheme(e.target.value);
});
/* =========================
   PRICE ALERT
========================= */
let currentPrice = 0;

/* =========================
   PRICE ALERT
========================= */
function setAlert(button) {
  const card = button.closest(".coin-card");
  const input = card.querySelector(".alertInput");

  const price = input.value;
  if (!price) {
    alert("Enter alert price");
    return;
  }

  localStorage.setItem("priceAlert", price);
  showToast("🔔 Alert set at $" + price);
}

// Call this after fetching crypto price
function setAlert(button) {
  const card = button.closest(".coin-card");
  const input = card.querySelector(".alertInput");

  const price = input.value;

  if (!price) {
    alert("Please enter a price");
    return;
  }

  showToast("🔔 Alert set at $" + price);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}





/* =========================
   LOAD STATS
========================= */
async function loadStats() {
    try {
        const res = await fetch("https://api.coingecko.com/api/v3/global");
        if (!res.ok) throw new Error("Stats API error");

        const data = await res.json();

        document.getElementById("coinCount").innerText =
            data.data.active_cryptocurrencies;

        document.getElementById("btcDominance").innerText =
            data.data.market_cap_percentage.btc.toFixed(1);
    } catch (err) {
        console.error(err);
    }
}

/* =========================
   LOAD TOP COINS
========================= */
async function loadTopCoins() {
    const container = document.getElementById("coinsContainer");
    container.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets" +
            "?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false"
        );

        if (!res.ok) throw new Error("Coins API error");

        const data = await res.json();
        allCoins = data;
        renderCoins(allCoins);
    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error loading coins</p>";
    }
    if (alertPrice && alertCoin) {
    const coin = data.find(c =>
        alertCoin.toLowerCase().includes(c.name.toLowerCase())
    );
    if (coin && coin.current_price >= alertPrice) {
        alert(`🚨 ${coin.name} crossed $${alertPrice}`);
        alertPrice = null;
    }
}

}

/* =========================
   RENDER COINS
========================= */
function renderCoins(coins) {
    const container = document.getElementById("coinsContainer");
    container.innerHTML = "";

    coins.forEach(c => {
        const card = document.createElement("div");
        card.className = "coin-card";

        const color =
            c.price_change_percentage_24h >= 0 ? "green" : "red";

 card.innerHTML = `
    <img src="${c.image}">
    <h3>${c.name}</h3>

    <p class="price-update ${c.price_change_percentage_24h >= 0 ? 'green' : 'red'}">
        $${c.current_price.toLocaleString()}
    </p>

    <p>
        <span class="trend-dot ${c.price_change_percentage_24h >= 0 ? 'trend-up' : 'trend-down'}"></span>
        ${c.price_change_percentage_24h.toFixed(2)}%
    </p>

    <button onclick="addToWatchlist(
        '${c.id}','${c.name}',${c.current_price},'${c.image}'
    )">⭐ Add</button>
`;


        container.appendChild(card);
    });
}

/* =========================
   SORTING
========================= */
function sortAndRender() {
    const sortBy = sortSelect.value;
    const order = orderSelect.value;

    let coins = [...allCoins];

    if (sortBy !== "default") {
        coins.sort((a, b) => {
            let A, B;
            if (sortBy === "price") {
                A = a.current_price; B = b.current_price;
            } else if (sortBy === "market_cap") {
                A = a.market_cap; B = b.market_cap;
            } else {
                A = a.price_change_percentage_24h;
                B = b.price_change_percentage_24h;
            }
            return order === "asc" ? A - B : B - A;
        });
    }
    renderCoins(coins);
}

sortSelect.onchange = sortAndRender;
orderSelect.onchange = sortAndRender;

/* =========================
   SEARCH
========================= */


async function searchCoin() {
    const q = searchInput.value.trim().toLowerCase();
    const box = document.getElementById("coinDetails");

    if (!q) return;

    box.innerHTML = "Loading...";

    try {
        const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${q}`
        );
        if (!res.ok) throw new Error("Search error");

        const data = await res.json();
        if (!data.length) {
            box.innerHTML = "❌ Coin not found";
            return;
        }

        const c = data[0];
        const color = c.price_change_percentage_24h >= 0 ? "green" : "red";

        box.innerHTML = `
            <h3>${c.name} (${c.symbol.toUpperCase()})</h3>
            <p>$${c.current_price}</p>
            <p class="${color}">
                ${c.price_change_percentage_24h.toFixed(2)}%
            </p>
        `;
    } catch {
        box.innerHTML = "Error fetching data";
    }
    loadPriceChart(c.id);

}/* =========================
   PRICE CHART (7-DAY)
========================= */
let priceChart;

async function loadPriceChart(coinId) {
    const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7`
    );
    const data = await res.json();

    const prices = data.prices.map(p => p[1]);
    const labels = data.prices.map(p =>
        new Date(p[0]).toLocaleDateString()
    );

    const ctx = document.getElementById("priceChart");

    if (priceChart) priceChart.destroy();

    priceChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "7-Day Price ($)",
                data: prices,
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}


/* =========================
   WATCHLIST
========================= */
function getWatchlist() {
    return JSON.parse(localStorage.getItem("watchlist") || "[]");
}

function saveWatchlist(list) {
    localStorage.setItem("watchlist", JSON.stringify(list));
}

function addToWatchlist(id, name, price, image) {
    const list = getWatchlist();
    if (!list.find(c => c.id === id)) {
        list.push({ id, name, price, image });
        saveWatchlist(list);
        renderWatchlist();
    }
}

function removeFromWatchlist(id) {
    saveWatchlist(getWatchlist().filter(c => c.id !== id));
    renderWatchlist();
}

function renderWatchlist() {
    const box = document.getElementById("watchlist");
    const list = getWatchlist();
    box.innerHTML = "";

    if (!list.length) {
        box.innerHTML = "<p>No coins in watchlist</p>";
        return;
    }

    list.forEach(c => {
        box.innerHTML += `
            <div class="coin-card">
                <img src="${c.image}">
                <h3>${c.name}</h3>
                <p>$${c.price}</p>
                <button onclick="removeFromWatchlist('${c.id}')">❌ Remove</button>
            </div>
        `;
    });
}
let alertPrice = null;
let alertCoin = null;

function setAlert() {
    alertPrice = Number(document.getElementById("alertInput").value);
    alertCoin = document.querySelector("#coinDetails h3")?.textContent;
    alert("🔔 Alert set at $" + alertPrice);
}
function updateRefreshTime() {
    document.getElementById("refreshStatus").textContent =
        "Last updated: " + new Date().toLocaleTimeString();
}
document.body.classList.add("refreshing");
setTimeout(() => {
    document.body.classList.remove("refreshing");
}, 300);




/* =========================
   INIT
========================= */
loadStats();
loadTopCoins();
updateRefreshTime();
renderWatchlist();

// refresh every 60s (safe for CoinGecko)
setInterval(() => {
    loadStats();
    loadTopCoins();
}, 60000);
