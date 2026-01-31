import { AppState } from './state.js?v=3.3.8';
import { METEOR_SHOWERS, SEASONAL_OBJECTS } from './constants.js?v=3.3.8';

export function toggleNightVision() {
    document.body.classList.toggle('night-vision');
    const isNight = document.body.classList.contains('night-vision');
    localStorage.setItem('nightVisionMode', isNight);
}
export function toggleAccordion(id) {
    const content = document.getElementById('content-' + id);
    const icon = document.getElementById('icon-' + id);

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        content.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
}
export function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-menu-overlay');
    if (menu && overlay) {
        menu.classList.toggle('active');
        overlay.classList.toggle('hidden');
    }
}
export function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        toggleMenu();
        // 少し遅延させてメニューが閉じるアニメーションと重ならないようにするか、
        // あるいは即座に実行する。
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}
// XSS対策: HTMLエスケープ関数
export function escapeHtml(text) {
    if (text === undefined || text === null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}