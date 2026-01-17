import { AppState } from './state.js?v=3.1.8';
import { METEOR_SHOWERS, SEASONAL_OBJECTS } from './constants.js?v=3.1.8';

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
// XSS対策: HTMLエスケープ関数
export function escapeHtml(text) {
    if (text === undefined || text === null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}