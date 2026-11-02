import fs from 'fs'

const path = 'src/components/FlowkeyPlayerView.tsx'
let code = fs.readFileSync(path, 'utf8')

// 1. Add showFingersLocal state & toggle inside FlowkeyPlayerView
const stateTarget = "  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)"
const stateReplacement = `  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false)
  const [showFingersLocal, setShowFingersLocal] = useState<boolean>(() => {
    return localStorage.getItem('virtuoso_show_fingers') === 'true' // OFF by default
  })

  const handleToggleFingers = () => {
    setShowFingersLocal((prev) => {
      const next = !prev
      localStorage.setItem('virtuoso_show_fingers', String(next))
      return next
    })
  }`

code = code.replace(stateTarget, stateReplacement)

// 2. Pass showFingersLocal to FallingKeysCanvas and SheetMusicView
code = code.replace(
  'showFingers={showHands}',
  'showFingers={showFingersLocal}'
)
code = code.replace(
  'language={language}\n          />',
  'language={language}\n            showFingering={showFingersLocal}\n          />'
)

// 3. Update Header Right Controls:
// Make 2D/3D toggle ALWAYS visible (not hidden on sm), make Settings Drawer trigger visible on lg:hidden (so landscape iPhones have it too!)
// Hide the desktop-only multi-menus on < lg (not < sm) to prevent landscape header overflow!
const headerDesktopTarget = `<button
            onClick={() => setViewPerspective(viewPerspective === '2d' ? '3d' : '2d')}
            className={\`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all \${
              viewPerspective === '3d'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-white'
            }\`}
            title="Toggle 2D Overhead vs 3D Perspective Waterfall"
          >
            <Box className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px]">{viewPerspective.toUpperCase()}</span>
          </button>`

const headerDesktopReplacement = `<button
            onClick={() => setViewPerspective(viewPerspective === '2d' ? '3d' : '2d')}
            className={\`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-bold transition-all active:scale-95 shadow-sm \${
              viewPerspective === '3d'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-300'
            }\`}
            title="Toggle 2D Overhead vs 3D Synthesia Perspective"
          >
            <Box className="w-3 h-3" />
            <span className="font-mono text-[10px] font-black">{viewPerspective.toUpperCase()}</span>
          </button>`

code = code.replace(headerDesktopTarget, headerDesktopReplacement)

// Update theme & section selectors to hidden lg:block
code = code.replace(
  'div className="relative hidden md:block">\n            <button\n              onClick={() => setSectionsMenuOpen(!sectionsMenuOpen)}',
  'div className="relative hidden lg:block">\n            <button\n              onClick={() => setSectionsMenuOpen(!sectionsMenuOpen)}'
)
code = code.replace(
  'div className="relative hidden sm:block">\n            <button\n              onClick={() => setThemeMenuOpen(!themeMenuOpen)}',
  'div className="relative hidden lg:block">\n            <button\n              onClick={() => setThemeMenuOpen(!themeMenuOpen)}'
)
code = code.replace(
  'button\n              onClick={onOpenAudioSettings}\n              className="hidden sm:flex',
  'button\n              onClick={onOpenAudioSettings}\n              className="hidden lg:flex'
)
code = code.replace(
  'button\n            onClick={() => setIsMasterclassOpen(!isMasterclassOpen)}\n            className={`hidden sm:flex',
  'button\n            onClick={() => setIsMasterclassOpen(!isMasterclassOpen)}\n            className={`hidden lg:flex'
)

// Mobile Quick Settings Trigger: change sm:hidden to lg:hidden so landscape iPhone retains settings trigger!
code = code.replace(
  'className="flex sm:hidden items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 border border-white/10 text-amber-400 hover:text-amber-300 active:scale-95 transition-all shadow-sm"',
  'className="flex lg:hidden items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-amber-400 hover:text-amber-300 active:scale-95 transition-all shadow-sm"'
)

// 4. Update Center Practice Cockpit:
// In Tier 1 mobile: replace onToggleHands with handleToggleFingers and clean label "Fig: OFF" / "Fig: ON"
code = code.replace(
  `<button
              onClick={onToggleHands}
              className={\`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all \${
                showHands
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                  : 'bg-zinc-900 border-white/10 text-zinc-500'
              }\`}
              title="Fingering numbers"
            >
              <Hand className="w-3 h-3" />
              <span className="text-[11px]">{showHands ? 'Fingers' : 'No Fig'}</span>
            </button>`,
  `<button
              onClick={handleToggleFingers}
              className={\`px-2 py-1 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all active:scale-95 \${
                showFingersLocal
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                  : 'bg-zinc-900 border-white/10 text-zinc-500'
              }\`}
              title="Fingering numbers toggle (Off by default for clean view)"
            >
              <Hand className="w-3 h-3" />
              <span className="text-[10px]">{showFingersLocal ? 'Fig: ON' : 'Fig: AUS'}</span>
            </button>`
)

// On desktop right auxiliary buttons: replace showHands with showFingersLocal & handleToggleFingers
code = code.replace(
  `<button
            onClick={onToggleHands}
            className={\`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition-all shadow-sm active:scale-95 \${
              showHands
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-500'
            }\`}
            title="Toggle Fingering Numbers & Guides"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Fingers {showHands ? 'ON' : 'OFF'}</span>
          </button>`,
  `<button
            onClick={handleToggleFingers}
            className={\`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 \${
              showFingersLocal
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-900 hover:bg-zinc-800 border-white/10 text-zinc-500'
            }\`}
            title="Toggle Fingering Numbers & Guides"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Fingers {showFingersLocal ? 'ON' : 'AUS'}</span>
          </button>`
)

// In mobile drawer: replace fingering button
code = code.replace(
  `<button
                    onClick={onToggleHands}
                    className={\`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all \${
                      showHands
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                        : 'bg-zinc-800/60 border-white/10 text-zinc-400'
                    }\`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Hand className="w-3.5 h-3.5" />
                      <span>Fingering</span>
                    </span>
                    <span className="font-mono text-[10px]">{showHands ? 'ON' : 'OFF'}</span>
                  </button>`,
  `<button
                    onClick={handleToggleFingers}
                    className={\`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all \${
                      showFingersLocal
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-zinc-800/60 border-white/10 text-zinc-400'
                    }\`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Hand className="w-3.5 h-3.5" />
                      <span>Fingersatz anzeigen</span>
                    </span>
                    <span className="font-mono text-[10px] font-bold">{showFingersLocal ? 'AN' : 'AUS (Sauber)'}</span>
                  </button>`
)

// In mobile drawer: add 2D / 3D toggle
const drawerThemeTarget = `<div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Visual Theme</div>`
const drawerThemeReplacement = `<div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Perspektive (2D / 3D)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setViewPerspective('2d')}
                      className={\`py-2 rounded-xl text-xs font-bold border transition-all \${
                        viewPerspective === '2d'
                          ? 'bg-amber-500 text-zinc-950 font-black'
                          : 'bg-zinc-800 border-white/10 text-zinc-400'
                      }\`}
                    >
                      2D Draufsicht (Klassisch)
                    </button>
                    <button
                      onClick={() => setViewPerspective('3d')}
                      className={\`py-2 rounded-xl text-xs font-bold border transition-all \${
                        viewPerspective === '3d'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-black'
                          : 'bg-zinc-800 border-white/10 text-zinc-400'
                      }\`}
                    >
                      3D Synthesia (Perspektive)
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Visual Theme</div>`

code = code.replace(drawerThemeTarget, drawerThemeReplacement)

fs.writeFileSync(path, code, 'utf8')
console.log('Successfully updated FlowkeyPlayerView.tsx!')
