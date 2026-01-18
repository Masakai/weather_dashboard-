/**
 * メインルーチン
 */

import { AppState } from './state.js?v=3.2.2';
import * as uiUtils from './ui-utils.js?v=3.2.2';
import * as locationService from './location-service.js?v=3.2.2';
import * as weatherService from './weather-service.js?v=3.2.2';
import * as issService from './iss-service.js?v=3.2.2';
import * as astronomyService from './astronomy-service.js?v=3.2.2';

// 全ての関数をマージしてグローバルスコープに登録（互換性維持のため）
const allFunctions = {
    ...uiUtils,
    ...locationService,
    ...weatherService,
    ...issService,
    ...astronomyService
};

Object.keys(allFunctions).forEach(key => {
    window[key] = allFunctions[key];
});

window.AppState = AppState;

// --- 初期設定 ---
lucide.createIcons();
moment.locale('ja'); 

if (localStorage.getItem('nightVisionMode') === 'true') {
    document.body.classList.add('night-vision');
}
setInterval(() => {
    const clockEl = document.getElementById('current-clock');
    if (clockEl) clockEl.textContent = moment().format('HH:mm:ss');
}, 1000);

window.addEventListener('load', () => {
    locationService.renderFavoriteLocations();
    locationService.getCurrentLocation(true); 
});

(function() {
    if ('Notification' in window) {
        AppState.iss.notificationPermission = Notification.permission;
    }
    window.addEventListener('beforeunload', () => {
        issService.stopISSNotificationCheck();
    });
})();
