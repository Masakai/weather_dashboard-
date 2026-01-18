import { AppState } from './state.js?v=3.2.2';
import { METEOR_SHOWERS, SEASONAL_OBJECTS } from './constants.js?v=3.2.2';
export function calculateSunMoonTimes(date, lat, lon) {
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
export function updateSunMoonDisplay(times) {
    document.getElementById('sunrise-time').innerText = times.sunrise;
    document.getElementById('sunset-time').innerText = times.sunset;
    // 観測開始 = 夕方の天文薄明終了（完全に暗くなる時刻）
    document.getElementById('observation-start-time').innerText = times.observationStart;
    // 観測終了 = 朝の天文薄明開始（明るくなり始める時刻）
    document.getElementById('observation-end-time').innerText = times.observationEnd;
    document.getElementById('moonrise-time').innerText = times.moonrise;
    document.getElementById('moonset-time').innerText = times.moonset;
}
export function renderTimeline(todayTimes, nextDayTimes, targetDate, hourlyData = null) {
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

    // 現在時刻インジケーター（ターゲット時刻）
    const targetMoment = moment(targetDate);
    if (targetMoment.isBetween(timelineStart, timelineEnd)) {
        const targetPos = ((targetMoment - timelineStart) / timelineDuration) * 100;
        const indicator = document.createElement('div');
        indicator.className = 'absolute top-0 w-0.5 h-full bg-red-500 z-10';
        indicator.style.left = `${targetPos}%`;
        indicator.innerHTML = '<div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1 rounded shadow-lg whitespace-nowrap">選択中</div>';
        container.appendChild(indicator);
    }

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
    labelsContainer.innerHTML = ''; // クリア
    labels.forEach(label => {
        const span = document.createElement('span');
        span.textContent = label;
        labelsContainer.appendChild(span);
    });
}

export function calculateMoonData(date) {
    // 簡易的な月齢計算
    const baseDate = new Date(2000, 0, 6, 18, 14, 0);
    const cycle = 29.530588853;
    const diff = (date.getTime() - baseDate.getTime()) / (24 * 60 * 60 * 1000);
    const age = (diff % cycle + cycle) % cycle;
    
    let icon, phaseName;
    if (age < 1 || age >= 28.5) { icon = '🌑'; phaseName = '新月'; }
    else if (age < 6.5) { icon = '🌙'; phaseName = '三日月'; }
    else if (age < 8.5) { icon = '🌓'; phaseName = '上弦の月'; }
    else if (age < 14) { icon = '🌔'; phaseName = '十三夜月'; }
    else if (age < 16) { icon = '🌕'; phaseName = '満月'; }
    else if (age < 21) { icon = '🌖'; phaseName = '寝待月'; }
    else if (age < 23) { icon = '🌗'; phaseName = '下弦の月'; }
    else { icon = '🌘'; phaseName = '明けの三日月'; }

    return {
        age: age.toFixed(1),
        icon: icon,
        phaseName: phaseName
    };
}

export function calculateCelestialEvents(date, lat, lon) {
    const events = [];
    const momentDate = moment(date);
    METEOR_SHOWERS.forEach(shower => {
        const peak = moment(`${momentDate.year()}-${shower.peak}`, 'YYYY-MM-DD');
        const diff = peak.diff(momentDate, 'days');
        if (Math.abs(diff) <= 7) {
            events.push({
                name: shower.name,
                date: peak.format('M/D'),
                type: 'meteor',
                description: diff === 0 ? '本日極大！' : (diff > 0 ? `${diff}日後が極大` : `${Math.abs(diff)}日前が極大`)
            });
        }
    });
    return events;
}

export function calculateVisiblePlanets(observerDate, observerLat, observerLon) {
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
export function calculateMilkyWayVisibility(observerDate, observerLat, observerLon, moonData, cloudCover) {
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
export function calculateAtmosphericConditions(humidity, visibility, windSpeed, pressure, pressurePrev) {
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
export function calculateExposure() {
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
export function updateMeteorShowers(targetDate) {
    const currentYear = targetDate.getFullYear();
    const currentMonth = String(targetDate.getMonth() + 1).padStart(2, '0');
    const currentDay = String(targetDate.getDate()).padStart(2, '0');
    const currentDateStr = `${currentMonth}-${currentDay}`;

    // 前後30日以内の流星群をフィルタ
    const relevantShowers = METEOR_SHOWERS.filter(shower => {
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
export function getSeason(date = new Date()) {
    const month = date.getMonth() + 1; // 0-11 → 1-12
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
}
export function updateRecommendedObjects(moonAge) {
    const age = parseFloat(moonAge);
    const container = document.getElementById('recommended-objects');
    const season = getSeason();
    const seasonData = SEASONAL_OBJECTS[season];

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
// 天文イベント詳細情報を取得する関数
export function getEclipseDetails(eclipse, eventType, observerLat, observerLon) {
    try {
        const details = {
            type: eventType,
            rawData: eclipse
        };

        if (eventType.includes('月食')) {
            // 月食の詳細情報
            const peak = eclipse.peak.date || eclipse.peak;
            details.peakTime = moment(peak).format('YYYY年M月D日 HH:mm');

            // 月食の継続時間
            if (eclipse.sd_total && eclipse.sd_total > 0) {
                details.totalDuration = Math.round(eclipse.sd_total * 2);
                details.totalStart = moment(peak).subtract(eclipse.sd_total, 'minutes').format('HH:mm');
                details.totalEnd = moment(peak).add(eclipse.sd_total, 'minutes').format('HH:mm');
            }

            if (eclipse.sd_partial && eclipse.sd_partial > 0) {
                details.partialDuration = Math.round(eclipse.sd_partial * 2);
                details.partialStart = moment(peak).subtract(eclipse.sd_partial, 'minutes').format('HH:mm');
                details.partialEnd = moment(peak).add(eclipse.sd_partial, 'minutes').format('HH:mm');
            }

            if (eclipse.sd_penum && eclipse.sd_penum > 0) {
                details.penumbralDuration = Math.round(eclipse.sd_penum * 2);
                details.penumbralStart = moment(peak).subtract(eclipse.sd_penum, 'minutes').format('HH:mm');
                details.penumbralEnd = moment(peak).add(eclipse.sd_penum, 'minutes').format('HH:mm');
            }

            // 月食は世界中で観測可能
            details.visibilityNote = '月が地平線上にある地域では世界中で観測できます。';
            details.observable = true;

        } else if (eventType.includes('日食')) {
            // 日食の詳細情報
            const peak = eclipse.peak.date || eclipse.peak;
            details.peakTime = moment(peak).format('YYYY年M月D日 HH:mm');

            // ユーザーの位置での日食の見え方を計算
            try {
                const observer = new Astronomy.Observer(observerLat, observerLon, 0);
                const localEclipse = Astronomy.SearchLocalSolarEclipse(peak, observer);

                if (localEclipse && localEclipse.kind !== 'none') {
                    details.observable = true;

                    // 観測可能な場合の詳細情報
                    const localKind = localEclipse.kind === 'total' ? '皆既日食' :
                                    localEclipse.kind === 'annular' ? '金環日食' :
                                    localEclipse.kind === 'partial' ? '部分日食' : '日食';
                    details.localType = localKind;

                    if (localEclipse.partial_begin) {
                        details.partialStart = moment(localEclipse.partial_begin.date).format('HH:mm');
                    }
                    if (localEclipse.total_begin) {
                        details.totalStart = moment(localEclipse.total_begin.date).format('HH:mm');
                    }
                    if (localEclipse.peak) {
                        details.localPeak = moment(localEclipse.peak.date).format('HH:mm');
                        details.obscuration = (localEclipse.obscuration * 100).toFixed(1);
                    }
                    if (localEclipse.total_end) {
                        details.totalEnd = moment(localEclipse.total_end.date).format('HH:mm');
                    }
                    if (localEclipse.partial_end) {
                        details.partialEnd = moment(localEclipse.partial_end.date).format('HH:mm');
                    }

                    details.visibilityNote = `現在の位置（緯度${observerLat.toFixed(2)}°、経度${observerLon.toFixed(2)}°）から観測できます。`;
                } else {
                    details.observable = false;
                    details.visibilityNote = '残念ながら、現在の位置からは観測できません。観測可能な地域は限定されています。';
                }
            } catch (error) {
                console.error('ローカル日食計算エラー:', error);
                details.observable = null;
                details.visibilityNote = '観測可能地域の詳細は計算できませんでしたが、日食が発生します。観測可能な地域は限定的です。';
            }
        }

        return details;
    } catch (error) {
        console.error('イベント詳細取得エラー:', error);
        return null;
    }
}

// 天文イベント詳細モーダルを開く
export function openEclipseDetailModal(eclipse, eventType) {
    const lat = AppState.location.lat || 35.6762;
    const lon = AppState.location.lon || 139.6503;

    const details = getEclipseDetails(eclipse, eventType, lat, lon);
    if (!details) {
        alert('詳細情報を取得できませんでした');
        return;
    }

    // モーダルに詳細情報を表示
    const modalContent = document.getElementById('eclipse-detail-content');

    let html = `
        <div class="space-y-4">
            <!-- イベントタイプ -->
            <div class="text-center">
                <h4 class="text-2xl font-bold text-yellow-300 mb-2">
                    ${eventType.includes('月食') ? '🌕' : '🌑'} ${eventType}
                </h4>
                <div class="text-lg text-white">${details.peakTime}</div>
            </div>
    `;

    // 観測可能性
    if (details.observable === true) {
        html += `
            <div class="bg-green-900/30 border border-green-700 rounded-lg p-3">
                <div class="flex items-center gap-2 text-green-300 mb-2">
                    <i data-lucide="check-circle" class="w-5 h-5"></i>
                    <span class="font-semibold">観測可能</span>
                </div>
                <div class="text-sm text-slate-300">${details.visibilityNote}</div>
            </div>
        `;
    } else if (details.observable === false) {
        html += `
            <div class="bg-red-900/30 border border-red-700 rounded-lg p-3">
                <div class="flex items-center gap-2 text-red-300 mb-2">
                    <i data-lucide="x-circle" class="w-5 h-5"></i>
                    <span class="font-semibold">現在地からは観測不可</span>
                </div>
                <div class="text-sm text-slate-300">${details.visibilityNote}</div>
            </div>
        `;
    } else {
        html += `
            <div class="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                <div class="flex items-center gap-2 text-blue-300 mb-2">
                    <i data-lucide="info" class="w-5 h-5"></i>
                    <span class="font-semibold">観測地域情報</span>
                </div>
                <div class="text-sm text-slate-300">${details.visibilityNote}</div>
            </div>
        `;
    }

    // 月食の詳細時刻
    if (eventType.includes('月食')) {
        html += `<div class="border-t border-slate-700 pt-3">
            <div class="text-sm font-semibold text-slate-300 mb-3">📅 食の経過</div>
            <div class="space-y-2">
        `;

        if (details.penumbralStart) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">半影食開始</span>
                        <span class="text-white font-semibold">${details.penumbralStart}</span>
                    </div>
                </div>
            `;
        }

        if (details.partialStart) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">部分食開始</span>
                        <span class="text-white font-semibold">${details.partialStart}</span>
                    </div>
                </div>
            `;
        }

        if (details.totalStart) {
            html += `
                <div class="bg-orange-900/30 border border-orange-700 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-orange-300 text-sm font-semibold">皆既食開始</span>
                        <span class="text-white font-bold">${details.totalStart}</span>
                    </div>
                </div>
            `;
        }

        html += `
            <div class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-2">
                <div class="flex justify-between items-center">
                    <span class="text-yellow-300 text-sm font-semibold">食の最大</span>
                    <span class="text-white font-bold">${moment(details.rawData.peak.date || details.rawData.peak).format('HH:mm')}</span>
                </div>
            </div>
        `;

        if (details.totalEnd) {
            html += `
                <div class="bg-orange-900/30 border border-orange-700 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-orange-300 text-sm font-semibold">皆既食終了</span>
                        <span class="text-white font-bold">${details.totalEnd}</span>
                    </div>
                </div>
            `;
        }

        if (details.partialEnd) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">部分食終了</span>
                        <span class="text-white font-semibold">${details.partialEnd}</span>
                    </div>
                </div>
            `;
        }

        if (details.penumbralEnd) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">半影食終了</span>
                        <span class="text-white font-semibold">${details.penumbralEnd}</span>
                    </div>
                </div>
            `;
        }

        html += `</div></div>`;

        // 継続時間の情報
        html += `
            <div class="border-t border-slate-700 pt-3">
                <div class="text-sm font-semibold text-slate-300 mb-3">⏱️ 継続時間</div>
                <div class="grid grid-cols-1 gap-2">
        `;

        if (details.totalDuration) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">皆既継続時間</span>
                        <span class="text-orange-300 font-semibold">${details.totalDuration}分</span>
                    </div>
                </div>
            `;
        }

        if (details.partialDuration) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">部分食継続時間</span>
                        <span class="text-white font-semibold">${details.partialDuration}分</span>
                    </div>
                </div>
            `;
        }

        if (details.penumbralDuration) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">半影食継続時間</span>
                        <span class="text-slate-400 font-semibold">${details.penumbralDuration}分</span>
                    </div>
                </div>
            `;
        }

        html += `</div></div>`;
    }

    // 日食の詳細時刻（観測可能な場合のみ）
    if (eventType.includes('日食') && details.observable) {
        html += `
            <div class="border-t border-slate-700 pt-3">
                <div class="text-sm font-semibold text-slate-300 mb-3">📅 現在地での食の経過</div>
                <div class="bg-blue-900/30 border border-blue-700 rounded-lg p-2 mb-2">
                    <div class="text-center text-blue-300 text-sm">
                        ${details.localType || eventType}
                    </div>
                </div>
                <div class="space-y-2">
        `;

        if (details.partialStart) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">部分食開始</span>
                        <span class="text-white font-semibold">${details.partialStart}</span>
                    </div>
                </div>
            `;
        }

        if (details.totalStart) {
            html += `
                <div class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-yellow-300 text-sm font-semibold">${details.localType === '金環日食' ? '金環開始' : '皆既開始'}</span>
                        <span class="text-white font-bold">${details.totalStart}</span>
                    </div>
                </div>
            `;
        }

        if (details.localPeak) {
            html += `
                <div class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-yellow-300 text-sm font-semibold">食の最大</span>
                        <span class="text-white font-bold">${details.localPeak}</span>
                    </div>
                </div>
            `;
        }

        if (details.obscuration) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">食分（欠ける割合）</span>
                        <span class="text-white font-semibold">${details.obscuration}%</span>
                    </div>
                </div>
            `;
        }

        if (details.totalEnd) {
            html += `
                <div class="bg-yellow-900/30 border border-yellow-700 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-yellow-300 text-sm font-semibold">${details.localType === '金環日食' ? '金環終了' : '皆既終了'}</span>
                        <span class="text-white font-bold">${details.totalEnd}</span>
                    </div>
                </div>
            `;
        }

        if (details.partialEnd) {
            html += `
                <div class="bg-slate-800/50 rounded-lg p-2">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-400 text-sm">部分食終了</span>
                        <span class="text-white font-semibold">${details.partialEnd}</span>
                    </div>
                </div>
            `;
        }

        html += `</div></div>`;
    }

    // 観測アドバイス
    html += `
        <div class="border-t border-slate-700 pt-3">
            <div class="text-sm font-semibold text-slate-300 mb-2">💡 観測アドバイス</div>
            <div class="text-xs text-slate-400 leading-relaxed space-y-1">
    `;

    if (eventType.includes('月食')) {
        html += `
            <p>• 月食は肉眼で観測できます。双眼鏡や望遠鏡があるとより詳細に観察できます。</p>
            <p>• 皆既月食では月が赤銅色に見えます（地球の大気による屈折光）。</p>
            <p>• 撮影する場合：三脚使用、ISO400-800、F5.6-8、露出は月の明るさに応じて調整（1/250秒〜数秒）。</p>
            <p>• 月が地平線上にある時間帯に観測してください。</p>
        `;
    } else if (eventType.includes('日食')) {
        if (details.observable) {
            html += `
                <p class="text-red-300 font-semibold">⚠️ 日食の観測には必ず日食グラスを使用してください！</p>
                <p>• 肉眼や通常のサングラス、カメラのファインダーで太陽を直視すると失明の危険があります。</p>
                <p>• 日食グラスは天文ショップやオンラインで入手できます（ISO 12312-2準拠品）。</p>
                <p>• 撮影する場合は必ず太陽撮影用NDフィルター（ND100000相当）を使用してください。</p>
            `;

            if (details.localType === '皆既日食' && details.totalStart && details.totalEnd) {
                html += `
                    <p class="text-yellow-300">• 皆既中（${details.totalStart}〜${details.totalEnd}）のみ、安全にフィルターなしで観測・撮影できます。</p>
                `;
            }
        } else {
            html += `
                <p>• この日食は現在の位置からは観測できませんが、インターネット中継で視聴できる可能性があります。</p>
                <p>• 観測可能な地域への遠征を計画される場合は、事前に現地の天候や観測条件を調べましょう。</p>
            `;
        }
    }

    html += `
            </div>
        </div>
    </div>
    `;

    modalContent.innerHTML = html;

    // Lucideアイコンを再描画
    lucide.createIcons();

    // モーダルを表示
    document.getElementById('eclipse-detail-modal').classList.remove('hidden');
}

// 天文イベント詳細モーダルを閉じる
export function closeEclipseDetailModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('eclipse-detail-modal').classList.add('hidden');
}

export function updateAstronomicalEvents(targetDate) {
    const container = document.getElementById('astronomical-events');
    const events = [];

    try {
        const searchStart = new Date(targetDate.getTime() - 180 * 24 * 60 * 60 * 1000); // 180日前
        const searchEnd = new Date(targetDate.getTime() + 180 * 24 * 60 * 60 * 1000);   // 180日後

        // 月食の検索（改善版：無限ループ防止とエラーハンドリング）
        try {
            let lunarEclipse = Astronomy.SearchLunarEclipse(searchStart);
            const lunarEclipses = [];
            let loopCount = 0;
            const MAX_ITERATIONS = 20; // 180日間で最大20回の月食は起こりえない

            console.log('月食検索開始:', {
                searchStart: searchStart,
                searchEnd: searchEnd,
                firstEclipse: lunarEclipse ? lunarEclipse.peak : 'なし'
            });

            while (lunarEclipse && loopCount < MAX_ITERATIONS) {
                // peak は AstroTime オブジェクトなので、.date プロパティで Date に変換
                const peakDate = lunarEclipse.peak.date || lunarEclipse.peak;

                console.log(`月食 ${loopCount + 1}:`, {
                    peak: peakDate,
                    kind: lunarEclipse.kind,
                    inRange: peakDate >= searchStart && peakDate < searchEnd
                });

                if (peakDate >= searchEnd) {
                    // 検索範囲を超えたので終了
                    break;
                }

                if (peakDate >= searchStart) {
                    lunarEclipses.push(lunarEclipse);
                }

                lunarEclipse = Astronomy.NextLunarEclipse(lunarEclipse.peak);
                loopCount++;
            }

            if (loopCount >= MAX_ITERATIONS) {
                console.warn('月食検索が最大反復回数に達しました');
            }

            console.log('検出された月食の数:', lunarEclipses.length);

            // 月食を追加（継続時間情報を含む）
            lunarEclipses.forEach(eclipse => {
                // peak.date で Date オブジェクトを取得
                const peakDate = moment(eclipse.peak.date || eclipse.peak);
                const typeText = eclipse.kind === 'total' ? '皆既月食' :
                               eclipse.kind === 'partial' ? '部分月食' : '半影月食';
                const daysUntil = peakDate.diff(moment(targetDate), 'days');
                const timeText = daysUntil === 0 ? '今日' :
                               daysUntil > 0 ? `${daysUntil}日後` : `${-daysUntil}日前`;

                // 継続時間を計算（sd_*は半継続時間なので2倍する）
                let duration = '';
                if (eclipse.sd_total && eclipse.sd_total > 0) {
                    duration = `皆既継続時間: 約${Math.round(eclipse.sd_total * 2)}分`;
                } else if (eclipse.sd_partial && eclipse.sd_partial > 0) {
                    duration = `部分継続時間: 約${Math.round(eclipse.sd_partial * 2)}分`;
                } else if (eclipse.sd_penum && eclipse.sd_penum > 0) {
                    duration = `半影継続時間: 約${Math.round(eclipse.sd_penum * 2)}分`;
                }

                events.push({
                    date: peakDate,
                    type: typeText,
                    time: peakDate.format('M月D日 HH:mm'),
                    daysUntil: daysUntil,
                    timeText: timeText,
                    icon: '🌕',
                    color: 'orange',
                    duration: duration,
                    note: '世界中の広い範囲で観測可能',
                    rawData: eclipse
                });
            });
        } catch (error) {
            console.error('月食検索エラー:', error);
            // 月食のエラーでも日食検索は続行
        }

        // 日食の検索（改善版：無限ループ防止とエラーハンドリング）
        try {
            let solarEclipse = Astronomy.SearchGlobalSolarEclipse(searchStart);
            const solarEclipses = [];
            let loopCount = 0;
            const MAX_ITERATIONS = 20; // 180日間で最大20回の日食は起こりえない

            console.log('日食検索開始:', {
                searchStart: searchStart,
                searchEnd: searchEnd,
                firstEclipse: solarEclipse ? solarEclipse.peak : 'なし'
            });

            while (solarEclipse && loopCount < MAX_ITERATIONS) {
                // peak は AstroTime オブジェクトなので、.date プロパティで Date に変換
                const peakDate = solarEclipse.peak.date || solarEclipse.peak;

                console.log(`日食 ${loopCount + 1}:`, {
                    peak: peakDate,
                    kind: solarEclipse.kind,
                    inRange: peakDate >= searchStart && peakDate < searchEnd
                });

                if (peakDate >= searchEnd) {
                    // 検索範囲を超えたので終了
                    break;
                }

                if (peakDate >= searchStart) {
                    solarEclipses.push(solarEclipse);
                }

                solarEclipse = Astronomy.NextGlobalSolarEclipse(solarEclipse.peak);
                loopCount++;
            }

            if (loopCount >= MAX_ITERATIONS) {
                console.warn('日食検索が最大反復回数に達しました');
            }

            console.log('検出された日食の数:', solarEclipses.length);

            // 日食を追加（現在地での観測可能性をチェック）
            const observerLat = AppState.location.lat || 35.6762;
            const observerLon = AppState.location.lon || 139.6503;
            const observer = new Astronomy.Observer(observerLat, observerLon, 0);

            solarEclipses.forEach(eclipse => {
                // peak.date で Date オブジェクトを取得
                const peakDate = moment(eclipse.peak.date || eclipse.peak);
                const typeText = eclipse.kind === 'total' ? '皆既日食' :
                               eclipse.kind === 'annular' ? '金環日食' :
                               eclipse.kind === 'partial' ? '部分日食' : '日食';
                const daysUntil = peakDate.diff(moment(targetDate), 'days');
                const timeText = daysUntil === 0 ? '今日' :
                               daysUntil > 0 ? `${daysUntil}日後` : `${-daysUntil}日前`;

                // 現在地での観測可能性をチェック
                let isObservable = false;
                try {
                    // 現在地での太陽の高度をチェック
                    const sunEquator = Astronomy.Equator('Sun', eclipse.peak.date || eclipse.peak, observer, true, true);
                    const sunHorizon = Astronomy.Horizon(eclipse.peak.date || eclipse.peak, observer, sunEquator.ra, sunEquator.dec, 'normal');

                    // 太陽が地平線上にある場合のみ観測可能
                    if (sunHorizon.altitude > 0) {
                        // さらに、現地で日食が起こるかをチェック
                        const localEclipse = Astronomy.SearchLocalSolarEclipse(eclipse.peak.date || eclipse.peak, observer);
                        if (localEclipse && localEclipse.kind !== 'none') {
                            isObservable = true;
                        }
                    }
                } catch (error) {
                    console.warn('日食の観測可能性チェックエラー:', error);
                    // エラーの場合は表示しない（安全側に倒す）
                }

                // 観測可能な日食のみを表示
                if (isObservable) {
                    events.push({
                        date: peakDate,
                        type: typeText,
                        time: peakDate.format('M月D日 HH:mm'),
                        daysUntil: daysUntil,
                        timeText: timeText,
                        icon: '🌑',
                        color: 'yellow',
                        note: '現在地から観測可能',
                        rawData: eclipse
                    });
                }
            });
        } catch (error) {
            console.error('日食検索エラー:', error);
            // 日食のエラーがあってもイベント表示は続行
        }

        // 過去のイベントを除外し、未来のイベントのみを表示
        const futureEvents = events.filter(event => event.daysUntil >= 0);

        // 日付順にソート：直近のものから表示
        futureEvents.sort((a, b) => a.date - b.date);

        // 表示
        if (futureEvents.length === 0) {
            container.innerHTML = '<div class="text-slate-400 text-xs">今後180日間に予定されている月食・日食はありません。</div>';
        } else {
            // Tailwind CDNでは動的クラス生成ができないため、固定クラスを使用
            const colorStyles = {
                orange: { bg: 'bg-orange-900/30', text: 'text-orange-300' },
                yellow: { bg: 'bg-yellow-900/30', text: 'text-yellow-300' }
            };

            container.innerHTML = futureEvents.map((event, index) => {
                const style = colorStyles[event.color] || colorStyles.yellow;

                // イベントデータをグローバルに保存（クリック時に使用）
                if (!window.eclipseEvents) window.eclipseEvents = [];
                window.eclipseEvents[index] = event.rawData;

                return `
                    <div class="${style.bg} rounded-lg p-2 cursor-pointer hover:bg-opacity-80 transition-all border border-transparent hover:border-${event.color}-500"
                         onclick="openEclipseDetailModal(window.eclipseEvents[${index}], '${event.type}')">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold ${style.text}">${event.icon} ${event.type}</span>
                            <span class="text-xs ${style.text}">${event.timeText}</span>
                        </div>
                        <div class="text-xs text-slate-400 mt-1">${event.time}</div>
                        ${event.duration ? `<div class="text-xs text-slate-300 mt-1">⏱️ ${event.duration}</div>` : ''}
                        ${event.note ? `<div class="text-xs text-slate-400 mt-1">📍 ${event.note}</div>` : ''}
                        ${event.daysUntil <= 30 ? '<div class="text-xs text-yellow-300 mt-1">⭐ 近日開催</div>' : ''}
                        <div class="text-xs text-slate-500 mt-2 flex items-center gap-1">
                            <i data-lucide="info" class="w-3 h-3"></i>
                            <span>クリックして詳細を表示</span>
                        </div>
                    </div>
                `;
            }).join('');

            // Lucideアイコンを再描画
            lucide.createIcons();
        }
    } catch (error) {
        console.error('天文イベント計算エラー:', error);
        container.innerHTML = '<div class="text-red-400 text-xs">天文イベントの計算中にエラーが発生しました</div>';
    }
}
