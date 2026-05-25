// Pauta — App root
// Tab navigation, shared store, tweaks panel.

function App() {
  const store = useStore();
  const [t, setTweak] = useTweaks(window.PAUTA_TWEAK_DEFAULTS || {
    accent: "#B8533A", showElapsed: true, density: "cozy",
  });

  const [tab, setTab] = useState("pauta");
  const [pendingIntention, setPendingIntention] = useState(null);

  const jumpToPauta = ({ intention }) => {
    setPendingIntention(intention);
    setTab("pauta");
  };

  const accentColor = t.accent;

  // Update CSS var so design system follows accent
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
  }, [accentColor]);

  return (
    <div className="frame">
      <StatusBar/>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
        {tab === "hoje" && (
          <TabHoje store={store} accentColor={accentColor}
            onJumpToPauta={jumpToPauta}/>
        )}
        {tab === "pauta" && (
          <TabPauta store={store} accentColor={accentColor}
            showElapsed={t.showElapsed}
            pendingIntention={pendingIntention}
            clearPending={() => setPendingIntention(null)}/>
        )}
        {tab === "mares" && (
          <TabMares store={store} accentColor={accentColor}/>
        )}
      </div>

      <TabBar tab={tab} onTab={setTab} accentColor={accentColor}/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Cor de destaque"/>
        <TweakColor
          label="Acento" value={t.accent}
          options={["#B8533A", "#5A6B3E", "#3D5A80", "#8E5A8E", "#1A1815"]}
          onChange={v => setTweak("accent", v)}
        />
        <TweakSection label="Pauta"/>
        <TweakToggle label="Cronómetro visível" value={t.showElapsed}
          onChange={v => setTweak("showElapsed", v)}/>
        <TweakSection label="Dados"/>
        <TweakButton label="Recarregar exemplo" onClick={store.reseed}/>
        <TweakButton label="Apagar tudo" onClick={store.resetAll} secondary={true}/>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
