import fs from 'fs';
import path from 'path';

const outDir = 'public/images/covers';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper to write SVG
function writeSvg(filename, content) {
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, content.trim(), 'utf8');
  console.log(`Generated: ${filePath}`);
}

// 1. Carol of the Bells - Golden Cathedral Bells in Winter Midnight
writeSvg('carol-of-the-bells.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bg" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#0f2b2b" />
      <stop offset="50%" stop-color="#071717" />
      <stop offset="100%" stop-color="#020808" />
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#854d0e" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="aurora" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.2" />
      <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.1" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)" />
  <path d="M0,150 Q150,80 300,120 T600,100 L600,280 L0,280 Z" fill="url(#aurora)" filter="blur(20px)" />
  
  <!-- Snow Stars -->
  <g fill="#ffffff" opacity="0.7">
    <circle cx="80" cy="90" r="2" />
    <circle cx="140" cy="50" r="1.5" />
    <circle cx="220" cy="110" r="2.5" />
    <circle cx="380" cy="70" r="1.5" />
    <circle cx="480" cy="120" r="2" />
    <circle cx="530" cy="60" r="1" />
    <circle cx="90" cy="220" r="1.5" />
    <circle cx="520" cy="240" r="2" />
    <circle cx="310" cy="40" r="3" />
  </g>

  <!-- Glowing Bells -->
  <circle cx="300" cy="280" r="160" fill="url(#glow)" />
  
  <!-- Big Bell Silhouette -->
  <path d="M300,170 C280,170 240,210 230,280 C220,350 200,370 190,380 L410,380 C400,370 380,350 370,280 C360,210 320,170 300,170 Z" fill="url(#gold)" />
  <ellipse cx="300" cy="380" rx="110" ry="16" fill="#ca8a04" />
  <circle cx="300" cy="400" r="18" fill="#713f12" />
  
  <!-- Acoustic Soundwaves -->
  <circle cx="300" cy="280" r="190" fill="none" stroke="#facc15" stroke-width="1.5" stroke-dasharray="8 12" opacity="0.3" />
  <circle cx="300" cy="280" r="230" fill="none" stroke="#facc15" stroke-width="1" stroke-dasharray="4 8" opacity="0.2" />

  <!-- Frost Pines at Base -->
  <path d="M0,600 L0,500 L60,440 L120,520 L180,430 L240,510 L300,420 L360,510 L420,440 L480,530 L540,450 L600,520 L600,600 Z" fill="#041212" />
  <text x="300" y="520" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="4">CAROL OF THE BELLS</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#38bdf8" text-anchor="middle" letter-spacing="2">UKRAINIAN BELL MOTIF • 1914</text>
</svg>
`);

// 2. Sia - Snowman
writeSvg('sia-snowman.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgSnow" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="60%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="warmLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgSnow)" />
  
  <!-- Big Frost Moon -->
  <circle cx="300" cy="220" r="140" fill="url(#moonGlow)" />
  <circle cx="300" cy="220" r="85" fill="#f8fafc" opacity="0.95" />
  
  <!-- Snow Hills -->
  <ellipse cx="150" cy="520" rx="260" ry="120" fill="#334155" opacity="0.6" />
  <ellipse cx="450" cy="540" rx="280" ry="130" fill="#1e293b" />
  
  <!-- Whimsical Snowman -->
  <!-- Bottom body -->
  <circle cx="300" cy="380" r="75" fill="#f1f5f9" />
  <!-- Middle body -->
  <circle cx="300" cy="285" r="55" fill="#f8fafc" />
  <!-- Head -->
  <circle cx="300" cy="205" r="40" fill="#ffffff" />
  
  <!-- Coal eyes & smile -->
  <circle cx="288" cy="198" r="4" fill="#0f172a" />
  <circle cx="312" cy="198" r="4" fill="#0f172a" />
  <!-- Carrot nose -->
  <polygon points="300,206 335,212 300,214" fill="#f97316" />
  
  <!-- Cozy Scarf -->
  <path d="M270,235 C285,250 315,250 330,235 C335,245 325,255 310,255 L310,310 L290,310 L290,255 C275,255 265,245 270,235 Z" fill="#e11d48" />
  <!-- Top Hat -->
  <rect x="270" y="165" width="60" height="10" rx="3" fill="#020617" />
  <rect x="280" y="125" width="40" height="40" rx="4" fill="#0f172a" />
  <rect x="280" y="155" width="40" height="6" fill="#e11d48" />

  <!-- Falling Snow flakes -->
  <g fill="#ffffff" opacity="0.8">
    <circle cx="100" cy="120" r="3" />
    <circle cx="180" cy="80" r="2" />
    <circle cx="450" cy="110" r="3.5" />
    <circle cx="500" cy="180" r="2" />
    <circle cx="120" cy="340" r="2.5" />
    <circle cx="490" cy="320" r="3" />
    <circle cx="230" cy="390" r="2" />
    <circle cx="390" cy="400" r="2.5" />
  </g>

  <text x="300" y="520" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="#ffffff" text-anchor="middle" letter-spacing="3">SNOWMAN</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#f43f5e" text-anchor="middle" letter-spacing="2">SIA • DIRECT TAKT 20 EDITION</text>
</svg>
`);

// 3. Yiruma - River Flows in You
writeSvg('river-flows-in-you.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bgRiver" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#021024" />
      <stop offset="50%" stop-color="#052659" />
      <stop offset="100%" stop-color="#020914" />
    </linearGradient>
    <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7bf1a8" />
      <stop offset="50%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <radialGradient id="waterGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgRiver)" />
  
  <!-- Glowing Moon & Ripples -->
  <circle cx="300" cy="180" r="160" fill="url(#waterGlow)" />
  <circle cx="300" cy="180" r="50" fill="#e0f2fe" opacity="0.9" />

  <!-- Lyrical River Path curving like musical stave -->
  <path d="M-50,480 C150,460 180,360 260,320 C340,280 370,250 400,210 C430,170 520,180 650,150 L650,600 L-50,600 Z" fill="url(#waterFlow)" opacity="0.85" />
  <path d="M-50,520 C180,500 220,400 300,360 C380,320 420,290 460,230 C500,190 560,190 650,180" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.6" />
  <path d="M-50,550 C190,530 250,430 330,390 C410,350 450,310 500,260 C550,220 590,210 650,200" fill="none" stroke="#7bf1a8" stroke-width="1.5" opacity="0.7" />

  <!-- Grand Piano on Riverside Cliff -->
  <g transform="translate(140, 220) scale(0.7)">
    <path d="M50,100 C70,40 140,30 220,50 C250,90 260,150 240,200 L60,200 Z" fill="#020914" />
    <!-- Piano lid prop -->
    <line x1="90" y1="90" x2="160" y2="20" stroke="#38bdf8" stroke-width="3" />
    <!-- Keyboard strip -->
    <rect x="60" y="195" width="180" height="12" fill="#ffffff" />
    <!-- Leg 1 -->
    <line x1="80" y1="200" x2="80" y2="280" stroke="#020914" stroke-width="6" />
    <!-- Leg 2 -->
    <line x1="220" y1="200" x2="220" y2="280" stroke="#020914" stroke-width="6" />
  </g>

  <!-- Water Droplets / Floating Note Orbs -->
  <circle cx="280" cy="300" r="5" fill="#ffffff" filter="drop-shadow(0 0 8px #38bdf8)" />
  <circle cx="340" cy="270" r="4" fill="#ffffff" filter="drop-shadow(0 0 8px #7bf1a8)" />
  <circle cx="420" cy="240" r="6" fill="#ffffff" filter="drop-shadow(0 0 10px #38bdf8)" />

  <text x="300" y="525" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="3">RIVER FLOWS IN YOU</text>
  <text x="300" y="560" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#7dd3fc" text-anchor="middle" letter-spacing="2">YIRUMA • FIRST LOVE</text>
</svg>
`);

// 4. Liszt - La Campanella
writeSvg('liszt-la-campanella.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgLiszt" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#450a0a" />
      <stop offset="50%" stop-color="#1c0404" />
      <stop offset="100%" stop-color="#050101" />
    </radialGradient>
    <linearGradient id="fireBravura" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="30%" stop-color="#f59e0b" />
      <stop offset="70%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#7f1d1d" />
    </linearGradient>
    <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#fbbf24" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgLiszt)" />

  <!-- Concert Hall Chandelier Glow -->
  <circle cx="300" cy="230" r="180" fill="url(#sparkGlow)" />

  <!-- Virtuosic Golden Little Bell (La Campanella) -->
  <path d="M300,120 C275,120 220,170 210,260 C200,340 170,360 160,370 L440,370 C430,360 400,340 390,260 C380,170 325,120 300,120 Z" fill="url(#fireBravura)" />
  <ellipse cx="300" cy="370" rx="140" ry="20" fill="#b45309" />
  <circle cx="300" cy="400" r="22" fill="#78350f" />

  <!-- Lightning Bravura Leaps (Two Octaves Trill Rays) -->
  <g stroke="#fef08a" stroke-width="2" opacity="0.8">
    <line x1="300" y1="120" x2="220" y2="40" />
    <line x1="300" y1="120" x2="380" y2="40" />
    <line x1="300" y1="120" x2="440" y2="80" />
    <line x1="300" y1="120" x2="160" y2="80" />
    <line x1="210" y1="260" x2="90" y2="240" />
    <line x1="390" y1="260" x2="510" y2="240" />
  </g>

  <!-- Sparks & Particles -->
  <g fill="#fde047">
    <polygon points="300,70 305,85 320,90 305,95 300,110 295,95 280,90 295,85" />
    <polygon points="210,80 213,90 225,93 213,97 210,108 207,97 195,93 207,90" />
    <polygon points="390,80 393,90 405,93 393,97 390,108 387,97 375,93 387,90" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff" text-anchor="middle" letter-spacing="4">LA CAMPANELLA</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#f59e0b" text-anchor="middle" letter-spacing="2">FRANZ LISZT • PAGANINI ETUDE NO. 3</text>
</svg>
`);

// 5. Kensuke Ushio - In the Sea (Chainsaw Man)
writeSvg('kensuke-ushio-in-the-sea.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bgSea" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="35%" stop-color="#0369a1" />
      <stop offset="70%" stop-color="#082f49" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <radialGradient id="sunbeam" cx="50%" cy="0%" r="90%">
      <stop offset="0%" stop-color="#e0f2fe" stop-opacity="0.6" />
      <stop offset="40%" stop-color="#38bdf8" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#0369a1" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgSea)" />
  <rect width="600" height="600" fill="url(#sunbeam)" />

  <!-- Submerged Sunbeams -->
  <polygon points="200,0 260,0 340,420 180,420" fill="#ffffff" opacity="0.08" />
  <polygon points="360,0 420,0 520,380 410,380" fill="#ffffff" opacity="0.06" />

  <!-- Cinematic Solitude Silhouette (Floating Figure / Piano in the deep blue) -->
  <g transform="translate(230, 260)" fill="#020617">
    <!-- Grand Piano submerged in deep stillness -->
    <path d="M20,60 C40,20 100,10 160,30 C180,60 190,100 170,140 L20,140 Z" />
    <rect x="20" y="135" width="150" height="8" fill="#38bdf8" opacity="0.8" />
  </g>

  <!-- Bubbles floating to surface -->
  <g fill="none" stroke="#7dd3fc" stroke-width="1.5" opacity="0.7">
    <circle cx="280" cy="220" r="8" />
    <circle cx="295" cy="180" r="14" />
    <circle cx="310" cy="130" r="10" />
    <circle cx="330" cy="90" r="18" />
    <circle cx="315" cy="50" r="12" />
    <circle cx="220" cy="190" r="6" />
    <circle cx="380" cy="160" r="9" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="3">IN THE SEA</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#38bdf8" text-anchor="middle" letter-spacing="2">KENSUKE USHIO • CHAINSAW MAN OST</text>
</svg>
`);

// 6. Chopin - Nocturne in C-sharp minor
writeSvg('chopin-nocturne-c-sharp-minor.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgNocturne" cx="50%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#3b0764" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#090514" />
    </radialGradient>
    <radialGradient id="nocturneMoon" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#c084fc" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#c084fc" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="violetRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f472b6" />
      <stop offset="50%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgNocturne)" />

  <!-- Moon over Paris Salon Window -->
  <circle cx="300" cy="200" r="160" fill="url(#nocturneMoon)" />
  <circle cx="300" cy="200" r="60" fill="#faf5ff" opacity="0.9" />

  <!-- Gothic Arch Window Outline -->
  <path d="M160,400 L160,260 C160,180 300,120 300,120 C300,120 440,180 440,260 L440,400 Z" fill="none" stroke="#a855f7" stroke-width="2" opacity="0.4" />
  <line x1="300" y1="120" x2="300" y2="400" stroke="#a855f7" stroke-width="1.5" opacity="0.3" />
  <line x1="160" y1="260" x2="440" y2="260" stroke="#a855f7" stroke-width="1.5" opacity="0.3" />

  <!-- Famous 35-note downward arabesque flourish curve -->
  <path d="M420,180 C360,210 320,240 280,300 C240,360 210,400 180,440" fill="none" stroke="url(#violetRibbon)" stroke-width="4" stroke-linecap="round" />
  
  <!-- Candle with delicate flame -->
  <g transform="translate(380, 310)">
    <rect x="0" y="20" width="16" height="60" fill="#f1f5f9" rx="2" />
    <path d="M8,18 C4,10 8,0 8,0 C8,0 12,10 8,18 Z" fill="#f59e0b" filter="drop-shadow(0 0 10px #f59e0b)" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="3">NOCTURNE IN C# MINOR</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#c084fc" text-anchor="middle" letter-spacing="2">FRÉDÉRIC CHOPIN • OP. POSTH., B. 49</text>
</svg>
`);

// 7. Joe Hisaishi - One Summer's Day (Spirited Away)
writeSvg('joe-hisaishi-one-summers-day.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="ghibliSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="55%" stop-color="#38bdf8" />
      <stop offset="80%" stop-color="#bae6fd" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="trainSea" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0c4a6e" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#ghibliSky)" />

  <!-- Puffy Ghibli Cumulus Clouds -->
  <g fill="#ffffff" opacity="0.95">
    <!-- Cloud Cluster 1 -->
    <circle cx="160" cy="180" r="70" />
    <circle cx="230" cy="150" r="90" />
    <circle cx="310" cy="170" r="80" />
    <circle cx="210" cy="220" r="60" />
    <!-- Cloud Cluster 2 -->
    <circle cx="440" cy="200" r="65" />
    <circle cx="500" cy="180" r="75" />
  </g>

  <!-- Sea Surface & Reflections -->
  <rect x="0" y="340" width="600" height="260" fill="url(#trainSea)" />

  <!-- Spirited Away Water Train Track -->
  <g stroke="#f8fafc" stroke-width="2.5" opacity="0.7">
    <line x1="0" y1="410" x2="600" y2="410" />
    <line x1="0" y1="420" x2="600" y2="420" />
    <!-- Ties / Sleepers submerged in water -->
    <line x1="60" y1="405" x2="60" y2="425" />
    <line x1="120" y1="405" x2="120" y2="425" />
    <line x1="180" y1="405" x2="180" y2="425" />
    <line x1="240" y1="405" x2="240" y2="425" />
    <line x1="300" y1="405" x2="300" y2="425" />
    <line x1="360" y1="405" x2="360" y2="425" />
    <line x1="420" y1="405" x2="420" y2="425" />
    <line x1="480" y1="405" x2="480" y2="425" />
    <line x1="540" y1="405" x2="540" y2="425" />
  </g>

  <!-- Nostalgic Red Coastal Train Silhouette -->
  <g transform="translate(240, 350)">
    <rect x="0" y="0" width="120" height="55" rx="6" fill="#be123c" />
    <!-- Windows with warm light -->
    <rect x="15" y="10" width="22" height="22" rx="3" fill="#fef08a" />
    <rect x="45" y="10" width="22" height="22" rx="3" fill="#fef08a" />
    <rect x="75" y="10" width="22" height="22" rx="3" fill="#fef08a" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="3">ONE SUMMER'S DAY</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#fef08a" text-anchor="middle" letter-spacing="2">JOE HISAISHI • SPIRITED AWAY</text>
</svg>
`);

// 8. Joe Hisaishi - Merry-Go-Round of Life (Howl's Moving Castle)
writeSvg('joe-hisaishi-merry-go-round.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <linearGradient id="howlSunset" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7c2d12" />
      <stop offset="35%" stop-color="#ea580c" />
      <stop offset="70%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#14532d" />
    </linearGradient>
    <radialGradient id="sunWheel" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#howlSunset)" />

  <!-- Golden Setting Sun -->
  <circle cx="300" cy="220" r="140" fill="url(#sunWheel)" />
  <circle cx="300" cy="220" r="70" fill="#fef08a" />

  <!-- Howl's Walking Castle Mechanical Silhouette -->
  <g transform="translate(200, 160)" fill="#1c1917">
    <!-- Castle towers, turrets and chimney steam pipes -->
    <rect x="40" y="40" width="110" height="90" rx="8" />
    <polygon points="30,40 60,0 80,40" />
    <polygon points="90,40 120,5 140,40" />
    <rect x="130" y="20" width="16" height="50" rx="2" />
    <rect x="25" y="70" width="40" height="40" rx="4" />
    <circle cx="100" cy="90" r="15" fill="#f59e0b" />
    <!-- Mechanical iron bird legs -->
    <line x1="50" y1="130" x2="30" y2="200" stroke="#1c1917" stroke-width="8" stroke-linecap="round" />
    <line x1="130" y1="130" x2="160" y2="200" stroke="#1c1917" stroke-width="8" stroke-linecap="round" />
  </g>

  <!-- Rolling Alpine Flower Meadows -->
  <ellipse cx="180" cy="510" rx="260" ry="110" fill="#14532d" />
  <ellipse cx="460" cy="530" rx="290" ry="120" fill="#052e16" />

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="3">MERRY-GO-ROUND OF LIFE</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#fef08a" text-anchor="middle" letter-spacing="2">JOE HISAISHI • HOWL'S MOVING CASTLE</text>
</svg>
`);

// 9. DJ Okawari - Flower Dance
writeSvg('dj-okawari-flower-dance.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgFlower" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#701a75" />
      <stop offset="50%" stop-color="#3b0764" />
      <stop offset="100%" stop-color="#0f051d" />
    </radialGradient>
    <linearGradient id="sakuraPetal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbcfe8" />
      <stop offset="50%" stop-color="#f472b6" />
      <stop offset="100%" stop-color="#db2777" />
    </linearGradient>
    <radialGradient id="flowerHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgFlower)" />
  <circle cx="300" cy="230" r="180" fill="url(#flowerHalo)" />

  <!-- Swirling Sakura Blossom Kaleidoscope Petals -->
  <g transform="translate(300, 230)" fill="url(#sakuraPetal)">
    <!-- 8 Blooming Petals -->
    <path d="M0,0 C-30,-80 0,-150 0,-150 C0,-150 30,-80 0,0 Z" />
    <path d="M0,0 C-30,-80 0,-150 0,-150 C0,-150 30,-80 0,0 Z" transform="rotate(45)" />
    <path d="M0,0 C-30,-80 0,-150 0,-150 C0,-150 30,-80 0,0 Z" transform="rotate(90)" />
    <path d="M0,0 C-30,-80 0,-150 0,-150 C0,-150 30,-80 0,0 Z" transform="rotate(135)" />
    <path d="M0,0 C-30,-80 0,-150 0,-150 C0,-150 30,-80 0,0 Z" transform="rotate(180)" />
    <path d="M0,0 C-30,-80 0,-150 0,-150 C0,-150 30,-80 0,0 Z" transform="rotate(225)" />
    <path d="M0,0 C-30,-80 0,-150 0,-150 C0,-150 30,-80 0,0 Z" transform="rotate(270)" />
    <path d="M0,0 C-30,-80 0,-150 0,-150 C0,-150 30,-80 0,0 Z" transform="rotate(315)" />
    <!-- Flower Pistil -->
    <circle cx="0" cy="0" r="24" fill="#fef08a" />
  </g>

  <!-- Flying Wind Whirl Petals -->
  <g fill="#f472b6" opacity="0.85">
    <ellipse cx="140" cy="140" rx="16" ry="7" transform="rotate(25 140 140)" />
    <ellipse cx="460" cy="120" rx="18" ry="8" transform="rotate(-35 460 120)" />
    <ellipse cx="110" cy="340" rx="20" ry="9" transform="rotate(45 110 340)" />
    <ellipse cx="480" cy="360" rx="16" ry="8" transform="rotate(-15 480 360)" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff" text-anchor="middle" letter-spacing="4">FLOWER DANCE</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#f472b6" text-anchor="middle" letter-spacing="2">DJ OKAWARI • MELODIC JAZZ PIANO</text>
</svg>
`);

// 10. Tony Ann - ICARUS
writeSvg('tony-ann-icarus.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgIcarus" cx="50%" cy="40%" r="80%">
      <stop offset="0%" stop-color="#451a03" />
      <stop offset="50%" stop-color="#1c1917" />
      <stop offset="100%" stop-color="#09090b" />
    </radialGradient>
    <linearGradient id="goldWing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgIcarus)" />
  
  <circle cx="300" cy="200" r="160" fill="url(#sunGlow)" />
  <circle cx="300" cy="200" r="65" fill="#fef08a" />

  <!-- Soaring Wings of Icarus made of Piano Keys / Golden Feathers -->
  <g fill="url(#goldWing)">
    <!-- Left Wing -->
    <path d="M280,240 C220,180 120,130 60,110 C80,180 130,260 270,270 Z" />
    <path d="M260,260 C200,220 130,190 90,180 C110,240 160,300 250,290 Z" />
    <!-- Right Wing -->
    <path d="M320,240 C380,180 480,130 540,110 C520,180 470,260 330,270 Z" />
    <path d="M340,260 C400,220 470,190 510,180 C490,240 440,300 350,290 Z" />
  </g>

  <!-- Golden Piano Key Grid Wave below -->
  <g stroke="#f59e0b" stroke-width="2" opacity="0.6">
    <path d="M50,420 C180,380 420,440 550,400" fill="none" />
    <path d="M50,440 C180,400 420,460 550,420" fill="none" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" letter-spacing="5">ICARUS</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#f59e0b" text-anchor="middle" letter-spacing="2">TONY ANN • VIRTUOSO NEOCLASSICAL</text>
</svg>
`);

// 11. Beethoven - Moonlight Sonata
writeSvg('beethoven-moonlight-1.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgMoonlight" cx="50%" cy="25%" r="85%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="45%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <radialGradient id="fullMoon" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e0e7ff" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#e0e7ff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgMoonlight)" />

  <!-- Full Silver Moon over Lake Lucerne -->
  <circle cx="300" cy="180" r="140" fill="url(#fullMoon)" />
  <circle cx="300" cy="180" r="60" fill="#f8fafc" />

  <!-- Lake surface reflections (Undulating triplets) -->
  <g stroke="#c7d2fe" stroke-width="2" opacity="0.6">
    <ellipse cx="300" cy="360" rx="80" ry="6" fill="none" />
    <ellipse cx="300" cy="390" rx="130" ry="8" fill="none" />
    <ellipse cx="300" cy="425" rx="190" ry="10" fill="none" />
  </g>

  <!-- Cypress tree silhouettes -->
  <path d="M120,440 C110,320 135,260 140,220 C145,260 170,320 160,440 Z" fill="#020617" />
  <path d="M480,440 C470,330 495,270 500,230 C505,270 530,330 520,440 Z" fill="#020617" />

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="3">MOONLIGHT SONATA</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#818cf8" text-anchor="middle" letter-spacing="2">L. V. BEETHOVEN • OP. 27 NO. 2</text>
</svg>
`);

// 12. Beethoven - Für Elise
writeSvg('beethoven-fur-elise.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgElise" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#451a03" />
      <stop offset="50%" stop-color="#291206" />
      <stop offset="100%" stop-color="#0a0502" />
    </radialGradient>
    <linearGradient id="roseParchment" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fecdd3" />
      <stop offset="50%" stop-color="#fb7185" />
      <stop offset="100%" stop-color="#e11d48" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgElise)" />

  <!-- Classical Viennese Medallion -->
  <circle cx="300" cy="220" r="140" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 6" />
  <circle cx="300" cy="220" r="120" fill="#1c0d02" />

  <!-- Romantic Rose Silhouette -->
  <g transform="translate(300, 220) scale(1.2)" fill="url(#roseParchment)">
    <circle cx="0" cy="0" r="28" />
    <path d="M-15,-15 C-25,-30 0,-40 0,-40 C0,-40 25,-30 15,-15 Z" />
    <path d="M-20,5 C-40,0 -40,25 -20,20 Z" />
    <path d="M20,5 C40,0 40,25 20,20 Z" />
  </g>

  <!-- Beethoven's E-D#-E-D#-E semitone opening motif stave line -->
  <path d="M160,380 L440,380" stroke="#f59e0b" stroke-width="2" />
  <g fill="#f59e0b">
    <ellipse cx="220" cy="375" rx="8" ry="6" />
    <ellipse cx="260" cy="385" rx="8" ry="6" />
    <ellipse cx="300" cy="375" rx="8" ry="6" />
    <ellipse cx="340" cy="385" rx="8" ry="6" />
    <ellipse cx="380" cy="375" rx="8" ry="6" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="32" fill="#ffffff" text-anchor="middle" letter-spacing="4">FÜR ELISE</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#fb7185" text-anchor="middle" letter-spacing="2">L. V. BEETHOVEN • WOO 59 COMPLETE</text>
</svg>
`);

// 13. Chopin - Ballade No. 1 in G minor
writeSvg('chopin-ballade-1.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgBallade" cx="50%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#7f1d1d" />
      <stop offset="50%" stop-color="#450a0a" />
      <stop offset="100%" stop-color="#0a0202" />
    </radialGradient>
    <linearGradient id="goldFire" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgBallade)" />

  <!-- Tempestuous romantic arcs (Presto con fuoco coda) -->
  <path d="M60,350 C180,180 320,140 540,160" fill="none" stroke="url(#goldFire)" stroke-width="4" />
  <path d="M80,380 C200,210 340,170 560,190" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.6" />

  <!-- Concert Grand in Tempest Silhouette -->
  <g transform="translate(180, 200) scale(0.9)" fill="#050101">
    <path d="M40,100 C60,20 150,10 240,40 C280,80 290,160 260,220 L50,220 Z" />
    <!-- Lid prop -->
    <line x1="80" y1="90" x2="170" y2="10" stroke="#f59e0b" stroke-width="3.5" />
    <rect x="50" y="215" width="210" height="15" fill="#f8fafc" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="#ffffff" text-anchor="middle" letter-spacing="3">BALLADE NO. 1</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#fca5a5" text-anchor="middle" letter-spacing="2">FRÉDÉRIC CHOPIN • OP. 23 (COMPLETE)</text>
</svg>
`);

// 14. Handel / Halvorsen - Passacaglia
writeSvg('handel-halvorsen-passacaglia.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgPassacaglia" cx="50%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#431407" />
      <stop offset="50%" stop-color="#1c0702" />
      <stop offset="100%" stop-color="#050101" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgPassacaglia)" />

  <!-- Baroque Gothic Vaults & Arches -->
  <g stroke="#f97316" stroke-width="2.5" fill="none" opacity="0.6">
    <path d="M150,420 C150,220 300,160 300,160 C300,160 450,220 450,420" />
    <path d="M200,420 C200,260 300,210 300,210 C300,210 400,260 400,420" />
  </g>

  <!-- Fiery Ground Bass Pillar -->
  <rect x="290" y="180" width="20" height="240" fill="#ea580c" rx="4" />
  <circle cx="300" cy="180" r="30" fill="#fef08a" />

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="#ffffff" text-anchor="middle" letter-spacing="3">PASSACAGLIA</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#fb923c" text-anchor="middle" letter-spacing="2">HANDEL / HALVORSEN • G MINOR</text>
</svg>
`);

// 15. Bach - Prelude in C Major
writeSvg('bach-prelude-c.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgBach" cx="50%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#022c22" />
      <stop offset="100%" stop-color="#01140e" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgBach)" />

  <!-- Baroque Organ Pipe Harmonics -->
  <g fill="#10b981" opacity="0.8">
    <rect x="180" y="240" width="18" height="160" rx="3" />
    <rect x="210" y="200" width="18" height="200" rx="3" />
    <rect x="240" y="160" width="18" height="240" rx="3" />
    <rect x="270" y="120" width="18" height="280" rx="3" fill="#34d399" />
    <rect x="300" y="100" width="20" height="300" rx="3" fill="#6ee7b7" />
    <rect x="330" y="120" width="18" height="280" rx="3" fill="#34d399" />
    <rect x="360" y="160" width="18" height="240" rx="3" />
    <rect x="390" y="200" width="18" height="200" rx="3" />
    <rect x="420" y="240" width="18" height="160" rx="3" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="3">PRELUDE IN C MAJOR</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#6ee7b7" text-anchor="middle" letter-spacing="2">J. S. BACH • BWV 846</text>
</svg>
`);

// 16. ABBA - The Winner Takes It All
writeSvg('abba-the-winner-takes-it-all.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgAbba" cx="50%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#311042" />
      <stop offset="100%" stop-color="#08020d" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgAbba)" />

  <!-- Stadium Concert Spotlight -->
  <polygon points="300,0 200,420 400,420" fill="#ffffff" opacity="0.12" />
  <circle cx="300" cy="400" r="110" fill="#a855f7" opacity="0.3" />

  <!-- Retro Disco Ball / Stage Microphone Glow -->
  <circle cx="300" cy="180" r="50" fill="#f8fafc" />
  <g stroke="#9333ea" stroke-width="2" opacity="0.6">
    <ellipse cx="300" cy="180" rx="50" ry="25" fill="none" />
    <ellipse cx="300" cy="180" rx="25" ry="50" fill="none" />
  </g>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle" letter-spacing="2">THE WINNER TAKES IT ALL</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#c084fc" text-anchor="middle" letter-spacing="2">ABBA • 1980 BALLAD</text>
</svg>
`);

// 17. Hanon Virtuoso Pianist
writeSvg('hanon-exercise-1.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgHanon" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#78350f" />
      <stop offset="50%" stop-color="#451a03" />
      <stop offset="100%" stop-color="#0f0702" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgHanon)" />

  <!-- High-lift finger agility archs -->
  <g stroke="#f59e0b" stroke-width="3" fill="none">
    <path d="M120,380 Q180,180 240,380" />
    <path d="M210,380 Q270,140 330,380" stroke="#fcd34d" stroke-width="4" />
    <path d="M300,380 Q360,160 420,380" />
    <path d="M390,380 Q450,220 510,380" />
  </g>

  <!-- Number 1 badge -->
  <circle cx="300" cy="180" r="45" fill="#f59e0b" />
  <text x="300" y="196" font-family="system-ui, sans-serif" font-weight="900" font-size="44" fill="#000000" text-anchor="middle">1</text>

  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="3">HANON EXERCISE NO. 1</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#fcd34d" text-anchor="middle" letter-spacing="2">THE VIRTUOSO PIANIST • AGILITY</text>
</svg>
`);

// 18. Scales & Technique
writeSvg('scales-technique.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
  <defs>
    <radialGradient id="bgScale" cx="50%" cy="30%" r="80%">
      <stop offset="0%" stop-color="#0f766e" />
      <stop offset="50%" stop-color="#115e59" />
      <stop offset="100%" stop-color="#042f2e" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bgScale)" />
  <g fill="#f8fafc" stroke="#0f766e" stroke-width="2">
    <rect x="150" y="200" width="42" height="160" rx="4" />
    <rect x="192" y="200" width="42" height="160" rx="4" />
    <rect x="234" y="200" width="42" height="160" rx="4" />
    <rect x="276" y="200" width="42" height="160" rx="4" />
    <rect x="318" y="200" width="42" height="160" rx="4" />
    <rect x="360" y="200" width="42" height="160" rx="4" />
    <rect x="402" y="200" width="42" height="160" rx="4" />
  </g>
  <g fill="#0f172a">
    <rect x="178" y="200" width="28" height="100" rx="3" />
    <rect x="220" y="200" width="28" height="100" rx="3" />
    <rect x="304" y="200" width="28" height="100" rx="3" />
    <rect x="346" y="200" width="28" height="100" rx="3" />
    <rect x="388" y="200" width="28" height="100" rx="3" />
  </g>
  <text x="300" y="515" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="3">SCALE FOUNDATION</text>
  <text x="300" y="555" font-family="system-ui, sans-serif" font-weight="600" font-size="16" fill="#5eead4" text-anchor="middle" letter-spacing="2">TECHNIQUE &amp; KEYBOARD NAVIGATION</text>
</svg>
`);

console.log('All cover artworks generated successfully!');
