/**
 * アプリケーションの状態管理オブジェクト
 */
export const AppState = {
    location: {
        lat: 35.1167,
        lon: 138.9167,
        favoriteLocations: JSON.parse(localStorage.getItem('favoriteLocations') || '[]')
    },
    weather: {
        data: null,
        selectedDatetime: null // 現在選択されている日時
    },
    iss: {
        tle: null,
        marker: null,
        interval: null,
        calculatedPasses: [],
        notifiedPasses: new Set(), // 通知済みのパスを記録
        notificationInterval: null, // ISS通知チェック用interval
        notificationPermission: 'default', // 通知権限の状態
        isRealtimeMode: false // 星座図のリアルタイム更新モードか
    },
    ui: {
        map: null,
        marker: null,
        charts: {
            temp: null,
            cloud: null,
            radar: null
        },
        skymapUpdateInterval: null // 星座図のリアルタイム更新用interval
    }
};
