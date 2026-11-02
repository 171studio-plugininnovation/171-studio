import sys

path = "src/components/PluginsPage.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State for expandedChangelogPluginId
target_state = """  // Expanded technologies state for each plugin (all open by default so user can read everything)
  const [expandedTechPluginId, setExpandedTechPluginId] = useState<Record<string, boolean>>({
    'plugin-realtune': true,
    'plugin-easyvoice': true,
    'plugin-optocom': true,
    'plugin-cleandrive': true,
    'plugin-cleanreso': true,
    'plugin-perfectpre': true,
    'plugin-masterglue': true,
    'plugin-spaceluxe': true,
    'plugin-punchcraft': true,
    'plugin-perfectclip': true,
  });"""

replacement_state = """  // Expanded technologies state for each plugin (all open by default so user can read everything)
  const [expandedTechPluginId, setExpandedTechPluginId] = useState<Record<string, boolean>>({
    'plugin-realtune': true,
    'plugin-easyvoice': true,
    'plugin-optocom': true,
    'plugin-cleandrive': true,
    'plugin-cleanreso': true,
    'plugin-perfectpre': true,
    'plugin-masterglue': true,
    'plugin-spaceluxe': true,
    'plugin-punchcraft': true,
    'plugin-perfectclip': true,
  });

  // Expanded changelog state for each plugin (EasyVoice, SpaceLuxe and RealTune open by default)
  const [expandedChangelogPluginId, setExpandedChangelogPluginId] = useState<Record<string, boolean>>({
    'plugin-easyvoice': true,
    'plugin-spaceluxe': true,
    'plugin-realtune': true,
    'plugin-optocom': false,
    'plugin-cleandrive': false,
    'plugin-cleanreso': false,
    'plugin-perfectpre': false,
  });"""

if target_state not in content:
    print("Error: target_state not found")
    sys.exit(1)
content = content.replace(target_state, replacement_state, 1)

# 2. Roadmap weekly steps
target_roadmap = """            {/* 4 Weekly Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  id: 'plugin-spaceluxe',
                  week: 1,
                  name: '171 SpaceLuxe',
                  cat: 'Hybrid Reverb & Shimmer',
                  dateStr: '2026-11-06T18:00:00+01:00',
                  targetDateLabel: 'Ven 06 Nov 2026, 18:00',
                  winSize: '8.52 MB',
                  macSize: '0.73 MB',
                },
                {
                  id: 'plugin-masterglue',
                  week: 2,
                  name: '171 MasterGlue',
                  cat: 'Analog Bus VCA/Diode Console',
                  dateStr: '2026-11-13T18:00:00+01:00',
                  targetDateLabel: 'Ven 13 Nov 2026, 18:00',
                  winSize: '8.37 MB',
                  macSize: '0.52 MB',
                },
                {
                  id: 'plugin-punchcraft',
                  week: 3,
                  name: '171 PunchCraft',
                  cat: 'Multi-Band Transient Shaper',
                  dateStr: '2026-11-20T18:00:00+01:00',
                  targetDateLabel: 'Ven 20 Nov 2026, 18:00',
                  winSize: '8.42 MB',
                  macSize: '0.57 MB',
                },
                {
                  id: 'plugin-perfectclip',
                  week: 4,
                  name: '171 PerfectClip',
                  cat: 'Mastering ADAA-2 Clipper',
                  dateStr: '2026-11-27T18:00:00+01:00',
                  targetDateLabel: 'Ven 27 Nov 2026, 18:00',
                  winSize: '8.38 MB',
                  macSize: '0.51 MB',
                },
              ].map((step) => {"""

replacement_roadmap = """            {/* 4 Weekly Steps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  id: 'plugin-spaceluxe',
                  week: 1,
                  name: '171 SpaceLuxe',
                  cat: 'Hybrid Reverb & Shimmer',
                  dateStr: '2026-11-02T16:00:00+01:00',
                  targetDateLabel: '2 Nov 2026 • SBLOCCATO ORA',
                  winSize: '8.45 MB',
                  macSize: '0.73 MB',
                },
                {
                  id: 'plugin-masterglue',
                  week: 2,
                  name: '171 MasterGlue',
                  cat: 'Analog Bus VCA/Diode Console',
                  dateStr: '2026-11-06T18:00:00+01:00',
                  targetDateLabel: 'Ven 06 Nov 2026, 18:00',
                  winSize: '8.36 MB',
                  macSize: '0.52 MB',
                },
                {
                  id: 'plugin-punchcraft',
                  week: 3,
                  name: '171 PunchCraft',
                  cat: 'Multi-Band Transient Shaper',
                  dateStr: '2026-11-13T18:00:00+01:00',
                  targetDateLabel: 'Ven 13 Nov 2026, 18:00',
                  winSize: '8.42 MB',
                  macSize: '0.57 MB',
                },
                {
                  id: 'plugin-perfectclip',
                  week: 4,
                  name: '171 PerfectClip',
                  cat: 'Mastering ADAA-2 Clipper',
                  dateStr: '2026-11-20T18:00:00+01:00',
                  targetDateLabel: 'Ven 20 Nov 2026, 18:00',
                  winSize: '8.42 MB',
                  macSize: '0.51 MB',
                },
              ].map((step) => {"""

if target_roadmap not in content:
    print("Error: target_roadmap not found")
    sys.exit(1)
content = content.replace(target_roadmap, replacement_roadmap, 1)

# 3. Top Banner & Card Header
target_header = """          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {siteContent.plugins.map((plugin) => {
              const isDownloaded = downloadSuccessId === plugin.id;
              const zipFileLabel =
                plugin.zipFileName || `${plugin.name.replace(/\s+/g, '_')}_Installer.zip`;
              const isTechExpanded = expandedTechPluginId[plugin.id] ?? true;
              const hasTechnologies = plugin.technologies && plugin.technologies.length > 0;
              const countdown = plugin.unlockDate ? getCountdown(plugin.unlockDate) : null;
              const isLocked = countdown ? !countdown.isUnlocked : (plugin.status === 'IN ARRIVO');

              return (
                <HardwareTiltCard 
                  key={plugin.id} 
                  maxTilt={6}
                  glareColor="gold"
                  showCornerRivets={true}
                  className="p-6 sm:p-7 rounded-3xl bg-neutral-900/80 backdrop-blur-md flex flex-col justify-between group overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase block mb-1">
                          {plugin.badge}
                        </span>
                        <h4 className="font-heading font-black text-2xl text-white group-hover:text-amber-400 transition-colors">
                          {plugin.name}
                        </h4>
                        {plugin.version && (
                          <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                            {plugin.version}
                          </span>
                        )}
                      </div>"""

replacement_header = """          {/* Top Announcement Banner: Nuova Release 2 Novembre 2026 */}
          <div className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900/95 via-black/90 to-amber-950/40 border border-amber-500/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-4xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[10px] font-mono font-black px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 to-red-500/25 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 shadow-sm animate-pulse">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>NUOVA RELEASE 2 NOVEMBRE 2026 DISPONIBILE</span>
                  </span>
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>DSP ANTI-DENORMAL FTZ/DAZ ZERO-LATENCY</span>
                  </span>
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WINDOWS 64-BIT VST3 & STANDALONE</span>
                  </span>
                </div>

                <h3 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
                  Aggiornamento Ufficiale Suite: Nuove Funzioni, Fix DSP & SpaceLuxe Sbloccato
                </h3>

                <p className="text-sm text-neutral-300 font-light leading-relaxed">
                  Abbiamo caricato e certificato le nuove release Windows per l'intera suite 171 Plugin Innovation. In evidenza su <strong className="text-amber-400 font-semibold">171 EasyVoice v1.0.1 Patch 2</strong> (eliminato il chattering dell'expander vocale su code lunghe, introdotte dinamiche seriali 1176+LA2A e 8 preamp analogici), <strong className="text-amber-400 font-semibold">171 SpaceLuxe v1.1.0</strong> (sbloccato ora con fix allpass tail glitch e nuova GUI), e fix DSP su <strong className="text-amber-400 font-semibold">171 RealTune</strong>, <strong className="text-amber-400 font-semibold">171 DriveOptocom</strong>, <strong className="text-amber-400 font-semibold">CleanDrive</strong>, <strong className="text-amber-400 font-semibold">CleanReso</strong> e <strong className="text-amber-400 font-semibold">PerfectPre</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono text-neutral-400">
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Consulta i box interattivi «Nuove Funzioni & Fix» su ogni plugin</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto">
                <a
                  href="#plugin-easyvoice"
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Scarica Patch 2 Nov</span>
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {siteContent.plugins.map((plugin) => {
              const isDownloaded = downloadSuccessId === plugin.id;
              const zipFileLabel =
                plugin.zipFileName || `${plugin.name.replace(/\s+/g, '_')}_Installer.zip`;
              const isTechExpanded = expandedTechPluginId[plugin.id] ?? true;
              const isChangelogExpanded = expandedChangelogPluginId[plugin.id] ?? false;
              const hasTechnologies = plugin.technologies && plugin.technologies.length > 0;
              const hasChangelog = plugin.changelog && plugin.changelog.length > 0;
              const countdown = plugin.unlockDate ? getCountdown(plugin.unlockDate) : null;
              const isLocked = countdown ? !countdown.isUnlocked : (plugin.status === 'IN ARRIVO');

              return (
                <HardwareTiltCard 
                  key={plugin.id} 
                  id={plugin.id}
                  maxTilt={6}
                  glareColor="gold"
                  showCornerRivets={true}
                  className="p-6 sm:p-7 rounded-3xl bg-neutral-900/80 backdrop-blur-md flex flex-col justify-between group overflow-hidden scroll-mt-24"
                >
                  <div className="space-y-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase">
                            {plugin.badge}
                          </span>
                          {plugin.isNewRelease && (
                            <span className="text-[9.5px] font-mono font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-red-500/25 text-amber-300 border border-amber-500/60 flex items-center gap-1 shadow-sm animate-pulse">
                              <Flame className="w-3 h-3 text-amber-400" />
                              <span>{plugin.newReleaseTag || 'NUOVA RELEASE 2 NOV'}</span>
                            </span>
                          )}
                        </div>
                        <h4 className="font-heading font-black text-2xl text-white group-hover:text-amber-400 transition-colors">
                          {plugin.name}
                        </h4>
                        {plugin.version && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-mono text-neutral-300 font-semibold px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800">
                              {plugin.version}
                            </span>
                            {plugin.isNewRelease && (
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                <span>Release Attiva</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>"""

if target_header not in content:
    print("Error: target_header not found")
    sys.exit(1)
content = content.replace(target_header, replacement_header, 1)

# 4. Changelog Accordion right after Technologies section and before Package details banner
target_after_tech = """                    {/* Technologies & DSP Architecture Section */}
                    {hasTechnologies && (
                      <div className="rounded-2xl bg-neutral-950/90 border border-amber-500/20 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedTechPluginId(prev => ({ ...prev, [plugin.id]: !isTechExpanded }))}
                          className="w-full px-4 py-3 bg-neutral-900/60 hover:bg-neutral-900 flex items-center justify-between text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-amber-400" />
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                              Tecnologie & Architettura DSP ({plugin.technologies?.length})
                            </span>
                          </div>
                          {isTechExpanded ? (
                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>

                        {isTechExpanded && (
                          <div className="p-4 space-y-2.5 text-xs text-neutral-300 border-t border-neutral-800/80 animate-in fade-in duration-200">
                            {plugin.technologies?.map((tech, techIdx) => (
                              <div key={techIdx} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span className="leading-relaxed font-light text-[11.5px] text-neutral-200">
                                  {tech}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Package details banner */}"""

replacement_after_tech = """                    {/* Technologies & DSP Architecture Section */}
                    {hasTechnologies && (
                      <div className="rounded-2xl bg-neutral-950/90 border border-amber-500/20 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedTechPluginId(prev => ({ ...prev, [plugin.id]: !isTechExpanded }))}
                          className="w-full px-4 py-3 bg-neutral-900/60 hover:bg-neutral-900 flex items-center justify-between text-left transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-amber-400" />
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                              Tecnologie & Architettura DSP ({plugin.technologies?.length})
                            </span>
                          </div>
                          {isTechExpanded ? (
                            <ChevronUp className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>

                        {isTechExpanded && (
                          <div className="p-4 space-y-2.5 text-xs text-neutral-300 border-t border-neutral-800/80 animate-in fade-in duration-200">
                            {plugin.technologies?.map((tech, techIdx) => (
                              <div key={techIdx} className="flex items-start gap-2.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <span className="leading-relaxed font-light text-[11.5px] text-neutral-200">
                                  {tech}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Changelog: Nuove Funzioni & Fix Accordion */}
                    {hasChangelog && (
                      <div className="rounded-2xl bg-neutral-950/95 border border-amber-500/30 overflow-hidden shadow-inner">
                        <button
                          type="button"
                          onClick={() => setExpandedChangelogPluginId(prev => ({ ...prev, [plugin.id]: !isChangelogExpanded }))}
                          className="w-full px-4 py-3 bg-neutral-900/80 hover:bg-neutral-900 flex items-center justify-between text-left transition-colors cursor-pointer group/chlog"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-400 group-hover/chlog:rotate-12 transition-transform" />
                            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">
                              Nuove Funzioni & Fix ({plugin.changelog?.[0]?.version || plugin.version})
                            </span>
                            {plugin.isNewRelease && (
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                2 NOV
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-400 hidden sm:inline">
                              {isChangelogExpanded ? 'Nascondi' : 'Mostra Dettagli'}
                            </span>
                            {isChangelogExpanded ? (
                              <ChevronUp className="w-4 h-4 text-amber-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-400 group-hover/chlog:text-white" />
                            )}
                          </div>
                        </button>

                        {isChangelogExpanded && (
                          <div className="p-4 space-y-3.5 text-xs border-t border-neutral-800 animate-in fade-in duration-200 bg-black/60">
                            {plugin.changelog?.map((logItem, logIdx) => (
                              <div key={logIdx} className="space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                                  <span className="font-heading font-bold text-amber-300 text-xs">
                                    {logItem.title}
                                  </span>
                                  <span className="text-[10px] font-mono text-neutral-400">
                                    {logItem.date}
                                  </span>
                                </div>

                                {/* Features block */}
                                {logItem.features && logItem.features.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                                      <Zap className="w-3 h-3 text-cyan-400" />
                                      <span>Nuove Funzioni & Ottimizzazioni:</span>
                                    </span>
                                    <div className="space-y-1.5 pl-1">
                                      {logItem.features.map((feat, fIdx) => (
                                        <div key={fIdx} className="flex items-start gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                                          <span className="text-[11px] font-light text-neutral-200 leading-relaxed">
                                            {feat}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Fixes block */}
                                {logItem.fixes && logItem.fixes.length > 0 && (
                                  <div className="space-y-1.5 pt-2 border-t border-neutral-900">
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                      <span>Bug Fix & Risoluzioni DSP:</span>
                                    </span>
                                    <div className="space-y-1.5 pl-1">
                                      {logItem.fixes.map((fx, fxIdx) => (
                                        <div key={fxIdx} className="flex items-start gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                          <span className="text-[11px] font-light text-neutral-300 leading-relaxed">
                                            {fx}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Package details banner */}"""

if target_after_tech not in content:
    print("Error: target_after_tech not found")
    sys.exit(1)
content = content.replace(target_after_tech, replacement_after_tech, 1)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: PluginsPage.tsx updated perfectly!")
