function toggleNightVision() {
    document.body.classList.toggle('night-vision');
    const isNight = document.body.classList.contains('night-vision');
    localStorage.setItem('nightVisionMode', isNight);
}
function toggleAccordion(id) {
    const content = document.getElementById('content-' + id);
    const icon = document.getElementById('icon-' + id);

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }

    // Lucideアイコンを再初期化
    lucide.createIcons();
}
function requestISSNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            issNotificationPermission = permission;
            console.log('通知権限:', permission);
        });
    } else {
        console.log('このブラウザは通知をサポートしていません');
    }
}
function checkISSNotifications() {
    if (!calculatedPasses || calculatedPasses.length === 0) {
        return;
    }

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourFiveMinLater = new Date(now.getTime() + 65 * 60 * 1000);

    // 次の1時間以内のパスを探す
    for (let i = 0; i < calculatedPasses.length; i++) {
        const pass = calculatedPasses[i];
        const passTime = new Date(pass.startTime);

        // パスの開始時刻が55分〜65分後の範囲にあるかチェック（5分の猶予）
        if (passTime >= oneHourLater && passTime <= oneHourFiveMinLater) {
            const passKey = pass.startTime.getTime().toString();

            // まだ通知していないパスの場合
            if (!notifiedPasses.has(passKey)) {
                notifiedPasses.add(passKey);
                showISSNotification(pass);
                break; // 1回に1つのパスのみ通知
            }
        }
    }
}
function showISSNotification(pass) {
    const startTime = moment(pass.startTime).format('HH:mm');
    const maxElevation = pass.maxElevation.toFixed(1);
    const duration = Math.round((pass.endTime - pass.startTime) / 1000 / 60);

    const message = `約1時間後（${startTime}頃）にISS通過があります！\n最大高度: ${maxElevation}° | 継続時間: ${duration}分`;

    // ブラウザ通知を表示（許可されている場合）
    if (issNotificationPermission === 'granted') {
        try {
            const notification = new Notification('🛰️ ISS通過まもなく！', {
                body: message.replace(/\n/g, ' '),
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="yellow" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/></svg>',
                tag: 'iss-pass',
                requireInteraction: true,
                vibrate: [200, 100, 200]
            });

            notification.onclick = function() {
                window.focus();
                notification.close();
                // ISS情報セクションまでスクロール
                document.getElementById('iss-info')?.scrollIntoView({ behavior: 'smooth' });
            };
        } catch (error) {
            console.error('通知エラー:', error);
        }
    }

    // 画面内バナーを表示
    showISSNotificationBanner(message);
}
function showISSNotificationBanner(message) {
    const banner = document.getElementById('iss-notification-banner');
    const text = document.getElementById('iss-notification-text');

    text.textContent = message;
    banner.classList.remove('hidden');

    // Lucideアイコンを再描画
    lucide.createIcons();

    // 10秒後に自動的に閉じる
    setTimeout(() => {
        if (!banner.classList.contains('hidden')) {
            closeISSNotification();
        }
    }, 10000);
}
function closeISSNotification() {
    const banner = document.getElementById('iss-notification-banner');
    banner.classList.add('hidden');
}
function startISSNotificationCheck() {
    // 既存のintervalをクリア
    if (issNotificationInterval) {
        clearInterval(issNotificationInterval);
    }

    // 初回チェック
    checkISSNotifications();

    // 1分ごとにチェック
    issNotificationInterval = setInterval(() => {
        checkISSNotifications();
    }, 60 * 1000); // 60秒

    console.log('ISS通過通知チェックを開始しました');
}
function stopISSNotificationCheck() {
    if (issNotificationInterval) {
        clearInterval(issNotificationInterval);
        issNotificationInterval = null;
        console.log('ISS通過通知チェックを停止しました');
    }
}
function addFavoriteLocation() {
    const name = prompt('この地点の名前を入力してください:', document.getElementById('location-name').innerText || '未設定');
    if (name) {
        const location = {
            name: name,
            lat: currentLat,
            lon: currentLon
        };
        favoriteLocations.push(location);
        if (favoriteLocations.length > 5) favoriteLocations.shift(); // 最大5件
        localStorage.setItem('favoriteLocations', JSON.stringify(favoriteLocations));
        renderFavoriteLocations();
    }
}
// XSS対策: HTMLエスケープ関数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderFavoriteLocations() {
    const container = document.getElementById('favorite-locations');
    if (favoriteLocations.length === 0) {
        container.innerHTML = `
            <button onclick="addFavoriteLocation()" class="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-3 text-sm border border-slate-700 flex items-center justify-center gap-2">
                <i data-lucide="plus" class="w-4 h-4"></i>
                現在地をお気に入りに追加
            </button>
        `;
    } else {
        container.innerHTML = favoriteLocations.map((loc, index) => `
            <div class="bg-slate-800/50 rounded-lg p-2 flex items-center justify-between border border-slate-700">
                <button onclick="loadFavoriteLocation(${index})" class="flex-1 text-left text-sm hover:text-blue-300">
                    <i data-lucide="map-pin" class="w-3 h-3 inline mr-1"></i>
                    ${escapeHtml(loc.name)}
                </button>
                <button onclick="removeFavoriteLocation(${index})" class="text-red-400 hover:text-red-300 text-xs">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            </div>
        `).join('') + `
            <button onclick="addFavoriteLocation()" class="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-lg p-2 text-xs border border-slate-700 flex items-center justify-center gap-2">
                <i data-lucide="plus" class="w-3 h-3"></i>
                追加
            </button>
        `;
    }
    lucide.createIcons();
}
function loadFavoriteLocation(index) {
    const loc = favoriteLocations[index];
    updateAppLocation(loc.lat, loc.lon);
}
function removeFavoriteLocation(index) {
    favoriteLocations.splice(index, 1);
    localStorage.setItem('favoriteLocations', JSON.stringify(favoriteLocations));
    renderFavoriteLocations();
}
function calculateStarryScore(cloudCover, moonAge, humidity, visibility = 24, windSpeed = 5) {
    // 雲量スコア (0-100) - 雲が少ないほど高い
    const cloudScore = Math.max(0, 100 - cloudCover);

    // 月明かりスコア (0-100) - 新月に近いほど高い
    const moonScore = moonAge < 3 || moonAge > 26 ? 100 :
                     moonAge < 10 || moonAge > 18 ? 60 : 20;

    // 湿度スコア (0-100) - 湿度が低いほど高い
    const humidityScore = Math.max(0, 100 - humidity);

    // 視程スコア (0-100)
    const visibilityScore = Math.min(100, (visibility / 50) * 100);

    // 風速スコア (0-100) - 風が弱いほど高い
    const windScore = windSpeed < 2 ? 100 : windSpeed < 5 ? 80 : windSpeed < 10 ? 50 : 20;

    // 加重平均 (雲量と月明かりを重視)
    const totalScore = (cloudScore * 0.4 + moonScore * 0.3 + humidityScore * 0.15 + visibilityScore * 0.1 + windScore * 0.05);

    return Math.round(totalScore);
}
function updateStarryScore(score) {
    const circle = document.getElementById('score-circle');
    const text = document.getElementById('score-text');
    const comment = document.getElementById('score-comment');

    // スコアに応じた円の進行度 (0-100を0-440に変換)
    const dashOffset = 440 - (score / 100) * 440;
    circle.style.strokeDashoffset = dashOffset;

    text.textContent = score;

    // コメント
    if (score >= 80) {
        comment.textContent = '⭐ 絶好の観測日和！星空が最高に美しく見えるでしょう';
    } else if (score >= 60) {
        comment.textContent = '✨ 観測に適した条件です。良い星空が期待できます';
    } else if (score >= 40) {
        comment.textContent = '🌤️ まずまずの条件。明るい星は観測できます';
    } else if (score >= 20) {
        comment.textContent = '☁️ やや条件が悪いです。観測には忍耐が必要かも';
    } else {
        comment.textContent = '❌ 観測には不向きな条件です';
    }
}
function getCurrentLocation(isInitial = false) {
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
            currentLat = position.coords.latitude;
            currentLon = position.coords.longitude;
            updateAppLocation(currentLat, currentLon);
        },
        (error) => {
            console.warn("位置情報取得失敗:", error.message);
            if(!isInitial) alert("位置情報を取得できませんでした。");
            // 失敗した場合はデフォルト位置（三島）で開始
            initializeDashboardWithCurrentCoords(); 
        }
    );
}
async function updateAppLocation(lat, lon) {
    currentLat = lat;
    currentLon = lon;

    // ISSパス予測のフラグをリセット（位置変更時に再計算を有効化）
    window.issPassesCalculated = false;

    // 1. UIの座標表示更新
    document.getElementById('coords-display').innerText = `緯度: ${lat.toFixed(4)} | 経度: ${lon.toFixed(4)}`;

    // 2. 住所取得 (逆ジオコーディング)
    fetchAddress(lat, lon);

    // 3. 地図マーカー更新（地図が開いている、または初期化されている場合）
    if (mapInstance) {
        updateMapMarker(lat, lon);
    }

    // 4. 天気データ取得
    await fetchWeather(lat, lon);
}
async function fetchAddress(lat, lon) {
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
function initializeDashboardWithCurrentCoords() {
    updateAppLocation(currentLat, currentLon);
}
function toggleMap() {
    const container = document.getElementById('location-settings');
    const isHidden = container.classList.contains('hidden');
    
    if (isHidden) {
        container.classList.remove('hidden');
        // 地図が初めて表示されるときに初期化
        if (!mapInstance) {
            initMap();
        } else {
            // サイズ再計算（hiddenから復帰時に必要）
            setTimeout(() => mapInstance.invalidateSize(), 100);
        }
    } else {
        container.classList.add('hidden');
    }
}
function initMap() {
    // 地図初期化
    if (mapInstance) return;
    mapInstance = L.map('map').setView([currentLat, currentLon], 13);

    // OpenStreetMapタイル
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance);

    // マーカー追加
    markerInstance = L.marker([currentLat, currentLon], {draggable: false}).addTo(mapInstance);

    // マップクリックイベント
    mapInstance.on('click', function(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        updateAppLocation(lat, lon);
    });
}
function updateMapMarker(lat, lon) {
    if (markerInstance) {
        markerInstance.setLatLng([lat, lon]);
    }
    mapInstance.panTo([lat, lon]);
}
function getWindDirection(degrees) {
    const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}
function renderRadarChart(data) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    if (radarChartInstance) radarChartInstance.destroy();

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['雲の少なさ', '月の暗さ', '低湿度', '高視程', '風の穏やかさ'],
            datasets: [{
                label: '観測適性',
                data: [data.cloudClearness, data.moonDarkness, data.lowHumidity, data.goodVisibility, data.calmWind],
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(34, 197, 94, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                        color: '#94a3b8'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#cbd5e1',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
function calculateMoonData(date) {
    // 2000年1月6日 18:14 (UTC) は新月 (Lunation Number 953)
    // 簡易計算のため、UTCでの日付差分を利用
    const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)); 
    const diffTime = date.getTime() - knownNewMoon.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const synodicMonth = 29.53058867;
    
    let age = diffDays % synodicMonth;
    if (age < 0) age += synodicMonth;
    
    // 月相の判定
    let phaseName = "";
    let icon = "";
    
    // 絵文字と名前のマッピング (簡易版)
    if (age < 1.0 || age > 28.5) { phaseName = "新月"; icon = "🌑"; }
    else if (age < 6.0) { phaseName = "三日月"; icon = "🌒"; }
    else if (age < 9.0) { phaseName = "上弦の月"; icon = "🌓"; }
    else if (age < 13.5) { phaseName = "十日夜"; icon = "🌔"; }
    else if (age < 16.5) { phaseName = "満月"; icon = "🌕"; }
    else if (age < 21.0) { phaseName = "立待月"; icon = "🌖"; }
    else if (age < 24.0) { phaseName = "下弦の月"; icon = "🌗"; }
    else { phaseName = "有明月"; icon = "🌘"; }

    return {
        age: age.toFixed(1),
        phaseName: phaseName,
        icon: icon
    };
}
function calculateSunMoonTimes(date, lat, lon) {
    try {
        const observer = new Astronomy.Observer(lat, lon, 0);

        // 日の出・日の入り
        const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, date, 1);
        const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, date, 1);

        // 天文薄明 (-18度)
        // direction=+1: 太陽が上昇中に-18°を通過 = 朝の天文薄明開始 = 観測終了
        // direction=-1: 太陽が下降中に-18°を通過 = 夕方の天文薄明終了 = 観測開始
        const astroTwilightDawn = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, +1, date, 1, -18);
        const astroTwilightDusk = Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, -1, date, 1, -18);

        // 月の出・月の入り
        const moonrise = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, 1, date, 1);
        const moonset = Astronomy.SearchRiseSet(Astronomy.Body.Moon, observer, -1, date, 1);

        return {
            sunrise: sunrise ? moment(sunrise.date).format('HH:mm') : '--:--',
            sunset: sunset ? moment(sunset.date).format('HH:mm') : '--:--',
            // 観測開始 = 夕方の天文薄明終了（日没後約1.5時間、完全に暗くなる）
            observationStart: astroTwilightDusk ? moment(astroTwilightDusk.date).format('HH:mm') : '--:--',
            // 観測終了 = 朝の天文薄明開始（日の出前約1.5時間、明るくなり始める）
            observationEnd: astroTwilightDawn ? moment(astroTwilightDawn.date).format('HH:mm') : '--:--',
            moonrise: moonrise ? moment(moonrise.date).format('HH:mm') : '--:--',
            moonset: moonset ? moment(moonset.date).format('HH:mm') : '--:--',
            sunriseDate: sunrise ? sunrise.date : null,
            sunsetDate: sunset ? sunset.date : null,
            // 観測開始時刻（夕方）のDateオブジェクト
            observationStartDate: astroTwilightDusk ? astroTwilightDusk.date : null,
            // 観測終了時刻（朝方）のDateオブジェクト
            observationEndDate: astroTwilightDawn ? astroTwilightDawn.date : null
        };
    } catch (error) {
        console.error('日月時刻計算エラー:', error);
        return {
            sunrise: '--:--',
            sunset: '--:--',
            observationStart: '--:--',
            observationEnd: '--:--',
            moonrise: '--:--',
            moonset: '--:--'
        };
    }
}
function updateSunMoonDisplay(times) {
    document.getElementById('sunrise-time').innerText = times.sunrise;
    document.getElementById('sunset-time').innerText = times.sunset;
    // 観測開始 = 夕方の天文薄明終了（完全に暗くなる時刻）
    document.getElementById('observation-start-time').innerText = times.observationStart;
    // 観測終了 = 朝の天文薄明開始（明るくなり始める時刻）
    document.getElementById('observation-end-time').innerText = times.observationEnd;
    document.getElementById('moonrise-time').innerText = times.moonrise;
    document.getElementById('moonset-time').innerText = times.moonset;
}
function renderTimeline(todayTimes, nextDayTimes, targetDate, hourlyData = null) {
    const container = document.getElementById('timeline-container');
    const labelsContainer = document.getElementById('timeline-labels');
    const periodContainer = document.getElementById('timeline-period');
    container.innerHTML = '';
    labelsContainer.innerHTML = '';

    // タイムラインの範囲: 当日の日没 ～ 翌日の日の出
    if (!todayTimes.sunsetDate || !nextDayTimes.sunriseDate) {
        periodContainer.innerText = '日没・日の出データを取得できませんでした';
        return;
    }

    const timelineStart = moment(todayTimes.sunsetDate);      // 当日の日没
    const timelineEnd = moment(nextDayTimes.sunriseDate);     // 翌日の日の出
    const timelineDuration = timelineEnd - timelineStart;

    // 期間の表示
    periodContainer.innerText = `${timelineStart.format('M/D HH:mm')}（日没）〜 ${timelineEnd.format('M/D HH:mm')}（日の出）`;

    // セグメントを追加
    const segments = [];

    // 当日の観測開始時刻（夕方の天文薄明終了）
    const observationStart = todayTimes.observationStartDate ? moment(todayTimes.observationStartDate) : null;
    // 翌日の観測終了時刻（朝の天文薄明開始）
    const observationEnd = nextDayTimes.observationEndDate ? moment(nextDayTimes.observationEndDate) : null;

    if (observationStart && observationEnd) {
        // 1. 夕方の薄明（日没 → 観測開始）- 青色
        const eveningTwilightWidth = ((observationStart - timelineStart) / timelineDuration) * 100;
        if (eveningTwilightWidth > 0) {
            segments.push({ start: 0, width: eveningTwilightWidth, color: '#3b82f6', label: '夕方の薄明（暗くなる）' });
        }

        // 2. 観測適時（観測開始 → 観測終了）
        if (hourlyData && hourlyData.cloud_cover && hourlyData.time) {
            let currentPos = observationStart.clone();
            while (currentPos.isBefore(observationEnd)) {
                let nextPos = currentPos.clone().add(1, 'hour').startOf('hour');
                if (nextPos.isAfter(observationEnd)) {
                    nextPos = observationEnd.clone();
                }

                // 現在時刻に対応するインデックスを探す（時間のみで判定せず、日時の完全一致を見る）
                const searchTime = currentPos.clone().startOf('hour');
                const timeIndex = hourlyData.time.findIndex(t => moment(t).isSame(searchTime));
                const cloud = (timeIndex !== -1) ? hourlyData.cloud_cover[timeIndex] : 0;

                const segStart = ((currentPos - timelineStart) / timelineDuration) * 100;
                const segWidth = ((nextPos - currentPos) / timelineDuration) * 100;

                if (segWidth > 0) {
                    let color = '#22c55e'; // 緑（快晴 0-20%）
                    let status = '観測適時';
                    if (cloud > 80) {
                        color = '#ef4444'; // 赤（曇天 80-100%）
                        status = '観測不可';
                    } else if (cloud > 50) {
                        color = '#f97316'; // 橙（曇り 50-80%）
                        status = '観測不適';
                    } else if (cloud > 20) {
                        color = '#eab308'; // 黄（薄曇 20-50%）
                        status = '観測注意';
                    }

                    segments.push({
                        start: segStart,
                        width: segWidth,
                        color: color,
                        label: `${status} [雲量:${cloud}%] ${currentPos.format('HH:mm')}〜${nextPos.format('HH:mm')}`
                    });
                }
                currentPos = nextPos;
            }
        } else {
            // データがない場合のフォールバック（従来通り）
            const obsStart = ((observationStart - timelineStart) / timelineDuration) * 100;
            const obsWidth = ((observationEnd - observationStart) / timelineDuration) * 100;
            if (obsWidth > 0) {
                segments.push({ start: obsStart, width: obsWidth, color: '#22c55e', label: '観測適時（星空観測に最適）' });
            }
        }

        // 3. 朝の薄明（観測終了 → 日の出）- 青色
        const morningTwilightStart = ((observationEnd - timelineStart) / timelineDuration) * 100;
        const morningTwilightWidth = 100 - morningTwilightStart;
        if (morningTwilightWidth > 0) {
            segments.push({ start: morningTwilightStart, width: morningTwilightWidth, color: '#3b82f6', label: '朝の薄明（明るくなる）' });
        }
    }

    // セグメントを描画
    segments.forEach(seg => {
        const div = document.createElement('div');
        div.className = 'timeline-segment';
        div.style.left = `${seg.start}%`;
        div.style.width = `${seg.width}%`;
        div.style.background = seg.color;
        div.title = seg.label;
        container.appendChild(div);
    });

    // 時間ラベルを動的に生成
    const labels = [];
    labels.push(timelineStart.format('HH:mm')); // 開始（日没）

    // 中間ラベル（3時間ごと）
    let current = timelineStart.clone().add(1, 'hour').startOf('hour');
    // 最初の3時間区切りに合わせる
    const hourMod = current.hour() % 3;
    if (hourMod !== 0) {
        current.add(3 - hourMod, 'hours');
    }
    while (current.isBefore(timelineEnd.clone().subtract(1, 'hour'))) {
        labels.push(current.format('HH:mm'));
        current.add(3, 'hours');
    }

    labels.push(timelineEnd.format('HH:mm')); // 終了（日の出）

    // ラベルを描画
    labels.forEach(label => {
        const span = document.createElement('span');
        span.textContent = label;
        labelsContainer.appendChild(span);
    });
}
async function updateISSInfo(observerDate, observerLat, observerLon) {
    const container = document.getElementById('iss-info');

    // 既存のインターバルをクリア
    if (issInterval) clearInterval(issInterval);

    // 現在時刻との差を確認（1分以内なら「現在」とみなす）
    const now = new Date();
    const timeDiff = Math.abs(observerDate.getTime() - now.getTime());
    const isCurrentTime = timeDiff < 60000; // 1分以内

    if (isCurrentTime) {
        // 現在時刻の場合のみリアルタイム更新を有効化
        issInterval = setInterval(() => {
            const currentNow = new Date();
            calculateAndDisplayISS(currentNow, observerLat, observerLon);
        }, 3000); // 3秒ごとに更新
    }
    // 日時指定の場合はリアルタイム更新なし（指定時刻で固定）

    // 初回計算（指定された日時で表示）
    await calculateAndDisplayISS(observerDate, observerLat, observerLon);
}
async function calculateAndDisplayISS(date, observerLat, observerLon) {
    const container = document.getElementById('iss-info');
    try {
        const now = new Date().getTime();
        const cachedTLE = localStorage.getItem('issTLE');
        const lastFetch = localStorage.getItem('lastTLEFetch');
        const oneDay = 24 * 60 * 60 * 1000;

        if (cachedTLE && lastFetch && (now - lastFetch < oneDay)) {
            issTLE = JSON.parse(cachedTLE);
        } else {
            issTLE = null; // リフレッシュのためにクリア
        }

        if (!issTLE) {
            // CelesTrakからISSのTLEを取得
            try {
                const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle&NAME=ISS');
                if (response.ok) {
                    const text = await response.text();
                    const lines = text.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes('ISS (ZARYA)')) {
                            issTLE = {
                                line1: lines[i+1].trim(),
                                line2: lines[i+2].trim()
                            };
                            // キャッシュに保存
                            localStorage.setItem('issTLE', JSON.stringify(issTLE));
                            localStorage.setItem('lastTLEFetch', now.toString());
                            break;
                        }
                    }
                }
            } catch (e) {
                console.warn('TLEの取得に失敗しました。予備データを使用します。', e);
            }

            if (!issTLE) {
                // 取得失敗時はキャッシュがあればそれを使う、なければデフォルト
                if (cachedTLE) {
                    issTLE = JSON.parse(cachedTLE);
                } else {
                    issTLE = {
                        line1: "1 25544U 98067A   25014.54922454  .00015647  00000-0  27838-3 0  9990",
                        line2: "2 25544  51.6391 350.3705 0005239  55.5135  47.8824 15.49528481491593"
                    };
                }
            }
        }

        // グローバル変数に保存（星座図で使用）
        window.currentTLE = issTLE;

        const satrec = satellite.twoline2satrec(issTLE.line1, issTLE.line2);
        const positionAndVelocity = satellite.propagate(satrec, date);
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(date);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const longitude = satellite.degreesLong(positionGd.longitude);
        const latitude = satellite.degreesLat(positionGd.latitude);
        const height = positionGd.height;

        const observerGd = {
            longitude: satellite.degreesToRadians(observerLon),
            latitude: satellite.degreesToRadians(observerLat),
            height: 0
        };
        const lookAngles = satellite.ecfToLookAngles(observerGd, satellite.eciToEcf(positionEci, gmst));
        
        const azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
        const elevation = satellite.radiansToDegrees(lookAngles.elevation);
        const range = lookAngles.rangeSat;

        const isVisible = elevation > 0;

        // --- 可視予報のロジック ---
        const predictionPanel = document.getElementById('iss-prediction');
        const predictionContent = document.getElementById('iss-prediction-content');

        // 地上距離の計算（ハーバーサイン公式）
        const R = 6371; // 地球の半径 km
        const dLat = (latitude - observerLat) * Math.PI / 180;
        const dLon = (longitude - observerLon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(observerLat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const groundDistance = R * c;

        // 視認可能範囲の判定（仰角0度以上 = 地平線上）
        const isInVisibleRange = elevation > 0;

        // 日没後2H以内か日の出前2H以内
        const sunTimes = calculateSunMoonTimes(date, observerLat, observerLon);
        let isSunCondition = false;
        if (sunTimes.sunsetDate && sunTimes.sunriseDate) {
            const sunset = moment(sunTimes.sunsetDate);
            const sunrise = moment(sunTimes.sunriseDate);
            const nowMoment = moment(date);

            const diffAfterSunset = nowMoment.diff(sunset, 'hours', true);
            const diffBeforeSunrise = sunrise.diff(nowMoment, 'hours', true);

            if ((diffAfterSunset >= 0 && diffAfterSunset <= 2) || (diffBeforeSunrise >= 0 && diffBeforeSunrise <= 2)) {
                isSunCondition = true;
            }
        }

        // 観測に最適な条件（距離1300km以内 + 仰角20度以上）
        const isOptimalCondition = groundDistance <= 1300 && isSunCondition && elevation >= 20;

        // 表示の優先順位：最適条件 > 視認可能範囲内 > 範囲外
        if (isOptimalCondition) {
            predictionPanel.classList.remove('hidden');
            predictionContent.innerHTML = `
                <div class="font-bold text-yellow-300">✨ 現在、ISSが観測に最適な条件です！</div>
                <div class="mt-1 text-sm">
                    距離: ${groundDistance.toFixed(0)} km (1300km以内)<br>
                    仰角: ${elevation.toFixed(1)}° (20°以上)<br>
                    時間: 日出前/日没後の好条件
                </div>
            `;
        } else if (isInVisibleRange) {
            predictionPanel.classList.remove('hidden');
            predictionContent.innerHTML = `
                <div class="font-bold text-blue-300">👁️ ISSは視認可能範囲内にあります</div>
                <div class="mt-1 text-sm text-slate-300">
                    地上距離: ${groundDistance.toFixed(0)} km<br>
                    仰角: ${elevation.toFixed(1)}° (地平線上)<br>
                    方位: ${azimuth.toFixed(1)}°
                </div>
                ${!isSunCondition ? '<div class="mt-1 text-xs text-slate-400">※日中のため肉眼では見えにくい可能性があります</div>' : ''}
                ${elevation < 20 ? '<div class="mt-1 text-xs text-slate-400">※仰角が低いため観測が困難な場合があります</div>' : ''}
            `;
        } else {
            predictionPanel.classList.add('hidden');
        }

        container.innerHTML = `
            <div class="bg-slate-700/30 rounded-lg p-3 space-y-2">
                <div class="flex justify-between items-center">
                    <span class="text-blue-300 font-bold">現在位置</span>
                    <span class="text-xs px-2 py-0.5 rounded ${isVisible ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}">
                        ${isVisible ? '地平線上' : '地平線下'}
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>緯度: <span class="text-white font-mono">${latitude.toFixed(2)}°</span></div>
                    <div>経度: <span class="text-white font-mono">${longitude.toFixed(2)}°</span></div>
                    <div>高度: <span class="text-white font-mono">${height.toFixed(1)} km</span></div>
                    <div>距離: <span class="text-white font-mono">${range.toFixed(0)} km</span></div>
                </div>
                <div class="pt-2 border-t border-slate-600">
                    <div class="flex justify-between text-xs">
                        <span>方位角: <span class="text-white font-mono">${azimuth.toFixed(1)}°</span></span>
                        <span>仰角: <span class="text-white font-mono">${elevation.toFixed(1)}°</span></span>
                    </div>
                    <div class="text-[10px] text-slate-400 mt-1">
                        地上距離: <span class="text-white font-mono">${groundDistance.toFixed(0)} km</span>
                    </div>
                </div>
                <div class="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>TLE Source: CelesTrak</span>
                    <span>Real-time Update</span>
                </div>
                <button onclick="openISSSkymapModal(new Date())" class="w-full mt-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 py-2 px-3 rounded-lg text-xs font-semibold border border-blue-500/30 transition flex items-center justify-center gap-1">
                    <i data-lucide="compass" class="w-3 h-3"></i>
                    星座図を表示
                </button>
            </div>
        `;

        // アイコンを再描画
        lucide.createIcons();

        if (document.getElementById('map')) {
            if (!mapInstance) {
                initMap();
            }
            if (mapInstance) {
                if (issMarker) {
                    issMarker.setLatLng([latitude, longitude]);
                } else {
                    const issIcon = L.divIcon({
                        html: '<i data-lucide="satellite" class="text-blue-400 w-6 h-6"></i>',
                        className: 'iss-map-icon',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });
                    issMarker = L.marker([latitude, longitude], {icon: issIcon}).addTo(mapInstance);
                    issMarker.bindPopup("ISS (国際宇宙ステーション)");
                    lucide.createIcons();
                }
            }
        }
    } catch (error) {
        console.error('ISS計算エラー:', error);
        container.innerHTML = '<div class="text-red-400">ISS情報の計算に失敗しました</div>';
    }

    // 初回のみパス予測を自動計算
    if (!window.issPassesCalculated) {
        calculateISSPasses();
        window.issPassesCalculated = true;
    }
}
function calculateISSPasses() {
    const container = document.getElementById('iss-passes-list');
    container.innerHTML = '<div class="text-slate-400 text-xs">計算中...</div>';

    try {
        if (!window.currentTLE || !currentLat || !currentLon) {
            container.innerHTML = '<div class="text-red-400 text-xs">TLEデータが取得できていません</div>';
            return;
        }

        const passes = [];
        const now = new Date();
        const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7日後まで
        const interval = 60 * 1000; // 1分刻み

        const satrec = satellite.twoline2satrec(window.currentTLE.line1, window.currentTLE.line2);

        let currentPass = null;
        let maxElevation = -90;
        let maxElevationTime = null;
        let maxDistance = 0;

        for (let time = now.getTime(); time <= endTime.getTime(); time += interval) {
            const date = new Date(time);
            const positionAndVelocity = satellite.propagate(satrec, date);

            if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
                const positionEci = positionAndVelocity.position;
                const gmst = satellite.gstime(date);

                const observerGd = {
                    longitude: satellite.degreesToRadians(currentLon),
                    latitude: satellite.degreesToRadians(currentLat),
                    height: 0
                };

                const positionEcf = satellite.eciToEcf(positionEci, gmst);
                const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

                const elevation = satellite.radiansToDegrees(lookAngles.elevation);
                const azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
                const distance = lookAngles.rangeSat;

                if (elevation > 0) {
                    // パス中
                    if (!currentPass) {
                        // 新しいパス開始
                        currentPass = {
                            startTime: date,
                            startElevation: elevation,
                            startAzimuth: azimuth
                        };
                        maxElevation = elevation;
                        maxElevationTime = date;
                        maxDistance = distance;
                    } else {
                        // パス継続中、最大高度を更新
                        if (elevation > maxElevation) {
                            maxElevation = elevation;
                            maxElevationTime = date;
                            maxDistance = distance;
                        }
                    }
                } else {
                    // 地平線下
                    if (currentPass) {
                        // パス終了
                        currentPass.endTime = new Date(time - interval); // 1分前
                        currentPass.maxElevation = maxElevation;
                        currentPass.maxElevationTime = maxElevationTime;
                        currentPass.maxDistance = maxDistance;

                        // 最大高度が10度以上のパスのみ記録
                        if (maxElevation >= 10) {
                            passes.push(currentPass);
                        }

                        currentPass = null;
                        maxElevation = -90;
                    }
                }
            }
        }

        // ループ終了時に未完了のパスがあれば追加（ISSがまだ地平線上の場合）
        if (currentPass) {
            currentPass.endTime = endTime;
            currentPass.maxElevation = maxElevation;
            currentPass.maxElevationTime = maxElevationTime;
            currentPass.maxDistance = maxDistance;

            if (maxElevation >= 10) {
                passes.push(currentPass);
            }
        }

        // 保存
        calculatedPasses = passes;

        // 表示
        if (passes.length === 0) {
            container.innerHTML = '<div class="text-slate-400 text-xs">今後7日間に観測可能なパスはありません（最大高度10°以上）</div>';
        } else {
            container.innerHTML = passes.map((pass, index) => {
                const duration = (pass.endTime - pass.startTime) / 1000 / 60; // 分単位
                const startStr = moment(pass.startTime).format('M/D HH:mm');
                const maxStr = moment(pass.maxElevationTime).format('HH:mm');

                // 高度による評価
                let quality = '';
                let qualityColor = '';
                if (pass.maxElevation >= 60) {
                    quality = '最適';
                    qualityColor = 'text-yellow-300';
                } else if (pass.maxElevation >= 40) {
                    quality = '良好';
                    qualityColor = 'text-green-300';
                } else if (pass.maxElevation >= 20) {
                    quality = '可';
                    qualityColor = 'text-blue-300';
                } else {
                    quality = '低';
                    qualityColor = 'text-slate-400';
                }

                return `
                    <div class="bg-slate-700/30 rounded-lg p-2 hover:bg-slate-700/50 transition cursor-pointer" onclick="showPassOnSkymap(${index})">
                        <div class="flex items-center justify-between mb-1">
                            <div class="font-semibold text-white text-xs">${startStr}</div>
                            <div class="${qualityColor} text-xs font-bold">${quality}</div>
                        </div>
                        <div class="grid grid-cols-3 gap-1 text-[10px]">
                            <div>
                                <span class="text-slate-400">最大高度:</span>
                                <span class="text-white font-semibold">${pass.maxElevation.toFixed(1)}°</span>
                            </div>
                            <div>
                                <span class="text-slate-400">時刻:</span>
                                <span class="text-white">${maxStr}</span>
                            </div>
                            <div>
                                <span class="text-slate-400">距離:</span>
                                <span class="text-white">${(pass.maxDistance).toFixed(0)}km</span>
                            </div>
                        </div>
                        <div class="text-[10px] text-slate-500 mt-1">
                            継続時間: ${duration.toFixed(0)}分 | クリックで軌道表示
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ISS通過通知チェックを開始
        startISSNotificationCheck();

    } catch (error) {
        console.error('パス計算エラー:', error);
        container.innerHTML = '<div class="text-red-400 text-xs">計算エラー: ' + error.message + '</div>';
    }
}
function showPassOnSkymap(passIndex) {
    if (passIndex < 0 || passIndex >= calculatedPasses.length) return;

    window.selectedPass = calculatedPasses[passIndex];

    // リアルタイム更新を停止（パス予測表示モードに切り替え）
    if (skymapUpdateInterval) {
        clearInterval(skymapUpdateInterval);
        skymapUpdateInterval = null;
    }

    openISSSkymapModal();
}
function calculateVisiblePlanets(observerDate, observerLat, observerLon) {
    try {
        const observer = new Astronomy.Observer(observerLat, observerLon, 0);
        const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
        const planetNames = {
            'Mercury': '水星',
            'Venus': '金星',
            'Mars': '火星',
            'Jupiter': '木星',
            'Saturn': '土星'
        };
        const planetIcons = {
            'Mercury': '⚫',
            'Venus': '🌟',
            'Mars': '🔴',
            'Jupiter': '🟠',
            'Saturn': '🪐'
        };

        let visiblePlanets = [];

        planets.forEach(planet => {
            const equator = Astronomy.Equator(planet, observerDate, observer, true, true);
            const horizon = Astronomy.Horizon(observerDate, observer, equator.ra, equator.dec, 'normal');
            const illumination = Astronomy.Illumination(planet, observerDate);

            // 地平線より上（高度 > 0）で、ある程度明るい天体のみ表示
            if (horizon.altitude > 0) {
                visiblePlanets.push({
                    name: planetNames[planet],
                    icon: planetIcons[planet],
                    altitude: horizon.altitude.toFixed(1),
                    azimuth: horizon.azimuth.toFixed(1),
                    magnitude: illumination.mag.toFixed(1)
                });
            }
        });

        // HTMLに表示
        const container = document.getElementById('visible-planets');
        if (visiblePlanets.length === 0) {
            container.innerHTML = '<div class="text-slate-400">現在、地平線上に惑星はありません</div>';
        } else {
            container.innerHTML = visiblePlanets.map(p => `
                <div class="flex items-center justify-between bg-slate-700/30 rounded-lg p-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${p.icon}</span>
                        <span class="font-semibold">${p.name}</span>
                    </div>
                    <div class="text-xs text-slate-400">
                        高度: ${p.altitude}° | 方位: ${p.azimuth}° | 等級: ${p.magnitude}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('惑星計算エラー:', error);
        document.getElementById('visible-planets').innerHTML = '<div class="text-red-400">計算エラー</div>';
    }
}
function calculateMilkyWayVisibility(observerDate, observerLat, observerLon, moonData, cloudCover) {
    try {
        // 引数の検証
        if (!observerDate || !observerLat || !observerLon || !moonData) {
            throw new Error('必要なパラメータが不足しています');
        }
        if (typeof cloudCover === 'undefined') {
            cloudCover = 0;
        }

        const observer = new Astronomy.Observer(observerLat, observerLon, 0);

        // 銀河中心の座標（いて座A*）
        // 赤経: 17h 45m 40s = 266.4167度、赤緯: -29° 00' 28" = -29.0078度
        const galacticCenterRA = 17 + 45/60 + 40/3600;  // 時間単位
        const galacticCenterDec = -(29 + 0/60 + 28/3600);  // 度単位

        // 銀河中心の地平座標を計算
        const gcHorizon = Astronomy.Horizon(observerDate, observer, galacticCenterRA, galacticCenterDec, 'normal');

        // 月の位置を取得
        const moonEquator = Astronomy.Equator('Moon', observerDate, observer, true, true);
        const moonHorizon = Astronomy.Horizon(observerDate, observer, moonEquator.ra, moonEquator.dec, 'normal');

        // 月と銀河中心の角距離を計算（球面三角法）
        const raRad1 = galacticCenterRA * Math.PI / 12;  // 時間を弧度に変換
        const decRad1 = galacticCenterDec * Math.PI / 180;
        const raRad2 = moonEquator.ra * Math.PI / 12;
        const decRad2 = moonEquator.dec * Math.PI / 180;

        // 浮動小数点誤差で範囲外にならないようにクランプ
        const cosAngle = Math.sin(decRad1) * Math.sin(decRad2) +
            Math.cos(decRad1) * Math.cos(decRad2) * Math.cos(raRad1 - raRad2);
        const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
        const angularDistance = Math.acos(clampedCosAngle) * 180 / Math.PI;

        // 視認性スコアを計算（0-100）
        let visibilityScore = 100;

        // 1. 銀河中心の高度による減点（地平線に近いほど見えにくい）
        if (gcHorizon.altitude < 0) {
            visibilityScore = 0;  // 地平線下は見えない
        } else if (gcHorizon.altitude < 20) {
            visibilityScore -= (20 - gcHorizon.altitude) * 2;  // 低高度は大気減光で見えにくい
        }

        // 2. 月明かりの影響
        const moonIllumination = Astronomy.Illumination('Moon', observerDate);
        const moonPhase = moonIllumination.phase_fraction * 100;

        if (moonHorizon.altitude > 0) {  // 月が地平線上にある場合
            // 月齢による減点
            const moonPenalty = moonPhase * 0.3;  // 満月で最大30点減点

            // 角距離による影響（近いほど影響大）
            let distanceFactor = 1.0;
            if (angularDistance < 30) {
                distanceFactor = 2.0;  // 月が近い場合は影響2倍
            } else if (angularDistance < 60) {
                distanceFactor = 1.5;
            } else if (angularDistance < 90) {
                distanceFactor = 1.2;
            }

            visibilityScore -= moonPenalty * distanceFactor;
        }

        // 3. 雲量による減点
        const cloudPenalty = cloudCover * 0.5;  // 雲量100%で50点減点
        visibilityScore -= cloudPenalty;

        // スコアを0-100の範囲に制限
        visibilityScore = Math.max(0, Math.min(100, visibilityScore));

        // 評価ランク
        let rank, rankColor, rankIcon;
        if (visibilityScore >= 80) {
            rank = '絶好';
            rankColor = 'text-yellow-300';
            rankIcon = '⭐⭐⭐';
        } else if (visibilityScore >= 60) {
            rank = '良好';
            rankColor = 'text-green-300';
            rankIcon = '⭐⭐';
        } else if (visibilityScore >= 40) {
            rank = 'やや不良';
            rankColor = 'text-blue-300';
            rankIcon = '⭐';
        } else if (visibilityScore >= 20) {
            rank = '不良';
            rankColor = 'text-slate-400';
            rankIcon = '☁️';
        } else {
            rank = '視認不可';
            rankColor = 'text-red-400';
            rankIcon = '❌';
        }

        // HTMLを生成
        const container = document.getElementById('milkyway-visibility');

        if (gcHorizon.altitude < 0) {
            container.innerHTML = `
                <div class="bg-slate-700/30 rounded-lg p-3">
                    <div class="text-slate-400 text-center">
                        <div class="text-lg mb-1">🌅</div>
                        <div>銀河中心は地平線下です</div>
                        <div class="text-xs mt-1">高度: ${gcHorizon.altitude.toFixed(1)}°</div>
                    </div>
                </div>
            `;
        } else {
            // 方位を日本語に変換
            let direction = '';
            const az = gcHorizon.azimuth;
            if (az >= 337.5 || az < 22.5) direction = '北';
            else if (az >= 22.5 && az < 67.5) direction = '北東';
            else if (az >= 67.5 && az < 112.5) direction = '東';
            else if (az >= 112.5 && az < 157.5) direction = '南東';
            else if (az >= 157.5 && az < 202.5) direction = '南';
            else if (az >= 202.5 && az < 247.5) direction = '南西';
            else if (az >= 247.5 && az < 292.5) direction = '西';
            else direction = '北西';

            container.innerHTML = `
                <div class="bg-slate-700/30 rounded-lg p-3 space-y-3">
                    <!-- 視認性スコア -->
                    <div class="text-center">
                        <div class="text-2xl font-bold ${rankColor} mb-1">
                            ${rankIcon} ${rank}
                        </div>
                        <div class="text-3xl font-bold text-white">
                            ${visibilityScore.toFixed(0)}点
                        </div>
                        <div class="text-xs text-slate-400 mt-1">天の川視認性スコア</div>
                    </div>

                    <!-- 銀河中心の位置 -->
                    <div class="border-t border-slate-600 pt-2">
                        <div class="text-xs text-slate-300 mb-1">🎯 銀河中心の位置（いて座A*）</div>
                        <div class="grid grid-cols-2 gap-2 text-xs">
                            <div class="bg-slate-800/50 rounded p-2">
                                <div class="text-slate-400">高度</div>
                                <div class="text-white font-semibold">${gcHorizon.altitude.toFixed(1)}°</div>
                            </div>
                            <div class="bg-slate-800/50 rounded p-2">
                                <div class="text-slate-400">方位</div>
                                <div class="text-white font-semibold">${direction} ${gcHorizon.azimuth.toFixed(0)}°</div>
                            </div>
                        </div>
                    </div>

                    <!-- 月の影響 -->
                    <div class="border-t border-slate-600 pt-2">
                        <div class="text-xs text-slate-300 mb-1">🌙 月明かりの影響</div>
                        <div class="text-xs space-y-1">
                            <div class="flex justify-between">
                                <span class="text-slate-400">月齢:</span>
                                <span class="text-white">${moonData.age}日 (${moonPhase.toFixed(0)}%照)</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-400">月の高度:</span>
                                <span class="text-white">${moonHorizon.altitude.toFixed(1)}°</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-400">角距離:</span>
                                <span class="text-white">${angularDistance.toFixed(0)}°</span>
                            </div>
                        </div>
                    </div>

                    <!-- 観測アドバイス -->
                    <div class="border-t border-slate-600 pt-2">
                        <div class="text-xs text-slate-300 mb-1">💡 アドバイス</div>
                        <div class="text-xs text-slate-400 leading-relaxed">
                            ${visibilityScore >= 80 ? '絶好の天の川撮影日和です！ISO3200、F2.8、15-25秒の露出がおすすめ。' :
                              visibilityScore >= 60 ? '天の川の撮影が可能です。月明かりに注意しながら撮影してください。' :
                              visibilityScore >= 40 ? '天の川の主要部分は見えますが、淡い部分は見えにくいかもしれません。' :
                              visibilityScore >= 20 ? '天の川の視認は困難です。月が沈むか、雲が晴れるのを待ちましょう。' :
                              '現在の条件では天の川の観測は難しいです。'}
                        </div>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error('天の川計算エラー:', error);
        console.error('エラースタック:', error.stack);
        console.error('引数:', { observerDate, observerLat, observerLon, moonData, cloudCover });
        document.getElementById('milkyway-visibility').innerHTML = `
            <div class="text-red-400 text-xs p-2">
                <div class="font-semibold mb-1">計算エラー</div>
                <div class="text-xs text-slate-400">${error.message}</div>
                <div class="text-xs text-slate-500 mt-1">ブラウザのコンソールで詳細を確認してください</div>
            </div>
        `;
    }
}
function calculateAtmosphericConditions(humidity, visibility, windSpeed, pressure, pressurePrev) {
    try {
        const container = document.getElementById('atmospheric-conditions');

        // 1. 湿度スコア (0-100, 高いほど良い)
        let humidityScore = 100;
        if (humidity >= 70) humidityScore = 20;
        else if (humidity >= 50) humidityScore = 50;
        else if (humidity >= 30) humidityScore = 80;
        else humidityScore = 100;

        // 2. 視程スコア (0-100, 高いほど良い)
        let visibilityScore = 100;
        if (visibility < 10) visibilityScore = 30;
        else if (visibility < 15) visibilityScore = 60;
        else if (visibility < 24) visibilityScore = 85;
        else visibilityScore = 100;

        // 3. 風速スコア (0-100, 低いほど良い - シーイングに影響)
        let windScore = 100;
        if (windSpeed >= 8) windScore = 30;
        else if (windSpeed >= 5) windScore = 60;
        else if (windSpeed >= 2) windScore = 85;
        else windScore = 100;

        // 4. 気圧安定度スコア (0-100, 変化が少ないほど良い)
        let pressureScore = 100;
        if (pressurePrev !== null && pressurePrev !== undefined) {
            const pressureChange = Math.abs(pressure - pressurePrev);
            if (pressureChange >= 3) pressureScore = 40;
            else if (pressureChange >= 2) pressureScore = 70;
            else if (pressureChange >= 1) pressureScore = 90;
            else pressureScore = 100;
        } else {
            pressureScore = 75; // データがない場合は中程度と仮定
        }

        // 総合スコア（透明度重視）
        const transparencyScore = Math.round(
            humidityScore * 0.30 +
            visibilityScore * 0.30 +
            windScore * 0.25 +
            pressureScore * 0.15
        );

        // シーイングスコア（惑星観測向け - 風速と気圧安定度を重視）
        const seeingScore = Math.round(
            windScore * 0.50 +
            pressureScore * 0.30 +
            humidityScore * 0.15 +
            visibilityScore * 0.05
        );

        // 評価ランク
        let transRank, transColor, transIcon;
        if (transparencyScore >= 85) {
            transRank = '絶好';
            transColor = 'text-yellow-300';
            transIcon = '⭐⭐⭐';
        } else if (transparencyScore >= 70) {
            transRank = '良好';
            transColor = 'text-green-300';
            transIcon = '⭐⭐';
        } else if (transparencyScore >= 50) {
            transRank = '普通';
            transColor = 'text-blue-300';
            transIcon = '⭐';
        } else {
            transRank = '不良';
            transColor = 'text-slate-400';
            transIcon = '☁️';
        }

        let seeingRank, seeingColor;
        if (seeingScore >= 85) {
            seeingRank = '抜群';
            seeingColor = 'text-yellow-300';
        } else if (seeingScore >= 70) {
            seeingRank = '良好';
            seeingColor = 'text-green-300';
        } else if (seeingScore >= 50) {
            seeingRank = '普通';
            seeingColor = 'text-blue-300';
        } else {
            seeingRank = '不良';
            seeingColor = 'text-slate-400';
        }

        // 用途別アドバイス
        let planetAdvice = '';
        if (seeingScore >= 80) {
            planetAdvice = '惑星の細部観測に最適な条件です！高倍率での観測をお楽しみください。';
        } else if (seeingScore >= 60) {
            planetAdvice = '惑星観測が可能です。中倍率での観測がおすすめです。';
        } else if (seeingScore >= 40) {
            planetAdvice = '惑星観測は可能ですが、像が揺らぐ可能性があります。';
        } else {
            planetAdvice = '惑星の細部観測は難しい条件です。低倍率での観測をおすすめします。';
        }

        let dsoAdvice = '';
        if (transparencyScore >= 80) {
            dsoAdvice = '星雲・銀河の観測に絶好の条件です！淡い天体もよく見えるでしょう。';
        } else if (transparencyScore >= 60) {
            dsoAdvice = '星雲・銀河の観測が可能です。明るい天体がよく見えます。';
        } else if (transparencyScore >= 40) {
            dsoAdvice = '星雲・銀河の観測は可能ですが、淡い天体は見えにくいかもしれません。';
        } else {
            dsoAdvice = '星雲・銀河の観測は難しい条件です。明るい天体に絞ることをおすすめします。';
        }

        // HTMLを生成
        container.innerHTML = `
            <div class="bg-slate-700/30 rounded-lg p-3 space-y-3">
                <!-- 総合評価 -->
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-slate-800/50 rounded-lg p-3">
                        <div class="text-xs text-slate-400 mb-1">大気透明度</div>
                        <div class="text-2xl font-bold ${transColor}">${transparencyScore}</div>
                        <div class="text-sm ${transColor} mt-1">${transIcon} ${transRank}</div>
                    </div>
                    <div class="bg-slate-800/50 rounded-lg p-3">
                        <div class="text-xs text-slate-400 mb-1">シーイング</div>
                        <div class="text-2xl font-bold ${seeingColor}">${seeingScore}</div>
                        <div class="text-sm ${seeingColor} mt-1">${seeingRank}</div>
                    </div>
                </div>

                <!-- 詳細データ -->
                <div class="border-t border-slate-600 pt-2">
                    <div class="text-xs text-slate-300 mb-2">📊 気象条件</div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-slate-400">湿度:</span>
                            <span class="text-white">${humidity}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">視程:</span>
                            <span class="text-white">${visibility}km</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">風速:</span>
                            <span class="text-white">${windSpeed.toFixed(1)}m/s</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-slate-400">気圧:</span>
                            <span class="text-white">${pressure.toFixed(0)}hPa</span>
                        </div>
                    </div>
                </div>

                <!-- 用途別アドバイス -->
                <div class="border-t border-slate-600 pt-2">
                    <div class="text-xs text-slate-300 mb-2">💡 用途別アドバイス</div>
                    <div class="space-y-2 text-xs">
                        <div class="bg-slate-800/30 rounded p-2">
                            <div class="text-slate-300 font-semibold mb-1">🪐 惑星観測</div>
                            <div class="text-slate-400 leading-relaxed">${planetAdvice}</div>
                        </div>
                        <div class="bg-slate-800/30 rounded p-2">
                            <div class="text-slate-300 font-semibold mb-1">🌌 星雲・銀河観測</div>
                            <div class="text-slate-400 leading-relaxed">${dsoAdvice}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('大気透明度計算エラー:', error);
        document.getElementById('atmospheric-conditions').innerHTML = '<div class="text-red-400 text-xs">計算エラー</div>';
    }
}
function calculateExposure() {
    try {
        // 入力値を取得
        const cropFactor = parseFloat(document.getElementById('sensor-size').value);
        const focalLength = parseFloat(document.getElementById('focal-length').value);
        const aperture = parseFloat(document.getElementById('aperture').value);
        const iso = parseInt(document.getElementById('iso').value);
        const trackingMount = document.getElementById('tracking-mount').value;
        const targetType = document.getElementById('target-type').value;

        // 実焦点距離（35mm換算）
        const effectiveFocalLength = focalLength * cropFactor;

        let exposureTime, minExposure, maxExposure, recommendedISO, stackCount, totalExposure;
        let advice = [];

        // 赤道儀なしの場合：500ルール
        if (trackingMount === 'none') {
            // 基本の500ルール
            exposureTime = 500 / effectiveFocalLength;

            // より正確な計算（NPF簡易版）を考慮
            // 赤緯によって変わるが、中緯度として計算
            const npfAdjusted = (35 * aperture) / effectiveFocalLength;

            // 2つの計算の平均を取る
            exposureTime = (exposureTime + npfAdjusted) / 2;

            minExposure = Math.max(1, Math.floor(exposureTime * 0.7));
            maxExposure = Math.ceil(exposureTime * 1.3);
            exposureTime = Math.round(exposureTime);

            advice.push('⚠️ 固定撮影では星が点像にならず流れる可能性があります');
            advice.push(`📐 500ルール適用: 最大${exposureTime}秒まで`);

        } else if (trackingMount === 'basic') {
            // ポータブル赤道儀：60-120秒推奨
            exposureTime = 90;
            minExposure = 60;
            maxExposure = 120;
            advice.push('🔄 ポータブル赤道儀使用時: 60-120秒を推奨');
            advice.push('⚙️ 極軸合わせの精度が露出時間に影響します');

        } else {
            // 高精度赤道儀：120-300秒推奨
            exposureTime = 180;
            minExposure = 120;
            maxExposure = 300;
            advice.push('🔭 高精度赤道儀使用時: 120-300秒を推奨');
            advice.push('⭐ オートガイダーがあればさらに長時間露出も可能');
        }

        // 対象天体別の推奨設定
        switch (targetType) {
            case 'landscape':
                recommendedISO = [1600, 3200, 6400];
                stackCount = 5;
                totalExposure = exposureTime * stackCount;
                advice.push('🌄 星景写真: 地上風景も写るため明るめのISO推奨');
                advice.push('💡 前景を照らすライティングも検討してください');
                break;

            case 'milkyway':
                recommendedISO = [3200, 6400];
                stackCount = 10;
                totalExposure = exposureTime * stackCount;
                advice.push('🌌 天の川: ISO3200以上、広角レンズ推奨');
                advice.push('📅 新月前後の暗い夜を選んでください');
                break;

            case 'widefield':
                recommendedISO = [800, 1600, 3200];
                stackCount = 20;
                totalExposure = exposureTime * stackCount;
                advice.push('✨ 星野写真: 赤道儀使用を強く推奨');
                advice.push('📸 20-50枚のスタック合成で滑らかな画像に');
                break;

            case 'dso':
                recommendedISO = [800, 1600];
                stackCount = 30;
                totalExposure = exposureTime * stackCount;
                advice.push('🌫️ 星雲・星団: 総露出時間60分以上を目標に');
                advice.push('🔴 Hαフィルターの使用も検討してください');
                break;

            case 'galaxy':
                recommendedISO = [800, 1600];
                stackCount = 40;
                totalExposure = exposureTime * stackCount;
                advice.push('🌀 銀河: 総露出時間90分以上推奨');
                advice.push('📏 焦点距離300mm以上が望ましい');
                break;

            case 'planet':
                exposureTime = 0.01; // 1/100秒程度
                recommendedISO = [400, 800];
                stackCount = 1000; // 動画撮影
                advice.push('🪐 惑星: 短時間露出で動画撮影');
                advice.push('🎬 1000-3000フレームをスタック合成');
                advice.push('🔬 バローレンズで拡大撮影を推奨');
                break;

            case 'moon':
                exposureTime = 0.002; // 1/500秒程度
                recommendedISO = [100, 200, 400];
                stackCount = 100;
                advice.push('🌙 月面: ISO100-400、短時間露出');
                advice.push('📱 スマホでも十分撮影可能です');
                advice.push('🌓 月齢によって露出を調整してください');
                break;
        }

        // F値による補正アドバイス
        if (aperture > 5.6) {
            advice.push(`⚠️ F${aperture}は暗め。F2.8-4の明るいレンズが理想的`);
        } else if (aperture < 2) {
            advice.push(`✨ F${aperture}は非常に明るいレンズ！コマ収差に注意`);
        }

        // ISO感度によるアドバイス
        if (iso < 800) {
            advice.push('💡 低ISO: ノイズは少ないが露出不足に注意');
        } else if (iso >= 6400) {
            advice.push('⚠️ 高ISO: ノイズが増えるため複数枚のスタック推奨');
        }

        // 結果を表示
        const resultsDiv = document.getElementById('exposure-results');
        resultsDiv.classList.remove('hidden');

        let resultHTML = '<div class="space-y-3">';

        // 推奨露出時間
        resultHTML += `
            <div class="bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-3 rounded-lg border border-pink-500/30">
                <div class="text-xs text-slate-300 mb-1">推奨露出時間</div>
                <div class="text-2xl font-bold text-white">${exposureTime < 1 ? '1/' + Math.round(1/exposureTime) : exposureTime}秒</div>
                <div class="text-xs text-slate-400 mt-1">範囲: ${minExposure < 1 ? '1/' + Math.round(1/minExposure) : minExposure}秒 〜 ${maxExposure < 1 ? '1/' + Math.round(1/maxExposure) : maxExposure}秒</div>
            </div>
        `;

        // 推奨ISO
        if (recommendedISO && recommendedISO.length > 0) {
            const isoList = recommendedISO.join(', ');
            const currentISOMatch = recommendedISO.includes(iso);
            resultHTML += `
                <div class="flex items-start gap-2">
                    <i data-lucide="settings" class="w-4 h-4 text-slate-400 mt-0.5"></i>
                    <div class="flex-1">
                        <div class="text-xs text-slate-300">推奨ISO感度</div>
                        <div class="text-sm ${currentISOMatch ? 'text-green-400' : 'text-yellow-400'}">
                            ${isoList}
                            ${currentISOMatch ? ' ✓' : ' (現在: ' + iso + ')'}
                        </div>
                    </div>
                </div>
            `;
        }

        // スタック枚数と総露出時間
        if (targetType !== 'planet' && targetType !== 'moon') {
            const totalMinutes = Math.round(totalExposure / 60);
            resultHTML += `
                <div class="flex items-start gap-2">
                    <i data-lucide="layers" class="w-4 h-4 text-slate-400 mt-0.5"></i>
                    <div class="flex-1">
                        <div class="text-xs text-slate-300">推奨スタック枚数</div>
                        <div class="text-sm text-white">${stackCount}枚 (総露出時間: 約${totalMinutes}分)</div>
                    </div>
                </div>
            `;
        } else {
            resultHTML += `
                <div class="flex items-start gap-2">
                    <i data-lucide="video" class="w-4 h-4 text-slate-400 mt-0.5"></i>
                    <div class="flex-1">
                        <div class="text-xs text-slate-300">推奨撮影方法</div>
                        <div class="text-sm text-white">動画撮影 (${stackCount}+フレーム)</div>
                    </div>
                </div>
            `;
        }

        // アドバイス
        if (advice.length > 0) {
            resultHTML += '<div class="border-t border-slate-600 pt-2 mt-2">';
            resultHTML += '<div class="text-xs text-slate-300 font-semibold mb-2">撮影アドバイス</div>';
            resultHTML += '<div class="space-y-1">';
            advice.forEach(adv => {
                resultHTML += `<div class="text-xs text-slate-300">${adv}</div>`;
            });
            resultHTML += '</div></div>';
        }

        // 撮影設定サマリー
        resultHTML += `
            <div class="border-t border-slate-600 pt-2 mt-2">
                <div class="text-xs text-slate-300 font-semibold mb-2">設定サマリー</div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="text-slate-400">焦点距離</div>
                    <div class="text-white">${focalLength}mm (35mm換算: ${Math.round(effectiveFocalLength)}mm)</div>
                    <div class="text-slate-400">F値</div>
                    <div class="text-white">F${aperture}</div>
                    <div class="text-slate-400">ISO感度</div>
                    <div class="text-white">ISO ${iso}</div>
                    <div class="text-slate-400">赤道儀</div>
                    <div class="text-white">${trackingMount === 'none' ? 'なし' : trackingMount === 'basic' ? 'ポータブル' : '高精度'}</div>
                </div>
            </div>
        `;

        resultHTML += '</div>';
        resultsDiv.innerHTML = resultHTML;

        // Lucideアイコンを再描画
        lucide.createIcons();

    } catch (error) {
        console.error('露出計算エラー:', error);
        const resultsDiv = document.getElementById('exposure-results');
        resultsDiv.classList.remove('hidden');
        resultsDiv.innerHTML = '<div class="text-red-400 text-xs">計算エラーが発生しました</div>';
    }
}
function updateMeteorShowers(targetDate) {
    const currentYear = targetDate.getFullYear();
    const currentMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
    const currentDay = String(targetDate.getDate()).padStart(2, '0');
    const currentDateStr = `${currentMonth}-${currentDay}`;

    // 前後30日以内の流星群をフィルタ
    const relevantShowers = meteorShowers.filter(shower => {
        const showerDate = new Date(`${currentYear}-${shower.peakStart}`);
        const targetDateTime = targetDate.getTime();
        const diffDays = Math.abs((showerDate - targetDateTime) / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    });

    const container = document.getElementById('meteor-showers');
    if (relevantShowers.length === 0) {
        container.innerHTML = '<div class="text-slate-400">今後30日以内に極大を迎える流星群はありません</div>';
    } else {
        container.innerHTML = relevantShowers.map(shower => {
            const isPeak = currentDateStr === shower.peakStart || currentDateStr === shower.peakEnd;
            const showerDateStr = shower.peakStart.replace('-', '/');
            return `
                <div class="bg-slate-700/30 rounded-lg p-2 ${isPeak ? 'border-l-2 border-yellow-400' : ''}">
                    <div class="flex items-center justify-between">
                        <span class="font-semibold ${isPeak ? 'text-yellow-300' : ''}">${shower.name}</span>
                        <span class="text-xs text-slate-400">${showerDateStr} 極大</span>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">
                        ${shower.rate} | ${shower.note}
                    </div>
                    ${isPeak ? '<div class="text-xs text-yellow-300 mt-1">🌟 本日が極大日です！</div>' : ''}
                </div>
            `;
        }).join('');
    }
}
function getSeason(date = new Date()) {
    const month = date.getMonth() + 1; // 0-11 → 1-12
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
}
function updateRecommendedObjects(moonAge) {
    const age = parseFloat(moonAge);
    const container = document.getElementById('recommended-objects');
    const season = getSeason();
    const seasonData = seasonalObjects[season];

    let recommendations = [];
    let moonPhaseText = '';

    if (age < 3 || age > 26) {
        // 新月期: 暗い天体に最適（季節の天体を表示）
        moonPhaseText = '新月期：暗い天体の観測に最適';
        recommendations = seasonData.newMoon;
    } else if (age >= 3 && age < 10) {
        // 上弦前後: 月面と明るい天体
        moonPhaseText = '上弦前後：月面と明るい天体の観測';
        recommendations = [
            { name: '月面クレーター', type: '月', reason: 'ターミネーターライン沿いで影が長く見やすい' },
            ...seasonData.bright.slice(1)
        ];
    } else if (age >= 10 && age < 18) {
        // 満月期: 月面観測と明るい天体のみ
        moonPhaseText = '満月期：月面観測中心';
        recommendations = seasonData.bright;
    } else {
        // 下弦前後: 朝方の観測
        moonPhaseText = '下弦前後：明け方の観測';
        recommendations = [
            { name: '月面南部クレーター', type: '月', reason: '下弦は南部クレーターが見やすい' },
            { name: '明け方の惑星', type: '惑星', reason: '水星・金星が好条件' },
            ...seasonData.newMoon.slice(2, 3)
        ];
    }

    // 季節名を日本語に変換
    const seasonNames = {
        spring: '春',
        summer: '夏',
        autumn: '秋',
        winter: '冬'
    };

    container.innerHTML = `
        <div class="mb-3 p-2 bg-slate-700/50 rounded-lg">
            <div class="text-xs text-slate-300">
                <span class="font-semibold text-cyan-400">${seasonNames[season]}の観測対象</span>
                <span class="text-slate-400">/ ${moonPhaseText}</span>
            </div>
        </div>
        ${recommendations.map(rec => `
            <div class="bg-slate-700/30 rounded-lg p-2 mb-2">
                <div class="flex items-center justify-between">
                    <span class="font-semibold">${rec.name}</span>
                    <span class="text-xs bg-green-600/30 text-green-300 px-2 py-0.5 rounded">${rec.type}</span>
                </div>
                <div class="text-xs text-slate-400 mt-1">${rec.reason}</div>
            </div>
        `).join('')}
    `;
}
function updateAstronomicalEvents(targetDate) {
    const container = document.getElementById('astronomical-events');
    const events = [];

    try {
        const searchStart = new Date(targetDate.getTime() - 180 * 24 * 60 * 60 * 1000); // 180日前
        const searchEnd = new Date(targetDate.getTime() + 180 * 24 * 60 * 60 * 1000);   // 180日後

        // 月食の検索
        let lunarEclipse = Astronomy.SearchLunarEclipse(searchStart);
        const lunarEclipses = [];
        while (lunarEclipse && lunarEclipse.peak < searchEnd) {
            if (lunarEclipse.peak >= searchStart) {
                lunarEclipses.push(lunarEclipse);
            }
            lunarEclipse = Astronomy.NextLunarEclipse(lunarEclipse.peak);
        }

        // 日食の検索
        let solarEclipse = Astronomy.SearchGlobalSolarEclipse(searchStart);
        const solarEclipses = [];
        while (solarEclipse && solarEclipse.peak < searchEnd) {
            if (solarEclipse.peak >= searchStart) {
                solarEclipses.push(solarEclipse);
            }
            solarEclipse = Astronomy.NextGlobalSolarEclipse(solarEclipse.peak);
        }

        // 月食を追加
        lunarEclipses.forEach(eclipse => {
            const peakDate = moment(eclipse.peak);
            const typeText = eclipse.kind === 'total' ? '皆既月食' :
                           eclipse.kind === 'partial' ? '部分月食' : '半影月食';
            const daysUntil = peakDate.diff(moment(targetDate), 'days');
            const timeText = daysUntil === 0 ? '今日' :
                           daysUntil > 0 ? `${daysUntil}日後` : `${-daysUntil}日前`;

            events.push({
                date: peakDate,
                type: typeText,
                time: peakDate.format('M月D日 HH:mm'),
                daysUntil: daysUntil,
                timeText: timeText,
                icon: '🌕',
                color: 'orange'
            });
        });

        // 日食を追加
        solarEclipses.forEach(eclipse => {
            const peakDate = moment(eclipse.peak);
            const typeText = eclipse.kind === 'total' ? '皆既日食' :
                           eclipse.kind === 'annular' ? '金環日食' :
                           eclipse.kind === 'partial' ? '部分日食' : '日食';
            const daysUntil = peakDate.diff(moment(targetDate), 'days');
            const timeText = daysUntil === 0 ? '今日' :
                           daysUntil > 0 ? `${daysUntil}日後` : `${-daysUntil}日前`;

            events.push({
                date: peakDate,
                type: typeText,
                time: peakDate.format('M月D日 HH:mm'),
                daysUntil: daysUntil,
                timeText: timeText,
                icon: '🌑',
                color: 'yellow'
            });
        });

        // 日付順にソート
        events.sort((a, b) => a.date - b.date);

        // 表示
        if (events.length === 0) {
            container.innerHTML = '<div class="text-slate-400 text-xs">今後180日間に予定されている月食・日食はありません。</div>';
        } else {
            // Tailwind CDNでは動的クラス生成ができないため、固定クラスを使用
            const colorStyles = {
                orange: { bg: 'bg-orange-900/30', text: 'text-orange-300' },
                yellow: { bg: 'bg-yellow-900/30', text: 'text-yellow-300' }
            };

            container.innerHTML = events.map(event => {
                const isPast = event.daysUntil < 0;
                const style = colorStyles[event.color] || colorStyles.yellow;
                const bgColor = isPast ? 'bg-slate-700/30' : style.bg;
                const textColor = isPast ? 'text-slate-400' : style.text;

                return `
                    <div class="${bgColor} rounded-lg p-2">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold ${textColor}">${event.icon} ${event.type}</span>
                            <span class="text-xs ${textColor}">${event.timeText}</span>
                        </div>
                        <div class="text-xs text-slate-400 mt-1">${event.time}</div>
                        ${!isPast && Math.abs(event.daysUntil) <= 30 ? '<div class="text-xs text-yellow-300 mt-1">⭐ 近日開催</div>' : ''}
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('天文イベント計算エラー:', error);
        container.innerHTML = '<div class="text-slate-400 text-xs">天文イベントの計算に失敗しました。</div>';
    }
}
async function fetchWeather(lat, lon) {
    // API URL (追加気象データを含む)
    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,windspeed_10m,winddirection_10m,surface_pressure,dewpoint_2m,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FTokyo&past_days=2&forecast_days=10`;

    try {
        const response = await fetch(API_URL);

        // HTTPエラーチェック
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        weatherData = await response.json();

        // 初回は現在時刻で描画
        // もしユーザーが過去の日付を選択中の場合はそのまま維持しても良いが、
        // 場所を変えたら「現在」に戻る方が自然なため、現在時刻にリセットする
        const now = moment();
        setDatePickerValue(now);
        renderDashboard(now);
    } catch (error) {
        document.getElementById('loading').innerHTML = `<span class="text-red-400">データ取得エラー: ${error.message}</span>`;
        console.error(error);
    }
}
function setDatePickerValue(momentObj) {
    const formatted = momentObj.format('YYYY-MM-DDTHH:mm');
    document.getElementById('target-datetime').value = formatted;
}
function updateDashboardTime() {
    const val = document.getElementById('target-datetime').value;
    if (val && weatherData) {
        renderDashboard(moment(val));

        // ISS星図モーダルが開いている場合は再描画
        const skymapModal = document.getElementById('iss-skymap-modal');
        if (skymapModal && !skymapModal.classList.contains('hidden')) {
            console.log('updateDashboardTime: 星図を再描画');
            drawISSSkymapCanvas();
        }
    }
}
function resetToNow() {
    const now = moment();
    setDatePickerValue(now);
    if (weatherData) {
        renderDashboard(now);
    }
}
function selectDate(dateStr) {
    // 現在の入力値（時間）を取得して、日付だけ差し替える
    const currentVal = document.getElementById('target-datetime').value;
    let targetMoment = moment(dateStr); 
    
    if (currentVal) {
        const currentMoment = moment(currentVal);
        // 時間と分を維持
        targetMoment.hour(currentMoment.hour());
        targetMoment.minute(currentMoment.minute());
    } else {
        // デフォルトは正午などにするか、現在時刻に合わせる
        const now = moment();
        targetMoment.hour(now.hour());
        targetMoment.minute(now.minute());
    }

    setDatePickerValue(targetMoment);
    renderDashboard(targetMoment);

    // ISS星図モーダルが開いている場合は再描画
    const skymapModal = document.getElementById('iss-skymap-modal');
    if (skymapModal && !skymapModal.classList.contains('hidden')) {
        console.log('selectDate: 星図を再描画');
        drawISSSkymapCanvas();
    }

    // スクロールを上部へ（スマホなどで見やすくするため）
    document.getElementById('dashboard-content').scrollIntoView({ behavior: 'smooth' });
}
function getWeatherInfo(code) {
    if (code === 0) return { label: '快晴', icon: 'sun', color: 'text-orange-400' };
    if (code >= 1 && code <= 3) return { label: '曇り・晴れ間', icon: 'cloud-sun', color: 'text-gray-300' };
    if (code >= 45 && code <= 48) return { label: '霧', icon: 'align-justify', color: 'text-gray-400' };
    if (code >= 51 && code <= 55) return { label: '霧雨', icon: 'cloud-drizzle', color: 'text-blue-300' };
    if (code >= 61 && code <= 67) return { label: '雨', icon: 'cloud-rain', color: 'text-blue-400' };
    if (code >= 71 && code <= 77) return { label: '雪', icon: 'snowflake', color: 'text-white' };
    if (code >= 80 && code <= 82) return { label: 'にわか雨', icon: 'cloud-hail', color: 'text-blue-300' };
    if (code >= 95 && code <= 99) return { label: '雷雨', icon: 'cloud-lightning', color: 'text-yellow-400' };
    return { label: '不明', icon: 'help-circle', color: 'text-gray-500' };
}
function renderDashboard(targetMoment) {
    if (!weatherData) return;

    const hourly = weatherData.hourly;
    const daily = weatherData.daily;
    const targetDate = targetMoment.toDate();
    currentDatetime = targetDate; // グローバル変数を更新
    
    let currentIndex = 0;
    let minDiff = Infinity;
    let isOutOfRange = true;

    hourly.time.forEach((t, i) => {
        const diff = Math.abs(new Date(t) - targetDate);
        if (diff < minDiff) {
            minDiff = diff;
            currentIndex = i;
        }
        if (diff < 90 * 60 * 1000) { 
            isOutOfRange = false;
        }
    });

    if (isOutOfRange && minDiff > 24 * 60 * 60 * 1000) {
         document.getElementById('forecast-summary').innerText = "選択された日時の詳細データがありません（範囲外です）";
         return;
    }

    // 現在のステータス更新
    const currentTemp = hourly.temperature_2m[currentIndex];
    const currentCloudTotal = hourly.cloud_cover[currentIndex];
    const currentLow = hourly.cloud_cover_low[currentIndex];
    const currentMid = hourly.cloud_cover_mid[currentIndex];
    const currentHigh = hourly.cloud_cover_high[currentIndex];

    document.getElementById('current-temp').innerText = `${currentTemp}°C`;
    document.getElementById('current-clouds').innerText = `${currentCloudTotal}%`;
    
    document.getElementById('clouds-high').innerText = `${currentHigh}%`;
    document.getElementById('bar-high').style.width = `${currentHigh}%`;
    
    document.getElementById('clouds-mid').innerText = `${currentMid}%`;
    document.getElementById('bar-mid').style.width = `${currentMid}%`;
    
    document.getElementById('clouds-low').innerText = `${currentLow}%`;
    document.getElementById('bar-low').style.width = `${currentLow}%`;

    // 月齢情報の更新 (サマリーエリア)
    const moonData = calculateMoonData(targetDate);
    document.getElementById('current-moon-icon').innerText = moonData.icon;
    document.getElementById('current-moon-age-text').innerText = moonData.age;
    document.getElementById('current-moon-name').innerText = moonData.phaseName;

    // 追加気象データの表示
    const currentWindSpeed = hourly.windspeed_10m ? hourly.windspeed_10m[currentIndex] : 0;
    const currentWindDir = hourly.winddirection_10m ? hourly.winddirection_10m[currentIndex] : 0;
    const currentPressure = hourly.surface_pressure ? hourly.surface_pressure[currentIndex] : 1013;
    const currentDewpoint = hourly.dewpoint_2m ? hourly.dewpoint_2m[currentIndex] : 0;
    const currentVisibility = hourly.visibility ? (hourly.visibility[currentIndex] / 1000).toFixed(1) : 24;
    const currentHumidity = hourly.relative_humidity_2m[currentIndex];

    // 3時間前の気圧を取得（気圧変化の計算用）
    const prevIndex = Math.max(0, currentIndex - 3);
    const prevPressure = hourly.surface_pressure ? hourly.surface_pressure[prevIndex] : null;

    // 天体イベント情報を更新
    updateAstronomicalEvents(targetDate);
    updateISSInfo(targetDate, currentLat, currentLon);
    calculateVisiblePlanets(targetDate, currentLat, currentLon);
    calculateMilkyWayVisibility(targetDate, currentLat, currentLon, moonData, currentCloudTotal);
    calculateAtmosphericConditions(currentHumidity, parseFloat(currentVisibility), currentWindSpeed, currentPressure, prevPressure);
    updateMeteorShowers(targetDate);
    updateRecommendedObjects(moonData.age);

    document.getElementById('wind-speed').innerText = `${currentWindSpeed.toFixed(1)} m/s`;
    const windDirText = getWindDirection(currentWindDir);
    document.getElementById('wind-direction').innerText = windDirText;
    document.getElementById('pressure').innerText = `${currentPressure.toFixed(0)} hPa`;
    document.getElementById('dewpoint').innerText = `${currentDewpoint.toFixed(1)}°C`;
    document.getElementById('visibility').innerText = `${currentVisibility} km`;

    // 結露リスク判定
    const tempDiff = currentTemp - currentDewpoint;
    let condensationRisk = '';
    if (tempDiff < 2) condensationRisk = '⚠️ 結露リスク高';
    else if (tempDiff < 5) condensationRisk = '⚡ 結露注意';
    else condensationRisk = '✅ 結露リスク低';
    document.getElementById('condensation-risk').innerText = condensationRisk;

    // 日月出没・天文薄明の計算と表示
    // 指定日時の0時0分を基準にすることで、その日の日の出入りを正確に取得
    const startOfDay = moment(targetDate).startOf('day').toDate();
    const sunMoonTimes = calculateSunMoonTimes(startOfDay, currentLat, currentLon);
    updateSunMoonDisplay(sunMoonTimes);

    // 翌日の日の出時刻を取得（タイムラインと夜間雲量計算で使用）
    const nextDay = moment(targetDate).add(1, 'day').startOf('day').toDate();
    const nextDaySunMoonTimes = calculateSunMoonTimes(nextDay, currentLat, currentLon);

    // タイムライン描画（当日日没〜翌日日の出）
    renderTimeline(sunMoonTimes, nextDaySunMoonTimes, targetDate, hourly);

    // 夜間平均雲量の計算（星空視認性スコアに使用）
    // 当日の夜 = 当日の日没から翌日の日の出まで
    const nightStart = sunMoonTimes.sunsetDate ? moment(sunMoonTimes.sunsetDate) :
                      targetMoment.clone().startOf('day').add(18, 'hours');
    const nightEnd = nextDaySunMoonTimes.sunriseDate ? moment(nextDaySunMoonTimes.sunriseDate) :
                    nightStart.clone().add(12, 'hours');

    let nightCloudSum = 0;
    let nightCloudCount = 0;

    hourly.time.forEach((t, i) => {
        const time = moment(t);
        if (time.isSameOrAfter(nightStart) && time.isBefore(nightEnd)) {
            nightCloudSum += hourly.cloud_cover[i];
            nightCloudCount++;
        }
    });

    const avgNightCloud = nightCloudCount > 0 ? nightCloudSum / nightCloudCount : currentCloudTotal;

    // デバッグログ
    console.log('=== 星空視認性スコア計算デバッグ ===');
    console.log('観測期間:', nightStart.format('HH:mm'), '～', nightEnd.format('HH:mm'));
    console.log('データ数:', nightCloudCount);
    console.log('平均雲量:', avgNightCloud.toFixed(1), '%');
    console.log('雲量スコア:', Math.max(0, 100 - avgNightCloud).toFixed(1));
    console.log('月齢:', moonData.age);
    console.log('湿度:', currentHumidity, '%');
    console.log('視程:', currentVisibility, 'km');
    console.log('風速:', currentWindSpeed, 'm/s');

    // 星空視認性スコアの計算（夜間平均雲量を使用）
    const starryScore = calculateStarryScore(avgNightCloud, moonData.age, currentHumidity, parseFloat(currentVisibility), currentWindSpeed);
    updateStarryScore(starryScore);

    console.log('最終スコア:', starryScore);
    console.log('=====================================');

    // レーダーチャートのデータ準備（夜間平均雲量を使用）
    const radarData = {
        cloudClearness: Math.max(0, 100 - avgNightCloud),
        moonDarkness: moonData.age < 3 || moonData.age > 26 ? 100 : moonData.age < 10 || moonData.age > 18 ? 60 : 20,
        lowHumidity: Math.max(0, 100 - currentHumidity),
        goodVisibility: Math.min(100, (parseFloat(currentVisibility) / 50) * 100),
        calmWind: currentWindSpeed < 2 ? 100 : currentWindSpeed < 5 ? 80 : currentWindSpeed < 10 ? 50 : 20
    };
    renderRadarChart(radarData);


    // サマリーテキスト
    const displayTimeStr = targetMoment.format('M月D日 H:mm');
    document.getElementById('summary-timestamp').innerText = `表示データ時刻: ${displayTimeStr}`;

    let summary = `気温 ${currentTemp}°C。`;
    if(currentCloudTotal < 20) summary += " 快晴または晴れ。";
    else if(currentCloudTotal < 60) summary += " 雲間あり。";
    else summary += " 曇り空。";
    
    if (currentIndex + 6 < hourly.temperature_2m.length) {
        const futureTemp = hourly.temperature_2m[currentIndex + 6];
        const tempDiff = futureTemp - currentTemp;
        if(tempDiff > 2) summary += " その後、気温は上昇傾向です。";
        else if(tempDiff < -2) summary += " その後、冷え込む見込みです。";
    }

    // --- 天体観測サマリー追加 ---
    // 日没から翌日の日の出までのデータを取得（星空視認性スコアと同じ期間）
    const astroStart = nightStart.clone();
    const astroEnd = nightEnd.clone();

    // 観測期間の長さ（時間単位）を計算し、4等分して時間帯を動的生成
    const observationDuration = astroEnd.diff(astroStart, 'hours', true);
    const slotDuration = Math.max(2, observationDuration / 4); // 最低2時間

    // 時間帯別の雲量データを収集（動的に4区分生成）
    const timeSlots = [];
    for (let i = 0; i < 4; i++) {
        const slotStart = astroStart.clone().add(slotDuration * i, 'hours');
        const slotEnd = i === 3 ? astroEnd.clone() : astroStart.clone().add(slotDuration * (i + 1), 'hours');
        timeSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
            label: `${slotStart.format('HH:mm')}-${slotEnd.format('HH:mm')}`,
            sum: 0,
            count: 0
        });
    }

    let astroCloudSum = 0;
    let astroCount = 0;

    hourly.time.forEach((t, i) => {
        const time = moment(t);
        if (time.isSameOrAfter(astroStart) && time.isBefore(astroEnd)) {
            astroCloudSum += hourly.cloud_cover[i];
            astroCount++;

            // 各時間帯に分類
            timeSlots.forEach(slot => {
                if (time.isSameOrAfter(slot.startTime) && time.isBefore(slot.endTime)) {
                    slot.sum += hourly.cloud_cover[i];
                    slot.count++;
                }
            });
        }
    });

    if (astroCount > 0) {
        const avgAstroCloud = astroCloudSum / astroCount;
        summary += "<br><br><strong>🔭 天体観測予報:</strong> ";
        const dateStr = astroStart.format('M/D');
        const observationPeriod = `<span class='text-xs text-slate-500'>(${astroStart.format('HH:mm')}～${astroEnd.format('HH:mm')})</span>`;

        // 月の影響を加味したコメント
        let moonComment = "";
        if (moonData.age > 10 && moonData.age < 18) {
            moonComment = " <span class='text-yellow-400'>※月明かりの影響大</span>";
        }

        // より厳しい閾値での全体評価
        if (avgAstroCloud < 10) {
            summary += `${dateStr}の夜${observationPeriod}は、雲が少なく<strong class='text-green-400'>絶好の天体観測日和</strong>です。${moonComment}`;
        } else if (avgAstroCloud < 25) {
            summary += `${dateStr}の夜${observationPeriod}は、<strong class='text-blue-400'>観測に適しています</strong>。${moonComment}`;
        } else if (avgAstroCloud < 50) {
            summary += `${dateStr}の夜${observationPeriod}は、<strong class='text-orange-400'>やや雲が多め</strong>です。雲の切れ間を狙いましょう。`;
        } else {
            summary += `${dateStr}の夜${observationPeriod}は、雲が多く<strong class='text-red-400'>観測には不向き</strong>な予報です。`;
        }

        // 時間帯別の詳細評価
        summary += "<div class='flex flex-wrap gap-2 mt-3'>";
        timeSlots.forEach(slot => {
            if (slot.count > 0) {
                const avg = slot.sum / slot.count;
                let icon = '';
                let color = '';
                let bg = '';
                if (avg < 10) {
                    icon = '⭐';
                    color = 'text-green-400';
                    bg = 'bg-green-500/10';
                } else if (avg < 25) {
                    icon = '✨';
                    color = 'text-blue-400';
                    bg = 'bg-blue-500/10';
                } else if (avg < 50) {
                    icon = '🌤️';
                    color = 'text-orange-400';
                    bg = 'bg-orange-500/10';
                } else {
                    icon = '☁️';
                    color = 'text-red-400';
                    bg = 'bg-red-500/10';
                }
                summary += `
                    <div class='flex flex-col items-center justify-center px-3 py-2 rounded-xl border border-white/5 ${bg} min-w-[80px]'>
                        <span class='text-xs text-slate-400 mb-1'>${slot.label}</span>
                        <span class='text-lg mb-1'>${icon}</span>
                        <span class='text-xs font-bold ${color}'>${Math.round(avg)}%</span>
                    </div>`;
            }
        });
        summary += "</div>";
    }
    
    // innerText -> innerHTML (タグを有効化するため)
    document.getElementById('forecast-summary').innerHTML = summary;

    // チャート描画 (24時間分に修正)
    const sliceStart = currentIndex;
    const sliceEnd = Math.min(currentIndex + 24, hourly.time.length);
    
    const labels = hourly.time.slice(sliceStart, sliceEnd).map(t => moment(t).format('D日 H時'));
    const fullDateLabels = hourly.time.slice(sliceStart, sliceEnd).map(t => moment(t).format('M月D日 H:mm'));
    
    const temps = hourly.temperature_2m.slice(sliceStart, sliceEnd);
    const cloudLow = hourly.cloud_cover_low.slice(sliceStart, sliceEnd);
    const cloudMid = hourly.cloud_cover_mid.slice(sliceStart, sliceEnd);
    const cloudHigh = hourly.cloud_cover_high.slice(sliceStart, sliceEnd);

    // 気温チャート
    const ctxTemp = document.getElementById('tempChart').getContext('2d');
    if(tempChartInstance) tempChartInstance.destroy();

    let gradientTemp = ctxTemp.createLinearGradient(0, 0, 0, 400);
    gradientTemp.addColorStop(0, 'rgba(251, 146, 60, 0.5)'); 
    gradientTemp.addColorStop(1, 'rgba(251, 146, 60, 0.0)');

    tempChartInstance = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '気温 (°C)',
                data: temps,
                borderColor: '#fb923c',
                backgroundColor: gradientTemp,
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { title: (items) => fullDateLabels[items[0].dataIndex] } }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', maxTicksLimit: 8 } }
            }
        }
    });

    // 雲チャート（個別線グラフ：積み重ねなし）
    // 配色: 下層=Gray-300, 中層=Emerald, 上層=Violet
    const ctxCloud = document.getElementById('cloudChart').getContext('2d');
    if(cloudChartInstance) cloudChartInstance.destroy();

    cloudChartInstance = new Chart(ctxCloud, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: '下層雲', data: cloudLow, borderColor: '#d1d5db', backgroundColor: 'rgba(209, 213, 219, 0.2)', borderWidth: 2, fill: false, tension: 0.4, pointRadius: 0 },
                { label: '中層雲', data: cloudMid, borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.2)', borderWidth: 2, fill: false, tension: 0.4, pointRadius: 0 },
                { label: '上層雲', data: cloudHigh, borderColor: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.2)', borderWidth: 2, fill: false, tension: 0.4, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#cbd5e1' } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                     callbacks: { title: (items) => fullDateLabels[items[0].dataIndex] }
                }
            },
            scales: {
                y: { stacked: false, beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8', callback: (value) => value + '%' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', maxTicksLimit: 8 } }
            }
        }
    });

    // 週間予報テーブル
    const weeklyBody = document.getElementById('weekly-forecast-body');
    weeklyBody.innerHTML = '';
    
    daily.time.forEach((t, i) => {
        const date = moment(t);
        const isSelectedDay = date.isSame(targetMoment, 'day');
        const weatherInfo = getWeatherInfo(daily.weathercode[i]);
        const maxTemp = daily.temperature_2m_max[i];
        const minTemp = daily.temperature_2m_min[i];
        const rainSum = daily.precipitation_sum[i];
        const rainProb = daily.precipitation_probability_max[i];
        
        // 月齢計算
        const moonInfo = calculateMoonData(date.toDate());

        // 1時間ごとのデータから、この日の平均雲量と湿度を計算
        const dateStr = t; // "YYYY-MM-DD"
        let cloudSum = 0;
        let humSum = 0;
        let count = 0;
        
        // データ量が少ないので単純ループで集計
        hourly.time.forEach((hTime, hIndex) => {
            if (hTime.startsWith(dateStr)) {
                cloudSum += hourly.cloud_cover[hIndex];
                humSum += hourly.relative_humidity_2m[hIndex];
                count++;
            }
        });
        
        const avgCloud = count > 0 ? Math.round(cloudSum / count) : '-';
        const avgHum = count > 0 ? Math.round(humSum / count) : '-';

        const row = document.createElement('tr');
        // cursor-pointer を追加、onclickを追加
        row.className = `border-b border-slate-700/50 transition cursor-pointer ${isSelectedDay ? 'bg-blue-500/20 border-l-4 border-l-blue-400' : 'hover:bg-white/5'}`;
        row.onclick = () => selectDate(t); // クリックイベント

        row.innerHTML = `
            <td class="py-4 px-2">
                <div class="font-bold ${isSelectedDay ? 'text-blue-300' : 'text-white'}">${date.format('M/D')}</div>
                <div class="text-xs text-slate-400">${date.format('ddd')}</div>
            </td>
            <td class="py-4 px-2">
                <div class="flex items-center gap-3">
                    <i data-lucide="${weatherInfo.icon}" class="${weatherInfo.color} w-6 h-6"></i>
                    <span class="hidden md:inline text-sm">${weatherInfo.label}</span>
                </div>
            </td>
            <td class="py-4 px-2 text-center">
                <div class="text-sm">${rainProb !== null ? rainProb + '%' : '-'}</div>
                <div class="text-xs text-blue-300">${rainSum > 0 ? rainSum + 'mm' : ''}</div>
            </td>
             <td class="py-4 px-2 text-center">
                <div class="text-sm font-semibold">${avgCloud !== '-' ? avgCloud + '%' : '-'}</div>
                <div class="w-16 bg-slate-700/50 rounded-full h-1 mx-auto mt-1">
                    <div class="bg-slate-400 h-1 rounded-full" style="width: ${avgCloud !== '-' ? avgCloud : 0}%"></div>
                </div>
            </td>
            <td class="py-4 px-2 text-center">
                <div class="text-sm font-semibold text-blue-200 flex items-center justify-center gap-1">
                    <i data-lucide="droplet" class="w-3 h-3"></i>
                    ${avgHum !== '-' ? avgHum + '%' : '-'}
                </div>
            </td>
             <td class="py-4 px-2 text-center">
                <div class="text-lg" title="${moonInfo.phaseName} (月齢${moonInfo.age})">${moonInfo.icon}</div>
                <div class="text-xs text-slate-400">${moonInfo.age}</div>
            </td>
            <td class="py-4 px-2 text-right">
                <span class="font-bold text-orange-400">${maxTemp}°</span> 
                <span class="text-slate-500 mx-1">/</span> 
                <span class="text-blue-300">${minTemp}°</span>
            </td>
        `;
        weeklyBody.appendChild(row);
    });
    
    lucide.createIcons();

    document.getElementById('loading').classList.add('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');

    // ISS星図モーダルが開いている場合は再描画
    const skymapModal = document.getElementById('iss-skymap-modal');
    if (skymapModal && !skymapModal.classList.contains('hidden')) {
        console.log('星図を再描画します。時刻:', targetDate);
        drawISSSkymapCanvas(targetDate);
    }
}
function openISSSkymapModal(forcedDate = null) {
    const modal = document.getElementById('iss-skymap-modal');
    modal.classList.remove('hidden');
    drawISSSkymapCanvas(forcedDate);
    lucide.createIcons();

    // 既存のintervalをクリア
    if (skymapUpdateInterval) {
        clearInterval(skymapUpdateInterval);
        skymapUpdateInterval = null;
    }

    // 現在位置表示の場合のみリアルタイム更新を開始（5秒ごと）
    // パス予測表示の場合（window.selectedPass がある場合）は更新しない
    if (!window.selectedPass) {
        skymapUpdateInterval = setInterval(() => {
            // パス選択状態が変わっていないことを確認
            if (!window.selectedPass) {
                drawISSSkymapCanvas();
            } else {
                // パスが選択されたら更新を停止
                clearInterval(skymapUpdateInterval);
                skymapUpdateInterval = null;
            }
        }, 5000); // 5秒ごとに更新
    }
}
function closeISSSkymapModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('iss-skymap-modal');
    modal.classList.add('hidden');
    window.selectedPass = null; // 閉じる時にパス選択をクリア

    // リアルタイム更新を停止
    if (skymapUpdateInterval) {
        clearInterval(skymapUpdateInterval);
        skymapUpdateInterval = null;
    }
}
function returnToCurrentPosition() {
    window.selectedPass = null;
    drawISSSkymapCanvas();

    // リアルタイム更新を再開
    if (skymapUpdateInterval) {
        clearInterval(skymapUpdateInterval);
        skymapUpdateInterval = null;
    }
    skymapUpdateInterval = setInterval(() => {
        if (!window.selectedPass) {
            drawISSSkymapCanvas();
        } else {
            clearInterval(skymapUpdateInterval);
            skymapUpdateInterval = null;
        }
    }, 5000);
}
function drawISSSkymapCanvas(forcedDate = null) {
    const canvas = document.getElementById('iss-skymap-canvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // キャンバスをクリア
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    try {
        // ISSのTLEデータと観測地点が必要
        if (!window.currentTLE || !currentLat || !currentLon) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ISS情報が取得できていません', width / 2, height / 2);
            return;
        }

        // 時刻の決定: 
        // 1. forcedDateが指定されている場合はそれを使用
        // 2. forcedDateがなく、パスが選択されている場合はパスの最大高度時刻を使用
        // 3. それ以外は現在時刻（dashboard time）を使用
        let targetDate;
        if (forcedDate) {
            targetDate = forcedDate;
        } else if (window.selectedPass) {
            targetDate = window.selectedPass.maxElevationTime;
        } else {
            targetDate = currentDatetime ? new Date(currentDatetime) : new Date();
        }
        
        console.log('星図描画時刻:', targetDate, 'forcedDate:', forcedDate, 'selectedPass:', window.selectedPass);
        const observer = new Astronomy.Observer(currentLat, currentLon, 0);

        // 極座標変換関数（方位角・高度 → Canvas座標）
        // 中心 = 天頂（高度90°）、外側 = 地平線（高度0°）
        // 方位角: 0度=北（上）、90度=東（右）、180度=南（下）、270度=西（左）
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2 - 40; // マージンを考慮

        function azAltToCanvas(azimuth, altitude) {
            // 高度0° = maxRadius（地平線）、高度90° = 0（天頂）
            const radius = ((90 - altitude) / 90) * maxRadius;

            // 方位角を極座標の角度に変換（0°=北=上）
            const azimuthRadians = (azimuth * Math.PI) / 180;
            const x = centerX + radius * Math.sin(azimuthRadians);
            const y = centerY - radius * Math.cos(azimuthRadians);

            return { x, y };
        }

        // タイトル表示（パスが選択されている場合）
        if (window.selectedPass) {
            const pass = window.selectedPass;
            const titleText = `${moment(pass.startTime).format('YYYY/MM/DD HH:mm')} - ${moment(pass.endTime).format('HH:mm')}`;
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(titleText, centerX, 25);
        }

        // グリッド線を描画（極座標形式）
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;

        // 同心円グリッド（高度15°, 30°, 45°, 60°, 75°）
        for (let alt = 15; alt <= 75; alt += 15) {
            const radius = ((90 - alt) / 90) * maxRadius;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();

            // 高度ラベルを北側（上）に表示
            ctx.fillStyle = '#475569';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${alt}°`, centerX, centerY - radius - 3);
        }

        // 地平線（高度0°）を外周の円として強調表示
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // 放射線グリッド（方位角15°刻み）
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        for (let az = 0; az < 360; az += 15) {
            const azRad = (az * Math.PI) / 180;
            const x1 = centerX;
            const y1 = centerY;
            const x2 = centerX + maxRadius * Math.sin(azRad);
            const y2 = centerY - maxRadius * Math.cos(azRad);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // 方位ラベル（N, E, S, W）を外側に表示
        const directions = [
            { deg: 0, label: 'N' },
            { deg: 90, label: 'E' },
            { deg: 180, label: 'S' },
            { deg: 270, label: 'W' }
        ];

        directions.forEach(dir => {
            const azRad = (dir.deg * Math.PI) / 180;
            const labelRadius = maxRadius + 20;
            const x = centerX + labelRadius * Math.sin(azRad);
            const y = centerY - labelRadius * Math.cos(azRad);

            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dir.label, x, y);
        });

        // 天体リスト（太陽、月、惑星のみ。astronomy-engineは恒星をサポートしていません）
        const visibleStars = [];

        // 太陽の地平座標を計算
        try {
            const sunEquator = Astronomy.Equator(Astronomy.Body.Sun, targetDate, observer, true, true);
            const sunHorizon = Astronomy.Horizon(targetDate, observer, sunEquator.ra, sunEquator.dec, 'normal');

            if (sunHorizon.altitude > 0) {
                visibleStars.push({
                    name: '太陽',
                    azimuth: sunHorizon.azimuth,
                    altitude: sunHorizon.altitude,
                    isSun: true
                });
            }
        } catch (e) {
            console.warn('太陽の計算をスキップ:', e.message);
        }

        // 月の地平座標を計算
        try {
            const moonEquator = Astronomy.Equator('Moon', targetDate, observer, true, true);
            const moonHorizon = Astronomy.Horizon(targetDate, observer, moonEquator.ra, moonEquator.dec, 'normal');

            if (moonHorizon.altitude > 0) {
                visibleStars.push({
                    name: '月',
                    azimuth: moonHorizon.azimuth,
                    altitude: moonHorizon.altitude,
                    isMoon: true
                });
            }
        } catch (e) {
            console.warn('月の計算をスキップ:', e.message);
        }

        // 惑星の地平座標を計算（高度>0のもののみ）
        const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
        const planetNames = { 'Mercury': '水星', 'Venus': '金星', 'Mars': '火星', 'Jupiter': '木星', 'Saturn': '土星' };
        planets.forEach(planet => {
            try {
                const equator = Astronomy.Equator(planet, targetDate, observer, true, true);
                const horizon = Astronomy.Horizon(targetDate, observer, equator.ra, equator.dec, 'normal');

                if (horizon.altitude > 0) {
                    visibleStars.push({
                        name: planetNames[planet],
                        azimuth: horizon.azimuth,
                        altitude: horizon.altitude,
                        isPlanet: true
                    });
                }
            } catch (e) {
                console.warn(`惑星 ${planet} の計算をスキップ:`, e.message);
            }
        });

        // 天体を描画
        visibleStars.forEach(star => {
            const pos = azAltToCanvas(star.azimuth, star.altitude);

            if (star.isSun) {
                // 太陽はオレンジの大きめの円
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = '#fb923c';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (star.isMoon) {
                // 月は白い大きめの円
                ctx.fillStyle = '#f0f0f0';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (star.isPlanet) {
                // 惑星は黄色の小さい円
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 3, 0, 2 * Math.PI);
                ctx.fill();
            } else {
                // 恒星は白い点
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 2, 0, 2 * Math.PI);
                ctx.fill();
            }

            // 天体名を表示
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(star.name, pos.x + 5, pos.y + 3);
        });

        // 選択されたパスの軌道を描画
        if (window.selectedPass) {
            const pass = window.selectedPass;
            const satrec = satellite.twoline2satrec(window.currentTLE.line1, window.currentTLE.line2);
            const passPoints = [];

            // パスの軌道を計算（30秒刻み）
            for (let time = pass.startTime.getTime(); time <= pass.endTime.getTime(); time += 30000) {
                const date = new Date(time);
                const positionAndVelocity = satellite.propagate(satrec, date);

                if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
                    const positionEci = positionAndVelocity.position;
                    const gmst = satellite.gstime(date);

                    const observerGd = {
                        longitude: satellite.degreesToRadians(currentLon),
                        latitude: satellite.degreesToRadians(currentLat),
                        height: 0
                    };

                    const positionEcf = satellite.eciToEcf(positionEci, gmst);
                    const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

                    const azimuth = satellite.radiansToDegrees(lookAngles.azimuth);
                    const elevation = satellite.radiansToDegrees(lookAngles.elevation);

                    if (elevation > 0) {
                        passPoints.push({ azimuth, elevation, time: date });
                    }
                }
            }

            // 軌道を線で描画
            if (passPoints.length > 1) {
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = 2;
                ctx.beginPath();

                const firstPoint = azAltToCanvas(passPoints[0].azimuth, passPoints[0].elevation);
                ctx.moveTo(firstPoint.x, firstPoint.y);

                for (let i = 1; i < passPoints.length; i++) {
                    const point = azAltToCanvas(passPoints[i].azimuth, passPoints[i].elevation);
                    ctx.lineTo(point.x, point.y);
                }

                ctx.stroke();

                // 軌道上の矢印マーカーを描画（5分刻み）
                passPoints.forEach((point, index) => {
                    if (index % 10 === 0 && index < passPoints.length - 1) { // 30秒×10 = 5分
                        const pos = azAltToCanvas(point.azimuth, point.elevation);
                        const nextPoint = passPoints[Math.min(index + 1, passPoints.length - 1)];
                        const nextPos = azAltToCanvas(nextPoint.azimuth, nextPoint.elevation);

                        // 進行方向の角度を計算
                        const angle = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x);

                        // 矢印を描画
                        ctx.save();
                        ctx.translate(pos.x, pos.y);
                        ctx.rotate(angle);

                        ctx.fillStyle = '#eab308';
                        ctx.beginPath();
                        ctx.moveTo(8, 0);
                        ctx.lineTo(-4, -5);
                        ctx.lineTo(-4, 5);
                        ctx.closePath();
                        ctx.fill();

                        ctx.restore();

                        // 時刻を表示（軌道から少し離れた位置に）
                        const labelAngle = angle + Math.PI / 2; // 垂直方向
                        const labelDist = 15;
                        const labelX = pos.x + labelDist * Math.cos(labelAngle);
                        const labelY = pos.y + labelDist * Math.sin(labelAngle);

                        ctx.fillStyle = '#fbbf24';
                        ctx.font = '11px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(moment(point.time).format('HH:mm:ss'), labelX, labelY);
                    }
                });
            }
        }

        // ISSの現在位置を計算
        const satrec = satellite.twoline2satrec(window.currentTLE.line1, window.currentTLE.line2);
        const positionAndVelocity = satellite.propagate(satrec, targetDate);

        let issVisible = false;
        let issAzimuth = 0;
        let issAltitude = 0;

        if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
            const positionEci = positionAndVelocity.position;
            const gmst = satellite.gstime(targetDate);
            const positionGd = satellite.eciToGeodetic(positionEci, gmst);

            const latitude = satellite.degreesLat(positionGd.latitude);
            const longitude = satellite.degreesLong(positionGd.longitude);
            const height = positionGd.height;

            const observerGd = {
                longitude: satellite.degreesToRadians(currentLon),
                latitude: satellite.degreesToRadians(currentLat),
                height: 0
            };

            const positionEcf = satellite.eciToEcf(positionEci, gmst);
            const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

            issAzimuth = satellite.radiansToDegrees(lookAngles.azimuth);
            issAltitude = satellite.radiansToDegrees(lookAngles.elevation);

            // ISSが視野内（地平線上）にあるか
            issVisible = issAltitude > 0;

            if (issVisible) {
                // ISSの位置を描画（赤い大きな円）
                const issPos = azAltToCanvas(issAzimuth, issAltitude);

                // 外側の光輪
                const gradient = ctx.createRadialGradient(issPos.x, issPos.y, 0, issPos.x, issPos.y, 20);
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(issPos.x, issPos.y, 20, 0, 2 * Math.PI);
                ctx.fill();

                // ISS本体
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(issPos.x, issPos.y, 6, 0, 2 * Math.PI);
                ctx.fill();

                // ISS外周
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(issPos.x, issPos.y, 6, 0, 2 * Math.PI);
                ctx.stroke();

                // ISSラベル
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('ISS', issPos.x, issPos.y - 12);
            }
        }

        // 情報パネルを更新
        const infoDiv = document.getElementById('iss-skymap-info');

        if (window.selectedPass) {
            // 選択されたパスの情報を表示
            const pass = window.selectedPass;
            const duration = (pass.endTime - pass.startTime) / 1000 / 60;
            infoDiv.innerHTML = `
                <div class="bg-blue-900/30 rounded p-2">
                    <div class="text-blue-300 font-semibold text-sm mb-2 flex items-center justify-between">
                        <span>📡 選択されたパス</span>
                        <button onclick="returnToCurrentPosition();" class="text-xs text-slate-400 hover:text-white">
                            現在位置に戻る
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <div class="text-slate-400">開始時刻</div>
                            <div class="text-white font-mono">${moment(pass.startTime).format('M/D HH:mm')}</div>
                        </div>
                        <div>
                            <div class="text-slate-400">終了時刻</div>
                            <div class="text-white font-mono">${moment(pass.endTime).format('M/D HH:mm')}</div>
                        </div>
                        <div>
                            <div class="text-slate-400">最大高度</div>
                            <div class="text-white font-mono">${pass.maxElevation.toFixed(1)}°</div>
                        </div>
                        <div>
                            <div class="text-slate-400">最大高度時刻</div>
                            <div class="text-white font-mono">${moment(pass.maxElevationTime).format('HH:mm')}</div>
                        </div>
                        <div>
                            <div class="text-slate-400">継続時間</div>
                            <div class="text-white">${duration.toFixed(0)}分</div>
                        </div>
                        <div>
                            <div class="text-slate-400">距離</div>
                            <div class="text-white">${pass.maxDistance.toFixed(0)}km</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (issVisible) {
            const direction = getDirection(issAzimuth);
            infoDiv.innerHTML = `
                <div class="grid grid-cols-3 gap-4 text-xs">
                    <div>
                        <div class="text-slate-400">方位角</div>
                        <div class="text-white font-mono text-sm">${issAzimuth.toFixed(1)}° (${direction})</div>
                    </div>
                    <div>
                        <div class="text-slate-400">高度</div>
                        <div class="text-white font-mono text-sm">${issAltitude.toFixed(1)}°</div>
                    </div>
                    <div>
                        <div class="text-slate-400">状態</div>
                        <div class="text-green-300 text-sm font-semibold">視野内 ✓</div>
                    </div>
                </div>
                <div class="mt-2 text-xs text-slate-400">
                    📍 観測地点: ${currentLat.toFixed(2)}°, ${currentLon.toFixed(2)}° | 計算時刻: ${moment(targetDate).format('HH:mm:ss')}
                </div>
            `;
        } else {
            infoDiv.innerHTML = `
                <div class="text-center text-slate-400">
                    <div class="text-lg mb-2">🌅</div>
                    <div class="font-semibold">ISSは現在視野内にありません</div>
                    <div class="text-xs mt-2">
                        高度: ${issAltitude.toFixed(1)}° (地平線下)
                    </div>
                    <div class="text-xs mt-1">
                        📍 観測地点: ${currentLat.toFixed(2)}°, ${currentLon.toFixed(2)}° | 計算時刻: ${moment(targetDate).format('HH:mm:ss')}
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error('星座図描画エラー:', error);
        console.error('エラースタック:', error.stack);
        ctx.fillStyle = '#ef4444';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('エラーが発生しました', width / 2, height / 2 - 20);
        ctx.font = '12px sans-serif';
        ctx.fillText(error.message, width / 2, height / 2 + 10);
    }
}
function getDirection(azimuth) {
    if (azimuth >= 337.5 || azimuth < 22.5) return '北';
    else if (azimuth >= 22.5 && azimuth < 67.5) return '北東';
    else if (azimuth >= 67.5 && azimuth < 112.5) return '東';
    else if (azimuth >= 112.5 && azimuth < 157.5) return '南東';
    else if (azimuth >= 157.5 && azimuth < 202.5) return '南';
    else if (azimuth >= 202.5 && azimuth < 247.5) return '南西';
    else if (azimuth >= 247.5 && azimuth < 292.5) return '西';
    else return '北西';
}
