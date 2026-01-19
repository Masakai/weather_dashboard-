import { AppState } from './state.js?v=3.3.7';
import { escapeHtml } from './ui-utils.js?v=3.3.7';

export function addFavoriteLocation() {
    const name = prompt('この地点の名前を入力してください:', document.getElementById('location-name').innerText || '未設定');
    if (name) {
        const location = {
            name: name,
            lat: AppState.location.lat,
            lon: AppState.location.lon
        };
        AppState.location.favoriteLocations.push(location);
        if (AppState.location.favoriteLocations.length > 5) AppState.location.favoriteLocations.shift(); // 最大5件
        localStorage.setItem('favoriteLocations', JSON.stringify(AppState.location.favoriteLocations));
        renderFavoriteLocations();
    }
}

export function renderFavoriteLocations(locations = AppState.location.favoriteLocations) {
    const container = document.getElementById('favorite-locations');
    if (locations.length === 0) {
        container.innerHTML = `
            <button onclick="addFavoriteLocation()" class="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-3 text-base border border-slate-700 flex items-center justify-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>
                現在地をお気に入りに追加
            </button>
        `;
    } else {
        container.innerHTML = locations.map((loc, index) => `
            <div class="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between border border-slate-700 mb-2">
                <button onclick="loadFavoriteLocation(${index})" class="flex-1 text-left text-base hover:text-blue-300 font-medium">
                    <i data-lucide="map-pin" class="w-4 h-4 inline mr-2 text-blue-400"></i>
                    ${escapeHtml(loc.name)}
                </button>
                <button onclick="removeFavoriteLocation(${index})" class="text-red-400 hover:text-red-300 p-1">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        `).join('') + `
            <button onclick="addFavoriteLocation()" class="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-3 text-sm border border-slate-700 flex items-center justify-center gap-2 mt-2 font-bold">
                <i data-lucide="plus" class="w-4 h-4"></i>
                追加
            </button>
        `;
    }
    lucide.createIcons();
}
export function loadFavoriteLocation(index) {
    const loc = AppState.location.favoriteLocations[index];
    updateAppLocation(loc.lat, loc.lon);
}
export function removeFavoriteLocation(index) {
    AppState.location.favoriteLocations.splice(index, 1);
    localStorage.setItem('favoriteLocations', JSON.stringify(AppState.location.favoriteLocations));
    renderFavoriteLocations();
}
export function getCurrentLocation(isInitial = false) {
    if (!navigator.geolocation) {
        if(!isInitial) alert("このブラウザは位置情報をサポートしていません。");
        initializeDashboardWithCurrentCoords(); // デフォルトで起動
        return;
    }

    // ロード表示
    document.getElementById('loading').innerHTML = '現在地を取得中...';
    document.getElementById('loading').classList.remove('hidden');

    navigator.geolocation.getCurrentPosition(
        (position) => {
            AppState.location.lat = position.coords.latitude;
            AppState.location.lon = position.coords.longitude;
            updateAppLocation(AppState.location.lat, AppState.location.lon);
        },
        (error) => {
            console.warn("位置情報取得失敗:", error.message);
            if(!isInitial) alert("位置情報を取得できませんでした。");
            // 失敗した場合はデフォルト位置（三島）で開始
            initializeDashboardWithCurrentCoords(); 
        }
    );
}
export async function updateAppLocation(lat, lon) {
    AppState.location.lat = lat;
    AppState.location.lon = lon;

    // ISSパス予測のフラグをリセット（位置変更時に再計算を有効化）
    window.issPassesCalculated = false;

    // 1. UIの座標表示更新
    document.getElementById('coords-display').innerText = `緯度: ${lat.toFixed(4)} | 経度: ${lon.toFixed(4)}`;

    // 2. 住所取得 (逆ジオコーディング)
    fetchAddress(lat, lon);

    // 3. 地図マーカー更新（地図が開いている、または初期化されている場合）
    if (AppState.ui.map) {
        updateMapMarker(lat, lon);
    }

    // 4. 天気データ取得
    await fetchWeather(lat, lon);
}
export async function fetchAddress(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=ja`;
    
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'WeatherDashboardDemo/1.0' } // マナーとしてUser-Agentを設定
        });
        const data = await response.json();
        
        if (data && data.address) {
            const addr = data.address;
            // 見やすい住所を構築（県 + 市町村 + 町名）
            const pref = addr.province || addr.state || '';
            const city = addr.city || addr.ward || addr.town || addr.village || '';
            const sub = addr.suburb || addr.quarter || addr.neighbourhood || '';
            
            const fullName = `${pref} ${city} ${sub}`.trim() || "不明な場所";
            document.getElementById('location-name').innerText = fullName;
        } else {
            document.getElementById('location-name').innerText = "住所不明";
        }
    } catch (error) {
        console.error("住所取得エラー:", error);
        document.getElementById('location-name').innerText = "住所取得失敗";
    }
}
export function initializeDashboardWithCurrentCoords() {
    updateAppLocation(AppState.location.lat, AppState.location.lon);
}
export function toggleMap() {
    const container = document.getElementById('location-settings');
    const isHidden = container.classList.contains('hidden');
    
    if (isHidden) {
        container.classList.remove('hidden');
        // 地図が初めて表示されるときに初期化
        if (!AppState.ui.map) {
            initMap();
        } else {
            // サイズ再計算（hiddenから復帰時に必要）
            setTimeout(() => AppState.ui.map.invalidateSize(), 100);
        }
    } else {
        container.classList.add('hidden');
    }
}
export function initMap() {
    // 地図初期化
    if (AppState.ui.map) return;
    AppState.ui.map = L.map('map').setView([AppState.location.lat, AppState.location.lon], 13);

    // OpenStreetMapタイル
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(AppState.ui.map);

    // マーカー追加
    AppState.ui.marker = L.marker([AppState.location.lat, AppState.location.lon], {draggable: false}).addTo(AppState.ui.map);

    // マップクリックイベント
    AppState.ui.map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        updateAppLocation(lat, lon);
    });
}
export function updateMapMarker(lat, lon) {
    if (AppState.ui.marker) {
        AppState.ui.marker.setLatLng([lat, lon]);
    }
    AppState.ui.map.panTo([lat, lon]);
}
export function getWindDirection(degrees) {
    const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}
