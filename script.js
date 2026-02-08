let allCoins = [];

/* =========================
   THEME TOGGLE
========================= */
const themeBtn = document.getElementById("themeToggle");

function updateThemeIcon() {
    themeBtn.textContent = document.body.classList.contains("light")
        ? "🌙"
        : "☀️";
}

themeBtn.onclick = () => {
    document.body.classList.toggle("light");
    updateThemeIcon();
};

updateThemeIcon();

/* =========================
   LOAD TOP COINS
========================= */
async function loadTopCoins() {
    const container = document.getElementById("coinsContainer");
    container.innerHTML = "<p>Loading...</p>";

    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1"
        );
        const data = await res.json();
        allCoins = data; // ✅ FIX FOR SORTING
        renderCoins(allCoins);
    } catch {
        container.innerHTML = "<p>Error loading coins</p>";
    }
}

/* =========================
   RENDER COINS
========================= */
function renderCoins(coins) {
    const container = document.getElementById("coinsContainer");
    container.innerHTML = "";

    coins.forEach(coin => {
        const card = document.createElement("div");
        card.className = "coin-card";

        const changeClass =
            coin.price_change_percentage_24h >= 0 ? "green" : "red";

        card.innerHTML = `
            <img src="${coin.image}">
            <h3>${coin.name}</h3>
            <p>💲 $${coin.current_price.toLocaleString()}</p>
            <p class="${changeClass}">
                24h: ${coin.price_change_percentage_24h.toFixed(2)}%
            </p>
            <p>🏦 $${coin.market_cap.toLocaleString()}</p>
            <button onclick="addToWatchlist(
                '${coin.id}',
                '${coin.name}',
                ${coin.current_price},
                '${coin.image}'
            )">Add to Watchlist</button>
        `;

        container.appendChild(card);
    });
}

/* =========================
   SORTING
========================= */
function sortAndRender() {
    const sortBy = document.getElementById("sortSelect").value;
    const order = document.getElementById("orderSelect").value;

    let coins = [...allCoins];

    if (sortBy !== "default") {
        coins.sort((a, b) => {
            let A, B;
            if (sortBy === "price") {
                A = a.current_price;
                B = b.current_price;
            } else if (sortBy === "market_cap") {
                A = a.market_cap;
                B = b.market_cap;
            } else {
                A = a.price_change_percentage_24h;
                B = b.price_change_percentage_24h;
            }
            return order === "asc" ? A - B : B - A;
        });
    }
    renderCoins(coins);
}

document.getElementById("sortSelect").addEventListener("change", sortAndRender);
document.getElementById("orderSelect").addEventListener("change", sortAndRender);

/* =========================
   SEARCH COIN
========================= */
async function searchCoin() {
    const input = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultDiv = document.getElementById("coinDetails");

    if (!input) {
        resultDiv.innerHTML = "Enter a coin name";
        return;
    }

    resultDiv.innerHTML = "Loading...";

    try {
        const res = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${input}`
        );
        const data = await res.json();

        if (!data.length) {
            resultDiv.innerHTML = "❌ Coin not found";
            return;
        }

        const coin = data[0];
        const changeClass =
            coin.price_change_percentage_24h >= 0 ? "green" : "red";

        resultDiv.innerHTML = `
            <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
            <p>💲 $${coin.current_price}</p>
            <p class="${changeClass}">
                24h: ${coin.price_change_percentage_24h.toFixed(2)}%
            </p>
        `;
    } catch {
        resultDiv.innerHTML = "Error fetching data";
    }
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
    const list = getWatchlist().filter(c => c.id !== id);
    saveWatchlist(list);
    renderWatchlist();
}

function renderWatchlist() {
    const container = document.getElementById("watchlist");
    const list = getWatchlist();
    container.innerHTML = "";

    if (!list.length) {
        container.innerHTML = "<p>No coins in watchlist</p>";
        return;
    }

    list.forEach(coin => {
        const card = document.createElement("div");
        card.className = "coin-card";
        card.innerHTML = `
            <img src="${coin.image}">
            <h3>${coin.name}</h3>
            <p>$ ${coin.price}</p>
            <button onclick="removeFromWatchlist('${coin.id}')">Remove</button>
        `;
        container.appendChild(card);
    });
}

/* INIT */
loadTopCoins();
renderWatchlist();
