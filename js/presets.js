/**
 * Arena Presets and Seed Data
 * Covers PUBG Esports, HackerRank Coding Contest, and BYJU'S All-India Olympiad
 */

const ARENA_PRESETS = {
  pubg: {
    id: 'pubg',
    title: 'PUBG Global Invitational - Squad Arena',
    detailLabel: 'Kills / DMG',
    accentColor: '#f59e0b',
    players: [
      { id: 'p1', name: 'ApexSniper', score: 9850, detail: '24 Kills • 3.4k Dmg', avatar: '🎯', squad: 'SOUL' },
      { id: 'p2', name: 'Valkyrie_X', score: 9420, detail: '21 Kills • 2.9k Dmg', avatar: '⚡', squad: 'FAZE' },
      { id: 'p3', name: 'ShadowReaper', score: 9180, detail: '19 Kills • 2.7k Dmg', avatar: '💀', squad: 'NAVI' },
      { id: 'p4', name: 'ShroudClone', score: 8850, detail: '17 Kills • 2.4k Dmg', avatar: '🕶️', squad: 'SENTINELS' },
      { id: 'p5', name: 'MortalStriker', score: 8640, detail: '16 Kills • 2.2k Dmg', avatar: '🔥', squad: 'SOUL' },
      { id: 'p6', name: 'NeonNinja', score: 8390, detail: '15 Kills • 2.1k Dmg', avatar: '🥷', squad: 'GODLIKE' },
      { id: 'p7', name: 'PhantomGhost', score: 8120, detail: '13 Kills • 1.9k Dmg', avatar: '👻', squad: 'FNATIC' },
      { id: 'p8', name: 'FrostBite', score: 7890, detail: '12 Kills • 1.8k Dmg', avatar: '❄️', squad: 'T1' },
      { id: 'p9', name: 'NovaBlast', score: 7650, detail: '11 Kills • 1.6k Dmg', avatar: '💥', squad: 'GEN.G' },
      { id: 'p10', name: 'CyberWolf', score: 7420, detail: '10 Kills • 1.5k Dmg', avatar: '🐺', squad: 'LIQUID' },
      { id: 'p11', name: 'VortexRider', score: 7150, detail: '9 Kills • 1.4k Dmg', avatar: '🌪️', squad: 'OPTIC' },
      { id: 'p12', name: 'ThunderHawk', score: 6890, detail: '8 Kills • 1.2k Dmg', avatar: '🦅', squad: 'G2' }
    ]
  },
  hackerrank: {
    id: 'hackerrank',
    title: 'HackerRank World Coding Championship',
    detailLabel: 'Solved / Penalty',
    accentColor: '#10b981',
    players: [
      { id: 'hr1', name: 'tourist_fan', score: 9940, detail: '6/6 AC • 42 mins', avatar: '💻', squad: 'RATING 3200' },
      { id: 'hr2', name: 'BinaryBeast', score: 9550, detail: '6/6 AC • 58 mins', avatar: '🤖', squad: 'GRANDMASTER' },
      { id: 'hr3', name: 'DynamicCoder', score: 9230, detail: '5/6 AC • 35 mins', avatar: '🧩', squad: 'MASTER' },
      { id: 'hr4', name: 'GraphMaster', score: 8910, detail: '5/6 AC • 48 mins', avatar: '🕸️', squad: 'CANDIDATE' },
      { id: 'hr5', name: 'BitwiseNinja', score: 8670, detail: '5/6 AC • 65 mins', avatar: '🔢', squad: 'EXPERT' },
      { id: 'hr6', name: 'RecursionQueen', score: 8350, detail: '4/6 AC • 29 mins', avatar: '👑', squad: 'EXPERT' },
      { id: 'hr7', name: 'SegmentTreeAce', score: 8100, detail: '4/6 AC • 41 mins', avatar: '🌲', squad: 'SPECIALIST' },
      { id: 'hr8', name: 'FastFourier', score: 7780, detail: '4/6 AC • 55 mins', avatar: '🌊', squad: 'SPECIALIST' },
      { id: 'hr9', name: 'TrieHero', score: 7520, detail: '3/6 AC • 22 mins', avatar: '🦸', squad: 'PUPIL' },
      { id: 'hr10', name: 'HeapSorcerer', score: 7300, detail: '3/6 AC • 34 mins', avatar: '🧙', squad: 'PUPIL' },
      { id: 'hr11', name: 'DijkstraRunner', score: 7040, detail: '3/6 AC • 49 mins', avatar: '🏃', squad: 'NEWBIE' },
      { id: 'hr12', name: 'GreedyGeek', score: 6790, detail: '2/6 AC • 18 mins', avatar: '🤓', squad: 'NEWBIE' }
    ]
  },
  byjus: {
    id: 'byjus',
    title: "BYJU'S All-India National Olympiad",
    detailLabel: 'Accuracy / Time',
    accentColor: '#8b5cf6',
    players: [
      { id: 'bj1', name: 'Aarav_Sharma', score: 9910, detail: '98% Acc • 14.2s/Q', avatar: '🎓', squad: 'DELHI • GR 10' },
      { id: 'bj2', name: 'Diya_Patel', score: 9630, detail: '95% Acc • 15.1s/Q', avatar: '🌟', squad: 'MUMBAI • GR 10' },
      { id: 'bj3', name: 'Rohan_Verma', score: 9340, detail: '93% Acc • 16.4s/Q', avatar: '🏆', squad: 'BENGALURU • GR 10' },
      { id: 'bj4', name: 'Ananya_Iyer', score: 9020, detail: '91% Acc • 17.0s/Q', avatar: '📚', squad: 'CHENNAI • GR 9' },
      { id: 'bj5', name: 'Ishaan_Reddy', score: 8750, detail: '89% Acc • 18.2s/Q', avatar: '💡', squad: 'HYDERABAD • GR 10' },
      { id: 'bj6', name: 'Saanvi_Gupta', score: 8460, detail: '88% Acc • 19.5s/Q', avatar: '✨', squad: 'PUNE • GR 9' },
      { id: 'bj7', name: 'Kabir_Mehta', score: 8190, detail: '86% Acc • 20.1s/Q', avatar: '🚀', squad: 'KOLKATA • GR 10' },
      { id: 'bj8', name: 'Pooja_Nair', score: 7920, detail: '84% Acc • 21.0s/Q', avatar: '🎯', squad: 'KOCHI • GR 9' },
      { id: 'bj9', name: 'Aditya_Singh', score: 7680, detail: '82% Acc • 22.4s/Q', avatar: '🏅', squad: 'JAIPUR • GR 10' },
      { id: 'bj10', name: 'Meera_Joshi', score: 7390, detail: '80% Acc • 23.5s/Q', avatar: '🌺', squad: 'AHMEDABAD • GR 9' },
      { id: 'bj11', name: 'Vihaan_Rao', score: 7120, detail: '78% Acc • 24.2s/Q', avatar: '🔬', squad: 'CHANDIGARH • GR 10' },
      { id: 'bj12', name: 'Tanvi_Kulkarni', score: 6850, detail: '76% Acc • 25.1s/Q', avatar: '🎨', squad: 'NAGPUR • GR 9' }
    ]
  }
};

window.ARENA_PRESETS = ARENA_PRESETS;
