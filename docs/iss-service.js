import { AppState } from './state.js';
    // Lucideアイコンを再初期化
    lucide.createIcons();
}
export function requestISSNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            AppState.iss.notificationPermission = permission;
            console.log('通知権限:', permission);
        });
    } else {
        console.log('このブラウザは通知をサポートしていません');
    }
}
export function checkISSNotifications() {
    if (!AppState.iss.calculatedPasses || AppState.iss.calculatedPasses.length === 0) {
        return;
    }

    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const oneHourFiveMinLater = new Date(now.getTime() + 65 * 60 * 1000);

    // 次の1時間以内のパスを探す
    for (let i = 0; i < AppState.iss.calculatedPasses.length; i++) {
        const pass = AppState.iss.calculatedPasses[i];
        const passTime = new Date(pass.startTime);

        // パスの開始時刻が55分〜65分後の範囲にあるかチェック（5分の猶予）
        if (passTime >= oneHourLater && passTime <= oneHourFiveMinLater) {
            const passKey = pass.startTime.getTime().toString();

            // まだ通知していないパスの場合
            if (!AppState.iss.notifiedPasses.has(passKey)) {
                AppState.iss.notifiedPasses.add(passKey);
                showISSNotification(pass);
                break; // 1回に1つのパスのみ通知
            }
        }
    }
}
export function showISSNotification(pass) {
    const startTime = moment(pass.startTime).format('HH:mm');
    const maxElevation = pass.maxElevation.toFixed(1);
    const duration = Math.round((pass.endTime - pass.startTime) / 1000 / 60);

    const message = `約1時間後（${startTime}頃）にISS通過があります！\n最大高度: ${maxElevation}° | 継続時間: ${duration}分`;

    // ブラウザ通知を表示（許可されている場合）
    if (AppState.iss.notificationPermission === 'granted') {
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
export function showISSNotificationBanner(message) {
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
export function closeISSNotification() {
    const banner = document.getElementById('iss-notification-banner');
    banner.classList.add('hidden');
}
export function startISSNotificationCheck() {
    // 既存のintervalをクリア
    if (AppState.iss.notificationInterval) {
        clearInterval(AppState.iss.notificationInterval);
    }

    // 初回チェック
    checkISSNotifications();

    // 1分ごとにチェック
    AppState.iss.notificationInterval = setInterval(() => {
        checkISSNotifications();
    }, 60 * 1000); // 60秒

    console.log('ISS通過通知チェックを開始しました');
}
export function stopISSNotificationCheck() {
export async function calculateAndDisplayISS(date, observerLat, observerLon) {
    const container = document.getElementById('iss-info');
    try {
        const now = new Date().getTime();
        const cachedTLE = localStorage.getItem('issTLE');
        const lastFetch = localStorage.getItem('lastTLEFetch');
        const oneDay = 24 * 60 * 60 * 1000;

        if (cachedTLE && lastFetch && (now - lastFetch < oneDay)) {
            AppState.iss.tle = JSON.parse(cachedTLE);
        } else {
            AppState.iss.tle = null; // リフレッシュのためにクリア
        }

        if (!AppState.iss.tle) {
            // CelesTrakからISSのTLEを取得
            try {
                const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle&NAME=ISS');
                if (response.ok) {
                    const text = await response.text();
                    const lines = text.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].includes('ISS (ZARYA)')) {
                            AppState.iss.tle = {
                                line1: lines[i+1].trim(),
                                line2: lines[i+2].trim()
                            };
                            // キャッシュに保存
                            localStorage.setItem('issTLE', JSON.stringify(AppState.iss.tle));
                            localStorage.setItem('lastTLEFetch', now.toString());
                            break;
                        }
                    }
                }
            } catch (e) {
                console.warn('TLEの取得に失敗しました。予備データを使用します。', e);
            }

            if (!AppState.iss.tle) {
                // 取得失敗時はキャッシュがあればそれを使う、なければデフォルト
                if (cachedTLE) {
                    AppState.iss.tle = JSON.parse(cachedTLE);
                } else {
                    AppState.iss.tle = {
                        line1: "1 25544U 98067A   25014.54922454  .00015647  00000-0  27838-3 0  9990",
                        line2: "2 25544  51.6391 350.3705 0005239  55.5135  47.8824 15.49528481491593"
                    };
                }
            }
        }

        // グローバル変数に保存（星座図で使用）
        window.currentTLE = AppState.iss.tle;

        const satrec = satellite.twoline2satrec(AppState.iss.tle.line1, AppState.iss.tle.line2);
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
            if (!AppState.ui.map) {
                initMap();
            }
            if (AppState.ui.map) {
                if (AppState.iss.marker) {
                    AppState.iss.marker.setLatLng([latitude, longitude]);
                } else {
                    const issIcon = L.divIcon({
                        html: '<i data-lucide="satellite" class="text-blue-400 w-6 h-6"></i>',
                        className: 'iss-map-icon',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });
                    AppState.iss.marker = L.marker([latitude, longitude], {icon: issIcon}).addTo(AppState.ui.map);
                    AppState.iss.marker.bindPopup("ISS (国際宇宙ステーション)");
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
export function calculateISSPasses() {
    const container = document.getElementById('iss-passes-list');
    container.innerHTML = '<div class="text-slate-400 text-xs">計算中...</div>';

    try {
        if (!window.currentTLE || !AppState.location.lat || !AppState.location.lon) {
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
                    longitude: satellite.degreesToRadians(AppState.location.lon),
                    latitude: satellite.degreesToRadians(AppState.location.lat),
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
        AppState.iss.calculatedPasses = passes;

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
export function showPassOnSkymap(passIndex) {
    if (passIndex < 0 || passIndex >= AppState.iss.calculatedPasses.length) return;

    window.selectedPass = AppState.iss.calculatedPasses[passIndex];

    // リアルタイム更新を停止（パス予測表示モードに切り替え）
    if (AppState.ui.skymapUpdateInterval) {
        clearInterval(AppState.ui.skymapUpdateInterval);
        AppState.ui.skymapUpdateInterval = null;
    }
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
export function openISSSkymapModal(forcedDate = null) {
    const modal = document.getElementById('iss-skymap-modal');
    modal.classList.remove('hidden');
    drawISSSkymapCanvas(forcedDate);
    lucide.createIcons();

    // 既存のintervalをクリア
    if (AppState.ui.skymapUpdateInterval) {
        clearInterval(AppState.ui.skymapUpdateInterval);
        AppState.ui.skymapUpdateInterval = null;
    }

    // 現在位置表示の場合のみリアルタイム更新を開始（5秒ごと）
    // パス予測表示の場合（window.selectedPass がある場合）は更新しない
    if (!window.selectedPass) {
        AppState.ui.skymapUpdateInterval = setInterval(() => {
            // パス選択状態が変わっていないことを確認
            if (!window.selectedPass) {
                drawISSSkymapCanvas();
            } else {
                // パスが選択されたら更新を停止
                clearInterval(AppState.ui.skymapUpdateInterval);
                AppState.ui.skymapUpdateInterval = null;
            }
        }, 5000); // 5秒ごとに更新
    }
}
export function closeISSSkymapModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('iss-skymap-modal');
    modal.classList.add('hidden');
    window.selectedPass = null; // 閉じる時にパス選択をクリア

    // リアルタイム更新を停止
    if (AppState.ui.skymapUpdateInterval) {
        clearInterval(AppState.ui.skymapUpdateInterval);
        AppState.ui.skymapUpdateInterval = null;
    }
}
export function returnToCurrentPosition() {
    window.selectedPass = null;
    drawISSSkymapCanvas();

    // リアルタイム更新を再開
    if (AppState.ui.skymapUpdateInterval) {
        clearInterval(AppState.ui.skymapUpdateInterval);
        AppState.ui.skymapUpdateInterval = null;
    }
    AppState.ui.skymapUpdateInterval = setInterval(() => {
        if (!window.selectedPass) {
            drawISSSkymapCanvas();
        } else {
            clearInterval(AppState.ui.skymapUpdateInterval);
            AppState.ui.skymapUpdateInterval = null;
        }
    }, 5000);
}
export function drawISSSkymapCanvas(forcedDate = null) {
    const canvas = document.getElementById('iss-skymap-canvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // キャンバスをクリア
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    try {
        // ISSのTLEデータと観測地点が必要
        if (!window.currentTLE || !AppState.location.lat || !AppState.location.lon) {
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
            targetDate = AppState.weather.selectedDatetime ? new Date(AppState.weather.selectedDatetime) : new Date();
        }
        
        console.log('星図描画時刻:', targetDate, 'forcedDate:', forcedDate, 'selectedPass:', window.selectedPass);
        const observer = new Astronomy.Observer(AppState.location.lat, AppState.location.lon, 0);

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
                        longitude: satellite.degreesToRadians(AppState.location.lon),
                        latitude: satellite.degreesToRadians(AppState.location.lat),
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
                longitude: satellite.degreesToRadians(AppState.location.lon),
                latitude: satellite.degreesToRadians(AppState.location.lat),
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
                    📍 観測地点: ${AppState.location.lat.toFixed(2)}°, ${AppState.location.lon.toFixed(2)}° | 計算時刻: ${moment(targetDate).format('HH:mm:ss')}
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
                        📍 観測地点: ${AppState.location.lat.toFixed(2)}°, ${AppState.location.lon.toFixed(2)}° | 計算時刻: ${moment(targetDate).format('HH:mm:ss')}
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
export function getDirection(azimuth) {
    if (azimuth >= 337.5 || azimuth < 22.5) return '北';
    else if (azimuth >= 22.5 && azimuth < 67.5) return '北東';
    else if (azimuth >= 67.5 && azimuth < 112.5) return '東';
    else if (azimuth >= 112.5 && azimuth < 157.5) return '南東';
    else if (azimuth >= 157.5 && azimuth < 202.5) return '南';
    else if (azimuth >= 202.5 && azimuth < 247.5) return '南西';
    else if (azimuth >= 247.5 && azimuth < 292.5) return '西';
    else return '北西';
}
