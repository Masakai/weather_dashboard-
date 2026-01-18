import { AppState } from './state.js?v=3.2.3';
import { METEOR_SHOWERS, SEASONAL_OBJECTS } from './constants.js?v=3.2.3';

export function calculateStarryScore(cloudCover, moonAge, humidity, visibility = 24, windSpeed = 5) {
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
export function updateStarryScore(score) {
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
        comment.textContent = '☁️ 観測には不向きな条件です。空は雲に覆われています';
    }
}
export function renderRadarChart(data) {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    if (AppState.ui.charts.radar) {
        AppState.ui.charts.radar.destroy();
    }

    AppState.ui.charts.radar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['雲の少なさ', '月の暗さ', '低湿度', '視程の良さ', '風の弱さ'],
            datasets: [{
                label: '観測適性指標',
                data: [
                    data.cloudClearness,
                    data.moonDarkness,
                    data.lowHumidity,
                    data.goodVisibility,
                    data.calmWind
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: '#94a3b8',
                        font: {
                            size: 11
                        }
                    },
                    ticks: {
                        display: false,
                        stepSize: 20
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
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
export async function fetchWeather(lat, lon) {
    // API URL (追加気象データを含む)
    const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,windspeed_10m,winddirection_10m,surface_pressure,dewpoint_2m,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FTokyo&past_days=2&forecast_days=10`;

    try {
        const response = await fetch(API_URL);

        // HTTPエラーチェック
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        AppState.weather.data = await response.json();

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
export function setDatePickerValue(momentObj) {
    const formatted = momentObj.format('YYYY-MM-DDTHH:mm');
    document.getElementById('target-datetime').value = formatted;
}
export function updateDashboardTime() {
    const val = document.getElementById('target-datetime').value;
    if (val && AppState.weather.data) {
        renderDashboard(moment(val));

        // ISS星図モーダルが開いている場合は再描画
        const skymapModal = document.getElementById('iss-skymap-modal');
        if (skymapModal && !skymapModal.classList.contains('hidden')) {
            console.log('updateDashboardTime: 星図を再描画');
            drawISSSkymapCanvas();
        }
    }
}
export function resetToNow() {
    const now = moment();
    setDatePickerValue(now);
    if (AppState.weather.data) {
        renderDashboard(now);
    }
}
export function selectDate(dateStr) {
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
export function getWeatherInfo(code) {
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
export function renderDashboard(targetMoment) {
    if (!AppState.weather.data) return;

    const hourly = AppState.weather.data.hourly;
    const daily = AppState.weather.data.daily;
    const targetDate = targetMoment.toDate();
    AppState.weather.selectedDatetime = targetDate; // グローバル変数を更新
    
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
    updateISSInfo(targetDate, AppState.location.lat, AppState.location.lon);
    calculateVisiblePlanets(targetDate, AppState.location.lat, AppState.location.lon);
    calculateMilkyWayVisibility(targetDate, AppState.location.lat, AppState.location.lon, moonData, currentCloudTotal);
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
    const sunMoonTimes = calculateSunMoonTimes(startOfDay, AppState.location.lat, AppState.location.lon);
    updateSunMoonDisplay(sunMoonTimes);

    // 翌日の日の出時刻を取得（タイムラインと夜間雲量計算で使用）
    const nextDay = moment(targetDate).add(1, 'day').startOf('day').toDate();
    const nextDaySunMoonTimes = calculateSunMoonTimes(nextDay, AppState.location.lat, AppState.location.lon);

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
    if(AppState.ui.charts.temp) AppState.ui.charts.temp.destroy();

    let gradientTemp = ctxTemp.createLinearGradient(0, 0, 0, 400);
    gradientTemp.addColorStop(0, 'rgba(251, 146, 60, 0.5)'); 
    gradientTemp.addColorStop(1, 'rgba(251, 146, 60, 0.0)');

    AppState.ui.charts.temp = new Chart(ctxTemp, {
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
    if(AppState.ui.charts.cloud) AppState.ui.charts.cloud.destroy();

    AppState.ui.charts.cloud = new Chart(ctxCloud, {
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

        // この日の夜間の視認スコアを計算
        let dayScore = 50; // デフォルト値
        let scoreBgClass = 'bg-orange-500/10'; // デフォルトの背景色

        try {
            // この日の日没～翌日の日の出時刻を取得
            const dayStart = date.clone().startOf('day').toDate();
            const daySunMoonTimes = calculateSunMoonTimes(dayStart, AppState.location.lat, AppState.location.lon);
            const nextDayStart = date.clone().add(1, 'day').startOf('day').toDate();
            const nextDaySunMoonTimes = calculateSunMoonTimes(nextDayStart, AppState.location.lat, AppState.location.lon);

            // 夜間の範囲を設定
            const nightStart = daySunMoonTimes.sunsetDate ? moment(daySunMoonTimes.sunsetDate) :
                              date.clone().startOf('day').add(18, 'hours');
            const nightEnd = nextDaySunMoonTimes.sunriseDate ? moment(nextDaySunMoonTimes.sunriseDate) :
                            nightStart.clone().add(12, 'hours');

            // 夜間の平均雲量・湿度・風速・視程を計算
            let nightCloudSum = 0;
            let nightHumSum = 0;
            let nightWindSum = 0;
            let nightVisSum = 0;
            let nightCount = 0;

            hourly.time.forEach((hTime, hIndex) => {
                const time = moment(hTime);
                if (time.isSameOrAfter(nightStart) && time.isBefore(nightEnd)) {
                    nightCloudSum += hourly.cloud_cover[hIndex];
                    nightHumSum += hourly.relative_humidity_2m[hIndex];
                    nightWindSum += hourly.windspeed_10m ? hourly.windspeed_10m[hIndex] : 5;
                    nightVisSum += hourly.visibility ? (hourly.visibility[hIndex] / 1000) : 24;
                    nightCount++;
                }
            });

            if (nightCount > 0) {
                const avgNightCloud = nightCloudSum / nightCount;
                const avgNightHum = nightHumSum / nightCount;
                const avgNightWind = nightWindSum / nightCount;
                const avgNightVis = nightVisSum / nightCount;

                // 視認スコアを計算
                dayScore = calculateStarryScore(avgNightCloud, moonInfo.age, avgNightHum, avgNightVis, avgNightWind);
            }
        } catch (error) {
            console.error('視認スコア計算エラー:', error);
        }

        // スコアに応じた背景色を設定
        if (dayScore >= 80) {
            scoreBgClass = 'bg-green-500/15';
        } else if (dayScore >= 60) {
            scoreBgClass = 'bg-blue-500/15';
        } else if (dayScore >= 40) {
            scoreBgClass = 'bg-orange-500/15';
        } else if (dayScore >= 20) {
            scoreBgClass = 'bg-red-500/15';
        } else {
            scoreBgClass = 'bg-red-500/20';
        }

        const row = document.createElement('tr');
        // cursor-pointer を追加、onclickを追加
        // 選択された日の場合は青色の背景、それ以外は視認スコアに応じた背景色
        row.className = `border-b border-slate-700/50 transition cursor-pointer ${isSelectedDay ? 'bg-blue-500/20 border-l-4 border-l-blue-400' : scoreBgClass + ' hover:bg-white/5'}`;
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
