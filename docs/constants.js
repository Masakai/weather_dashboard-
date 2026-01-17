/**
 * アプリケーション共通の定数データ
 */

export const METEOR_SHOWERS = [
    { name: "しぶんぎ座流星群", peakStart: "01-03", peakEnd: "01-04", rate: "120個/時", note: "年始の三大流星群" },
    { name: "こと座流星群", peakStart: "04-22", peakEnd: "04-23", rate: "18個/時", note: "安定した流星群" },
    { name: "みずがめ座η流星群", peakStart: "05-06", peakEnd: "05-07", rate: "50個/時", note: "南半球で好条件" },
    { name: "ペルセウス座流星群", peakStart: "08-12", peakEnd: "08-13", rate: "100個/時", note: "三大流星群の一つ" },
    { name: "オリオン座流星群", peakStart: "10-21", peakEnd: "10-22", rate: "20個/時", note: "ハレー彗星起源" },
    { name: "しし座流星群", peakStart: "11-17", peakEnd: "11-18", rate: "15個/時", note: "33年周期で大出現" },
    { name: "ふたご座流星群", peakStart: "12-13", peakEnd: "12-14", rate: "120個/時", note: "三大流星群の一つ" },
    { name: "こぐま座流星群", peakStart: "12-22", peakEnd: "12-23", rate: "10個/時", note: "安定した観測" }
];

export const SEASONAL_OBJECTS = {
    spring: {
        newMoon: [
            { name: 'しし座銀河群 (M65, M66)', type: '銀河', reason: '春の銀河シーズン、暗い夜空で最適' },
            { name: 'M51 子持ち銀河', type: '銀河', reason: '渦巻き構造が美しい春の代表的銀河' },
            { name: 'かみのけ座銀河団', type: '銀河団', reason: '多数の銀河を一度に観測できる' }
        ],
        bright: [
            { name: '月面観測', type: '月', reason: '月の海と高地のコントラスト' },
            { name: 'しし座の二重星', type: '恒星', reason: '明るい星なら月明かりでも観測可' },
            { name: '木星・土星', type: '惑星', reason: '月明かりの影響を受けにくい' }
        ]
    },
    summer: {
        newMoon: [
            { name: 'M8 干潟星雲', type: '星雲', reason: '夏の天の川の美しい散光星雲' },
            { name: 'M20 三裂星雲', type: '星雲', reason: '赤と青の対比が美しい' },
            { name: 'M13 ヘルクレス座球状星団', type: '球状星団', reason: '北天最大級の球状星団' }
        ],
        bright: [
            { name: '月面観測', type: '月', reason: 'クレーターの詳細観測に最適' },
            { name: '二重星アルビレオ', type: '恒星', reason: '金色と青の美しい対比' },
            { name: '土星の環', type: '惑星', reason: '夏は土星観測の好機' }
        ]
    },
    autumn: {
        newMoon: [
            { name: 'M31 アンドロメダ銀河', type: '銀河', reason: '秋の夜長に最適な大型銀河' },
            { name: 'M33 さんかく座銀河', type: '銀河', reason: '暗い夜空で淡い姿が美しい' },
            { name: 'NGC7000 北アメリカ星雲', type: '星雲', reason: '秋の天の川沿いの大型星雲' }
        ],
        bright: [
            { name: '月面観測', type: '月', reason: '秋の安定した大気で鮮明に観測' },
            { name: 'アルマク（二重星）', type: '恒星', reason: 'アンドロメダ座の美しい二重星' },
            { name: '天王星', type: '惑星', reason: '秋は天王星が観測しやすい' }
        ]
    },
    winter: {
        newMoon: [
            { name: 'M42 オリオン大星雲', type: '星雲', reason: '冬の代表的な散光星雲、新月期が最適' },
            { name: 'M45 プレアデス星団', type: '散開星団', reason: '冬の青白い宝石箱' },
            { name: 'バラ星雲 (NGC2237)', type: '星雲', reason: '冬の淡い散光星雲' }
        ],
        bright: [
            { name: '月面観測', type: '月', reason: '冬の澄んだ空気で高解像度観測' },
            { name: 'シリウス伴星', type: '恒星', reason: '冬の大気の安定性で挑戦' },
            { name: '木星の大赤斑', type: '惑星', reason: '冬は木星観測の好シーズン' }
        ]
    }
};
