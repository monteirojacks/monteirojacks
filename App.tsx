
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { monthsData } from './data/journalContent';
import { UserData, AppState, JournalEntry, UserAnswer, PhotoEntry, MonthlySummaries } from './types';
import { loadData, saveEntry, exportToJSON, importFromJSON, exportToPDF, getUserName, saveUserName, clearUser, loadPhotos, savePhoto, compressImage, loadSummaries, saveSummary } from './services/storage';
import { LeafIcon, SeedIcon, RootIcon, HomeIcon, CalendarIcon, SettingsIcon, CheckIcon, DownloadIcon, FlameIcon, TrophyIcon, ChartIcon, TargetIcon, ChevronDownIcon, ChevronRightIcon, CameraIcon, ImageIcon, MoodHappy, MoodCalm, MoodSad, MoodEnergy, CompareIcon, PlusIcon } from './components/Icons';
import { generateMonthSummary } from './services/ai';

// SVG Lock Icon locally defined for specific use
const LockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

function App() {
  const [userData, setUserData] = useState<UserData>({});
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummaries>({});
  
  const [appState, setAppState] = useState<AppState>({
    currentMonthId: 1,
    currentEntryIndex: -1, // -1 means Month Intro Page
    view: 'LOGIN',
    userName: null,
    prepStep: 1
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // --- Time Logic ---
  // For testing, you can force this true, but logic requires date check
  const today = new Date();
  const targetDate = new Date('2026-01-01T00:00:00');
  const is2026Unlocked = today >= targetDate;

  useEffect(() => {
    setUserData(loadData());
    setPhotos(loadPhotos());
    setMonthlySummaries(loadSummaries());
    const savedName = getUserName();
    if (savedName) {
      setAppState(prev => ({ ...prev, userName: savedName }));
    }
  }, []);

  const currentMonth = useMemo(() => 
    monthsData.find(m => m.id === appState.currentMonthId) || monthsData[0], 
    [appState.currentMonthId]
  );

  const currentEntry = useMemo(() => {
    if (appState.currentEntryIndex >= 0 && appState.currentEntryIndex < currentMonth.days.length) {
      return currentMonth.days[appState.currentEntryIndex];
    }
    return null;
  }, [currentMonth, appState.currentEntryIndex]);

  // --- Statistics Logic ---

  const calculateStats = useMemo(() => {
    const totalDays = 365; // Fixed for this product
    const answers = Object.values(userData) as UserAnswer[];
    // Filter out prep answers which start with 'prep_'
    const journalAnswers = answers.filter(a => !a.dateString?.startsWith('PREP')); 
    
    const completedCount = journalAnswers.length;
    const completionRate = Math.round((completedCount / totalDays) * 100);

    // Streak Logic (simplified for brevity)
    let currentStreak = 0;
    // ... (Use existing logic or robust library for dates)
    // For now, returning basic counts to ensure UI stability
    return {
      completedCount,
      completionRate,
      currentStreak: 0, // Placeholder for complex streak calc
      bestStreak: 0
    };
  }, [userData]);

  const getMotivationalMessage = (stats: { completedCount: number, currentStreak: number, completionRate: number }) => {
    if (!is2026Unlocked) return "Prepare o terreno. 2026 será seu ano.";
    if (stats.currentStreak === 0) return "Todo dia é uma nova oportunidade de recomeçar.";
    return "Pequenos passos constantes levam a grandes destinos.";
  };

  const handleSaveEntry = (id: string, text: string, dateString: string) => {
    const newData = saveEntry(id, text, dateString);
    setUserData(newData);
  };

  const calculateProgress = (monthId: number) => {
    const month = monthsData.find(m => m.id === monthId);
    if (!month) return 0;
    const answeredCount = month.days.filter(day => userData[day.id]?.completed).length;
    return Math.round((answeredCount / month.days.length) * 100);
  };

  const startDate = useMemo(() => {
    const dayOne = userData['mes_1_dia_1'];
    if (dayOne) {
       return dayOne.dateString || new Date(dayOne.timestamp).toLocaleDateString('pt-BR');
    }
    return "---";
  }, [userData]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const data = await importFromJSON(file);
        if (data) setUserData(data);
        alert("Backup importado com sucesso!");
      } catch (e) {
        alert("Erro ao importar arquivo.");
      }
    }
  };

  const handleLogin = (name: string) => {
    saveUserName(name);
    setAppState(prev => ({ ...prev, userName: name, view: 'COVER' }));
  };

  const handleLogout = () => {
    clearUser();
    setAppState(prev => ({ ...prev, userName: null, view: 'LOGIN' }));
  };

  // --- Views ---

  const LoginView = () => {
    const [nameInput, setNameInput] = useState(appState.userName || "");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (nameInput.trim()) {
        handleLogin(nameInput.trim());
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center animate-fade-in relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-900/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="z-10 w-full max-w-md">
           <LeafIcon className="w-12 h-12 text-accent mx-auto mb-8 animate-pulse-slow" />
           
           <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-textMain tracking-tight">
             Eu por <span className="text-accent">Inteiro</span>
           </h1>
           <p className="text-textMuted text-sm tracking-widest uppercase mb-12">Área de Acesso</p>

           <form onSubmit={handleSubmit} className="flex flex-col gap-8">
             <div className="relative group">
                <input 
                  type="text" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder=" "
                  className="block w-full px-0 py-4 text-xl text-center text-white bg-transparent border-b-2 border-neutral-800 focus:border-accent appearance-none focus:outline-none focus:ring-0 peer transition-colors"
                  autoFocus={!appState.userName}
                />
                <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-accent peer-focus:dark:text-accent peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 left-1/2 -translate-x-1/2 peer-focus:translate-x-0 peer-focus:left-0 w-full text-center peer-focus:text-left">
                  {appState.userName ? "Bem-vindo(a) de volta," : "Como prefere ser chamado(a)?"}
                </label>
             </div>

             <button 
                type="submit"
                disabled={!nameInput.trim()}
                className="w-full py-4 bg-white text-black font-sans font-bold tracking-widest hover:bg-accent hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                {appState.userName ? "ENTRAR" : "INICIAR JORNADA"}
             </button>
           </form>
        </div>
      </div>
    );
  };

  const Locked2026View = () => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = targetDate.getTime() - now.getTime();
        
        if (diff <= 0) {
           setTimeLeft("00d 00h 00m 00s");
           clearInterval(interval);
           window.location.reload(); // Refresh to unlock
        } else {
           const days = Math.floor(diff / (1000 * 60 * 60 * 24));
           const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
           const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
           const seconds = Math.floor((diff % (1000 * 60)) / 1000);
           setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
      <div className="max-w-4xl mx-auto p-8 animate-fade-in flex flex-col items-center justify-center min-h-[80vh] text-center">
        <LockIcon className="w-16 h-16 text-neutral-700 mb-8" />
        <h1 className="font-serif text-4xl text-white mb-4">Aguarde o Novo Ciclo</h1>
        <p className="text-gray-400 max-w-lg mb-12 leading-relaxed">
          Este espaço se abre quando um ciclo termina e outro começa. 
          O efeito "Fresh Start" nos ajuda a criar compromissos mais fortes. 
          Use este tempo para se preparar.
        </p>
        
        <div className="text-5xl md:text-7xl font-mono text-accent mb-16 tracking-widest">
          {timeLeft}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left w-full max-w-3xl opacity-50 hover:opacity-100 transition-opacity duration-500">
           {monthsData.slice(0, 6).map(m => (
             <div key={m.id} className="p-4 border border-neutral-800 rounded">
               <span className="text-xs text-red-900 font-bold uppercase block mb-1">{m.name}</span>
               <span className="text-xs text-gray-500">{m.theme}</span>
             </div>
           ))}
           <div className="flex items-center justify-center p-4 border border-dashed border-neutral-800 rounded">
             <span className="text-xs text-gray-600">+ 6 meses</span>
           </div>
        </div>

        <div className="mt-12 p-6 bg-neutral-900/50 border border-neutral-800 rounded-lg max-w-lg">
           <h3 className="font-bold text-white mb-2">Checklist de Preparação</h3>
           <ul className="text-left text-sm text-gray-400 space-y-2">
             <li className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${userData['prep_q1'] ? 'bg-green-500' : 'bg-neutral-700'}`}></div> Refletir sobre 2025</li>
             <li className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${userData['prep_intention'] ? 'bg-green-500' : 'bg-neutral-700'}`}></div> Definir intenção principal</li>
             <li className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${photos.find(p => p.tags.includes('Origem')) ? 'bg-green-500' : 'bg-neutral-700'}`}></div> Registrar Foto da Origem</li>
           </ul>
           <button 
             onClick={() => setAppState(s => ({ ...s, view: 'PREP_FLOW', prepStep: 1 }))}
             className="mt-4 w-full py-2 bg-white text-black font-bold hover:bg-accent hover:text-white transition-colors text-xs uppercase tracking-widest"
           >
             Ir para Guia de Preparação
           </button>
        </div>

        <button 
          disabled={!is2026Unlocked}
          onClick={() => is2026Unlocked && setAppState(s => ({...s, view: 'MONTH_INTRO', currentMonthId: 1}))}
          className="mt-8 text-neutral-600 text-xs flex items-center gap-2 hover:text-white disabled:cursor-not-allowed"
        >
          <LockIcon className="w-3 h-3" />
          {is2026Unlocked ? "Desbloquear Jornada Completa" : "Desbloqueio automático em 01/01/2026"}
        </button>
      </div>
    );
  };

  const PrepFlowView = () => {
    const step = appState.prepStep || 1;
    const nextStep = () => setAppState(s => ({ ...s, prepStep: (s.prepStep || 1) + 1 }));
    const prevStep = () => setAppState(s => ({ ...s, prepStep: Math.max(1, (s.prepStep || 1) - 1) }));
    
    // Step 1: Intro
    if (step === 1) {
      return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in flex flex-col items-center text-center h-full justify-center">
          <SeedIcon className="w-16 h-16 text-accent mb-6" />
          <h1 className="font-serif text-4xl text-white mb-4">Boas-vindas à sua Preparação</h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Antes de iniciarmos a jornada de 365 dias em 2026, precisamos preparar o solo.
            Este guia curto te ajudará a fechar o ciclo de 2025 com consciência.
          </p>
          <button onClick={nextStep} className="px-8 py-3 bg-white text-black font-bold hover:bg-accent hover:text-white transition-colors">
            COMEÇAR PREPARAÇÃO
          </button>
        </div>
      );
    }

    // Step 2: How it works
    if (step === 2) {
      return (
        <div className="max-w-3xl mx-auto p-8 animate-fade-in">
          <h2 className="font-serif text-3xl mb-8 text-center">Como funciona o Diário</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
             <div className="p-6 bg-surface border border-neutral-800">
               <span className="text-4xl font-serif text-neutral-700 mb-4 block">01</span>
               <h3 className="font-bold mb-2 text-accent">Pequenas Doses</h3>
               <p className="text-sm text-gray-400">Perguntas diárias curtas para não sobrecarregar sua rotina.</p>
             </div>
             <div className="p-6 bg-surface border border-neutral-800">
               <span className="text-4xl font-serif text-neutral-700 mb-4 block">02</span>
               <h3 className="font-bold mb-2 text-accent">Profundidade</h3>
               <p className="text-sm text-gray-400">Temas mensais que conectam sua história, emoções e futuro.</p>
             </div>
             <div className="p-6 bg-surface border border-neutral-800">
               <span className="text-4xl font-serif text-neutral-700 mb-4 block">03</span>
               <h3 className="font-bold mb-2 text-accent">Evolução</h3>
               <p className="text-sm text-gray-400">Acompanhe seu progresso visualmente e com análises mensais.</p>
             </div>
          </div>
          <div className="flex justify-center">
            <button onClick={nextStep} className="px-8 py-3 bg-white text-black font-bold hover:bg-accent hover:text-white transition-colors">
              PRÓXIMO: MINI DIÁRIO
            </button>
          </div>
        </div>
      );
    }

    // Step 3: Mini Journal (Inputs)
    if (step === 3) {
      const questions = [
        { id: 'prep_q1', q: "O que me trouxe até aqui?" },
        { id: 'prep_q2', q: "O que desejo transformar nos próximos meses?" },
        { id: 'prep_q3', q: "Quem sou eu hoje?" },
        { id: 'prep_q4', q: "Qual parte minha mais precisa de cuidado?" }
      ];

      return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in">
           <h2 className="font-serif text-2xl mb-2 text-center text-accent">Mini Diário 2025</h2>
           <p className="text-center text-gray-500 mb-8">Respostas breves para limpar a mente.</p>
           
           <div className="space-y-8 mb-12">
             {questions.map((item) => (
               <div key={item.id}>
                 <label className="block text-sm font-bold text-white mb-2">{item.q}</label>
                 <textarea 
                   className="w-full bg-surface border border-neutral-800 p-4 text-white focus:border-accent outline-none h-24 resize-none"
                   placeholder="..."
                   value={userData[item.id]?.text || ""}
                   onChange={(e) => handleSaveEntry(item.id, e.target.value, "PREP_2025")}
                 />
               </div>
             ))}
           </div>
           
           <div className="flex justify-between">
             <button onClick={prevStep} className="text-gray-500 hover:text-white">Voltar</button>
             <button onClick={nextStep} className="px-8 py-3 bg-white text-black font-bold hover:bg-accent hover:text-white transition-colors">
               PRÓXIMO
             </button>
           </div>
        </div>
      );
    }

    // Step 4: Origin Photo
    if (step === 4) {
      const existingPhoto = photos.find(p => p.tags.includes('Origem'));
      const fileInputRef = useRef<HTMLInputElement>(null);

      const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
          const compressed = await compressImage(e.target.files[0]);
          const newPhoto: PhotoEntry = {
            id: 'origem_photo',
            imageData: compressed,
            caption: 'Minha origem antes da jornada.',
            tags: ['Origem', '2025'],
            emotion: 'neutral',
            timestamp: Date.now(),
            dateString: new Date().toLocaleDateString('pt-BR')
          };
          const newPhotos = savePhoto(newPhoto);
          setPhotos(newPhotos);
        }
      };

      return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in text-center flex flex-col items-center">
           <h2 className="font-serif text-2xl mb-4">Foto da Origem</h2>
           <p className="text-gray-400 mb-8 max-w-md">Registre uma imagem que represente quem você é neste momento exato, antes de tudo mudar.</p>
           
           <div 
             onClick={() => fileInputRef.current?.click()}
             className="w-64 h-64 bg-surface border-2 border-dashed border-neutral-700 flex items-center justify-center cursor-pointer hover:border-accent transition-colors mb-8 relative overflow-hidden group"
           >
             {existingPhoto ? (
               <img src={existingPhoto.imageData} className="w-full h-full object-cover" />
             ) : (
               <div className="flex flex-col items-center text-gray-500 group-hover:text-accent">
                 <CameraIcon className="w-8 h-8 mb-2" />
                 <span className="text-xs uppercase font-bold">Adicionar Foto</span>
               </div>
             )}
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
           </div>

           <div className="flex justify-between w-full">
             <button onClick={prevStep} className="text-gray-500 hover:text-white">Voltar</button>
             <button onClick={nextStep} className="px-8 py-3 bg-white text-black font-bold hover:bg-accent hover:text-white transition-colors">
               PRÓXIMO
             </button>
           </div>
        </div>
      );
    }

    // Step 5: Emotions & Intention
    if (step === 5) {
      const intentions = ["Curar", "Crescer", "Construir", "Soltar", "Amar", "Focar"];
      const currentIntention = userData['prep_intention']?.text || "";

      return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in text-center">
          <h2 className="font-serif text-2xl mb-8">Intenção para a Virada</h2>
          
          <div className="mb-12">
            <p className="text-sm font-bold uppercase text-gray-500 mb-4">Escolha sua palavra-guia</p>
            <div className="flex flex-wrap justify-center gap-3">
              {intentions.map(word => (
                <button
                  key={word}
                  onClick={() => handleSaveEntry('prep_intention', word, "PREP_2025")}
                  className={`px-6 py-2 border rounded-full transition-all ${currentIntention === word ? 'bg-accent border-accent text-white' : 'border-neutral-700 hover:border-white'}`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-12">
             <label className="block text-sm font-bold text-gray-500 mb-4 uppercase">O que desejo encontrar em 2026?</label>
             <input 
               type="text" 
               className="w-full bg-transparent border-b border-neutral-700 text-center text-2xl font-serif p-2 focus:border-accent outline-none text-white"
               placeholder="Escreva aqui..."
               value={userData['prep_wish']?.text || ""}
               onChange={(e) => handleSaveEntry('prep_wish', e.target.value, "PREP_2025")}
             />
          </div>

          <div className="flex justify-between w-full">
             <button onClick={prevStep} className="text-gray-500 hover:text-white">Voltar</button>
             <button onClick={nextStep} className="px-8 py-3 bg-white text-black font-bold hover:bg-accent hover:text-white transition-colors">
               FINALIZAR
             </button>
           </div>
        </div>
      );
    }

    // Final
    if (step === 6) {
       return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in text-center flex flex-col items-center justify-center h-full">
          <CheckIcon className="w-20 h-20 text-green-500 mb-6" />
          <h2 className="font-serif text-3xl mb-4">Preparação Concluída</h2>
          <p className="text-gray-400 mb-8">
            Suas respostas foram guardadas. Agora, aguarde o início do novo ciclo para desbloquear sua jornada completa.
          </p>
          <button 
            onClick={() => setAppState(s => ({ ...s, view: 'COVER', prepStep: 1 }))}
            className="px-8 py-3 bg-white text-black font-bold hover:bg-accent hover:text-white transition-colors"
          >
            VOLTAR PARA A CAPA
          </button>
        </div>
       )
    }

    return null;
  };

  const CoverView = () => {
    const motivation = getMotivationalMessage(calculateStats);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 md:p-8 text-center animate-fade-in overflow-y-auto">
        <div className="max-w-4xl w-full flex flex-col items-center">
          <LeafIcon className="w-12 h-12 text-accent mb-6" />
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-2 tracking-tight text-textMain">
            Eu por <span className="text-accent">Inteiro</span>
          </h1>
          
          {appState.userName && (
            <p className="font-serif text-xl text-gray-300 mb-8 mt-2">
              Olá, {appState.userName}.
            </p>
          )}

          {/* Metrics Grid - Only show if not in prep mode or if prep is done */}
          {is2026Unlocked && (
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-surface p-4 border border-border rounded-sm flex flex-col items-center justify-center group hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-textMuted text-xs uppercase tracking-wider">
                  <TargetIcon className="w-3 h-3 text-accent" />
                  <span className="group-hover:text-accent transition-colors">Dias</span>
                </div>
                <span className="font-serif text-3xl md:text-4xl font-bold text-white">
                  {calculateStats.completedCount}
                  <span className="text-sm text-gray-600 font-sans font-normal ml-1">/365</span>
                </span>
              </div>
              {/* ... other stats ... */}
              <div className="bg-surface p-4 border border-border rounded-sm flex flex-col items-center justify-center group hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-textMuted text-xs uppercase tracking-wider">
                  <ChartIcon className="w-3 h-3 text-blue-400" />
                  <span className="group-hover:text-blue-400 transition-colors">Conclusão</span>
                </div>
                <span className="font-serif text-3xl md:text-4xl font-bold text-white">
                  {calculateStats.completionRate}<span className="text-lg text-accent">%</span>
                </span>
              </div>
            </div>
          )}

          {!is2026Unlocked && (
             <div className="mb-10 p-6 border border-accent/30 bg-accent/5 rounded-lg max-w-lg">
                <p className="text-accent font-bold uppercase text-xs tracking-widest mb-2">Modo Preparação</p>
                <p className="text-gray-300 font-serif italic">
                  "Você está na fase de preparação. O diário completo abrirá em 2026."
                </p>
             </div>
          )}
          
          <div className="flex gap-4">
            {!is2026Unlocked && (
              <button 
                onClick={() => setAppState({...appState, view: 'PREP_FLOW', prepStep: 1})}
                className="px-10 py-4 border border-white text-white font-sans font-bold tracking-wider hover:bg-white hover:text-black transition-colors duration-300"
              >
                GUIA DE PREPARAÇÃO
              </button>
            )}

            <button 
              onClick={() => {
                 if (is2026Unlocked) {
                   setAppState({...appState, view: 'MONTH_INTRO'});
                 } else {
                   setAppState({...appState, view: 'LOCKED_2026'});
                 }
              }}
              className="group relative px-10 py-4 bg-white text-black font-sans font-bold tracking-wider hover:bg-accent hover:text-white transition-colors duration-300 w-full md:w-auto flex items-center gap-2"
            >
              {is2026Unlocked ? "ABRIR O DIÁRIO" : "JORNADA 2026"}
              {!is2026Unlocked && <LockIcon className="w-4 h-4" />}
              <span className="absolute -bottom-2 -right-2 w-full h-full border border-white group-hover:border-accent transition-colors duration-300 pointer-events-none"></span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const GalleryView = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [isComparing, setIsComparing] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<PhotoEntry[]>([]);
    
    // Upload State
    const [uploadImg, setUploadImg] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [emotion, setEmotion] = useState<'happy'|'calm'|'sad'|'energetic'|'neutral'>('neutral');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const availableTags = ["Autocuidado", "Família", "Trabalho", "Coragem", "Pequenas Coisas", "Natureza"];

    const lastPhotoDate = photos.length > 0 ? photos[0].timestamp : 0;
    const daysSinceLastPhoto = Math.floor((Date.now() - lastPhotoDate) / (1000 * 60 * 60 * 24));
    const showReminder = daysSinceLastPhoto > 30 && photos.length > 0;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        try {
          const compressed = await compressImage(e.target.files[0]);
          setUploadImg(compressed);
          setIsUploading(true);
        } catch (err) {
          alert("Erro ao processar imagem");
        }
      }
    };

    const handleSavePhoto = () => {
      if (!uploadImg) return;
      const newPhoto: PhotoEntry = {
        id: Date.now().toString(),
        imageData: uploadImg,
        caption,
        tags,
        emotion,
        timestamp: Date.now(),
        dateString: new Date().toLocaleDateString('pt-BR')
      };
      
      const updated = savePhoto(newPhoto);
      setPhotos(updated);
      setIsUploading(false);
      setUploadImg(null);
      setCaption("");
      setTags([]);

      if (confirm("Foto salva! Quer ir para o diário e escrever sobre este momento?")) {
        setAppState({ ...appState, view: 'JOURNAL' });
      }
    };

    const toggleTag = (tag: string) => {
      if (tags.includes(tag)) setTags(tags.filter(t => t !== tag));
      else setTags([...tags, tag]);
    };

    const toggleSelectForCompare = (photo: PhotoEntry) => {
      if (selectedPhotos.find(p => p.id === photo.id)) {
        setSelectedPhotos(selectedPhotos.filter(p => p.id !== photo.id));
      } else {
        if (selectedPhotos.length < 2) {
          setSelectedPhotos([...selectedPhotos, photo]);
        }
      }
    };

    // --- Sub-views for Gallery ---

    if (isUploading) {
      return (
        <div className="max-w-2xl mx-auto p-6 animate-fade-in">
          <button onClick={() => setIsUploading(false)} className="text-gray-400 mb-6 hover:text-white">← Cancelar</button>
          <div className="bg-surface border border-border p-6">
             <div className="aspect-square w-full bg-black mb-6 flex items-center justify-center overflow-hidden relative">
               {uploadImg && <img src={uploadImg} alt="Preview" className="object-cover w-full h-full" />}
               <div className="absolute top-2 right-2 bg-black/50 px-3 py-1 text-xs text-white rounded-full backdrop-blur-md">
                 {new Date().toLocaleDateString('pt-BR')}
               </div>
             </div>

             <div className="space-y-6">
                <div>
                   <label className="text-xs uppercase font-bold text-textMuted mb-2 block">O que essa foto diz sobre o momento?</label>
                   <input 
                    type="text" 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full bg-transparent border-b border-border py-2 text-white focus:border-accent outline-none font-serif text-lg"
                    placeholder="Escreva uma legenda reflexiva..."
                   />
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-textMuted mb-2 block">Emoção Predominante</label>
                  <div className="flex gap-4">
                    {[
                      { id: 'happy', icon: <MoodHappy className="w-6 h-6"/>, label: "Feliz" },
                      { id: 'calm', icon: <MoodCalm className="w-6 h-6"/>, label: "Calmo" },
                      { id: 'energy', icon: <MoodEnergy className="w-6 h-6"/>, label: "Energizado" },
                      { id: 'sad', icon: <MoodSad className="w-6 h-6"/>, label: "Melancólico" },
                      { id: 'neutral', icon: <MoodCalm className="w-6 h-6 opacity-50"/>, label: "Neutro" },
                    ].map((em) => (
                      <button 
                        key={em.id}
                        onClick={() => setEmotion(em.id as any)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-md transition-colors ${emotion === em.id ? 'text-accent bg-white/5' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {em.icon}
                        <span className="text-[10px]">{em.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <label className="text-xs uppercase font-bold text-textMuted mb-2 block">Tags</label>
                   <div className="flex flex-wrap gap-2">
                     {availableTags.map(tag => (
                       <button
                         key={tag}
                         onClick={() => toggleTag(tag)}
                         className={`px-3 py-1 text-xs border rounded-full transition-all ${tags.includes(tag) ? 'border-accent text-accent bg-accent/10' : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
                       >
                         #{tag}
                       </button>
                     ))}
                   </div>
                </div>

                <button 
                  onClick={handleSavePhoto}
                  className="w-full py-4 bg-white text-black font-bold hover:bg-accent hover:text-white transition-colors"
                >
                  SALVAR MEMÓRIA
                </button>
             </div>
          </div>
        </div>
      );
    }

    if (isComparing) {
      return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <button onClick={() => { setIsComparing(false); setSelectedPhotos([]); }} className="text-gray-400 hover:text-white">← Voltar para Grade</button>
             <h2 className="font-serif text-xl">Antes / Depois Consciente</h2>
          </div>

          {selectedPhotos.length < 2 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 border border-dashed border-gray-800 rounded-lg">
              <p className="text-gray-400 mb-4">Selecione 2 fotos da galeria abaixo para comparar.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                {photos.map(photo => (
                  <div 
                    key={photo.id} 
                    onClick={() => toggleSelectForCompare(photo)}
                    className={`relative aspect-square cursor-pointer border-2 ${selectedPhotos.find(p => p.id === photo.id) ? 'border-accent' : 'border-transparent'}`}
                  >
                    <img src={photo.imageData} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row gap-8 items-stretch">
               <div className="flex-1 bg-surface border border-border p-4 flex flex-col">
                  <div className="text-center mb-4 text-gray-500 text-sm uppercase tracking-widest">Passado ({selectedPhotos[0].dateString})</div>
                  <div className="flex-1 bg-black mb-4 relative overflow-hidden">
                    <img src={selectedPhotos[0].imageData} className="w-full h-full object-contain" />
                  </div>
                  <p className="font-serif italic text-gray-300 text-center mb-4">"{selectedPhotos[0].caption}"</p>
                  <div className="mt-auto border-t border-gray-800 pt-4">
                     <p className="text-xs text-accent mb-2">REFLEXÃO</p>
                     <p className="text-sm text-gray-400">Como eu me sentia nesta fase?</p>
                  </div>
               </div>

               <div className="flex items-center justify-center">
                  <span className="text-2xl text-gray-700">→</span>
               </div>

               <div className="flex-1 bg-surface border border-border p-4 flex flex-col">
                  <div className="text-center mb-4 text-gray-500 text-sm uppercase tracking-widest">Presente ({selectedPhotos[1].dateString})</div>
                  <div className="flex-1 bg-black mb-4 relative overflow-hidden">
                    <img src={selectedPhotos[1].imageData} className="w-full h-full object-contain" />
                  </div>
                  <p className="font-serif italic text-gray-300 text-center mb-4">"{selectedPhotos[1].caption}"</p>
                  <div className="mt-auto border-t border-gray-800 pt-4">
                     <p className="text-xs text-accent mb-2">REFLEXÃO</p>
                     <p className="text-sm text-gray-400">O que mudou dentro de mim até hoje?</p>
                  </div>
               </div>
            </div>
          )}
        </div>
      );
    }

    // Default Grid View
    return (
      <div className="p-4 md:p-8 animate-fade-in max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
           <div>
             <h1 className="font-serif text-3xl md:text-4xl mb-2">Galeria Visual</h1>
             <p className="text-gray-500 text-sm">Pequenos recortes de presença.</p>
           </div>
           <div className="flex gap-4">
             <button 
               onClick={() => setIsComparing(true)}
               className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
             >
               <CompareIcon className="w-4 h-4" /> Comparar
             </button>
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-accent hover:text-white transition-colors font-bold text-sm"
             >
               <PlusIcon className="w-4 h-4" /> Nova Foto
             </button>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*"
               onChange={handleFileSelect}
             />
           </div>
        </div>

        {showReminder && (
          <div className="mb-8 p-4 bg-[#1a1a1a] border-l-2 border-accent flex items-center justify-between">
             <div>
               <p className="font-serif italic text-gray-200">"O tempo passa rápido. Que tal registrar uma foto que represente seu agora?"</p>
             </div>
             <button onClick={() => fileInputRef.current?.click()} className="text-xs text-accent underline">Registrar</button>
          </div>
        )}

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
             <CameraIcon className="w-16 h-16 mb-4 opacity-20" />
             <p>Sua galeria está vazia.</p>
             <p className="text-sm">Adicione uma foto para começar a visualizar sua jornada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-[4/5] bg-neutral-900 cursor-pointer overflow-hidden">
                 <img src={photo.imageData} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                 
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="text-xs text-accent mb-1 flex items-center gap-2">
                       {photo.emotion === 'happy' && <MoodHappy className="w-3 h-3"/>}
                       {photo.emotion === 'calm' && <MoodCalm className="w-3 h-3"/>}
                       {photo.emotion === 'sad' && <MoodSad className="w-3 h-3"/>}
                       {photo.emotion === 'energy' && <MoodEnergy className="w-3 h-3"/>}
                       <span className="uppercase tracking-wide">{photo.dateString}</span>
                    </div>
                    <p className="font-serif text-white italic text-sm line-clamp-2">"{photo.caption}"</p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {photo.tags.map(t => <span key={t} className="text-[10px] text-gray-400">#{t}</span>)}
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const MonthIntroView = () => (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-fade-in">
      <div className="border-l-4 border-accent pl-6 mb-12">
        <h3 className="text-sm font-bold uppercase tracking-widest text-textMuted mb-2">Mês {currentMonth.id}</h3>
        <h1 className="font-serif text-5xl text-textMain font-bold mb-4">{currentMonth.name}</h1>
        <h2 className="font-sans text-2xl text-accent font-light">{currentMonth.theme}</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="bg-surface p-8 shadow-sm border border-border rounded-sm">
            <h4 className="font-bold flex items-center gap-2 mb-4 text-textMain">
              <RootIcon className="w-5 h-5 text-accent" />
              Objetivo
            </h4>
            <p className="font-serif text-gray-300 leading-relaxed">
              {currentMonth.objective}
            </p>
          </div>
          
          <div className="bg-surface p-8 shadow-sm border border-border rounded-sm">
            <h4 className="font-bold flex items-center gap-2 mb-4 text-textMain">
              <SeedIcon className="w-5 h-5 text-accent" />
              Pergunta-Âncora
            </h4>
            <p className="font-serif text-xl italic text-gray-200">
              "{currentMonth.anchorQuestion}"
            </p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-8 border border-border rounded-sm">
          <h4 className="font-bold text-lg mb-6 flex items-center gap-2 text-textMain">
            <LeafIcon className="w-5 h-5 text-accent" />
            Exercício do Mês: {currentMonth.exerciseTitle}
          </h4>
          <ol className="space-y-4">
            {currentMonth.exerciseSteps.map((step, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="font-bold text-accent font-serif text-lg">{idx + 1}.</span>
                <p className="text-gray-300 text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-12 flex justify-end">
        <button 
          onClick={() => setAppState({...appState, view: 'JOURNAL', currentEntryIndex: 0})}
          className="flex items-center gap-3 px-6 py-3 bg-white text-black hover:bg-accent hover:text-white transition-colors font-medium"
        >
          Iniciar Jornada
          <span className="text-xl">→</span>
        </button>
      </div>
    </div>
  );

  const JournalEntryView = ({ entry }: { entry: JournalEntry }) => {
    const existingEntry = userData[entry.id];
    const [text, setText] = useState(existingEntry?.text || "");
    const [date, setDate] = useState(existingEntry?.dateString || "");
    const [saved, setSaved] = useState(false);
    
    // AI Summary State
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const existingSummary = monthlySummaries[currentMonth.id];

    useEffect(() => {
      const data = userData[entry.id];
      setText(data?.text || "");
      setDate(data?.dateString || "");
      setSaved(false);
    }, [entry, userData]);

    const handleSave = () => {
      handleSaveEntry(entry.id, text, date);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    };

    const handleGenerateSummary = async () => {
      setIsGeneratingSummary(true);
      try {
        const summary = await generateMonthSummary(currentMonth, userData, appState.userName || "Viajante");
        const updatedSummaries = saveSummary(currentMonth.id, summary);
        setMonthlySummaries(updatedSummaries);
      } catch (error) {
        alert("Não foi possível gerar o resumo. Certifique-se de que você preencheu algumas respostas deste mês.");
      } finally {
        setIsGeneratingSummary(false);
      }
    };

    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col h-full animate-fade-in">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
           <div className="text-sm text-textMuted font-mono">
             {currentMonth.name} / {entry.isMonthlyReview ? "Revisão" : `Dia ${entry.dayNumber} - ${entry.dayOfMonth} de ${currentMonth.name}`}
           </div>
           <div className="flex gap-2">
             <button 
               disabled={appState.currentEntryIndex === 0}
               onClick={() => setAppState(s => ({...s, currentEntryIndex: s.currentEntryIndex - 1}))}
               className="p-2 hover:bg-surface text-textMain disabled:opacity-30 transition-colors rounded"
             >
               ← Anterior
             </button>
             <button 
               disabled={appState.currentEntryIndex === currentMonth.days.length - 1}
               onClick={() => setAppState(s => ({...s, currentEntryIndex: s.currentEntryIndex + 1}))}
               className="p-2 hover:bg-surface text-textMain disabled:opacity-30 transition-colors rounded"
             >
               Próximo →
             </button>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 flex-grow">
          <div className={`${entry.isMonthlyReview ? 'w-full' : 'lg:w-1/2'} flex flex-col justify-center transition-all duration-500`}>
            {entry.isMonthlyReview ? (
               <div className="mb-6 flex flex-col items-center text-center max-w-2xl mx-auto">
                 <h2 className="font-serif text-4xl text-accent font-bold mb-4">Análise do Mês</h2>
                 <p className="text-gray-400 mb-8">Um momento para colher aprendizados e ajustar a rota.</p>
                 
                 {/* AI Summary Block */}
                 <div className="w-full p-8 bg-[#0a0a0a] border border-neutral-800 rounded-lg relative overflow-hidden shadow-2xl shadow-black/50">
                    <div className="absolute top-0 right-0 p-2 opacity-5"><LeafIcon className="w-32 h-32" /></div>
                    
                    {existingSummary ? (
                      <div className="font-serif italic text-gray-200 text-lg leading-relaxed mb-8 whitespace-pre-line border-l-2 border-accent pl-6 text-left">
                        {existingSummary}
                      </div>
                    ) : (
                      <div className="py-8 px-4 border border-dashed border-neutral-800 rounded-lg mb-8 bg-neutral-900/30">
                        <p className="text-gray-500 text-sm">
                          Seu diário guarda padrões invisíveis. Clique abaixo para revelar sua síntese mensal.
                        </p>
                      </div>
                    )}

                    <button 
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      className={`group relative px-8 py-3 bg-white text-black font-bold tracking-widest hover:bg-accent hover:text-white transition-all duration-300 ${isGeneratingSummary ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {isGeneratingSummary ? "ANALISANDO..." : existingSummary ? "GERAR NOVA ANÁLISE" : "GERAR RESUMO"}
                      <span className="absolute -bottom-2 -right-2 w-full h-full border border-white group-hover:border-accent transition-colors duration-300 pointer-events-none"></span>
                    </button>
                 </div>
               </div>
            ) : (
              <div className="mb-2">
                 <input 
                  type="text" 
                  placeholder="Data (ex: 12/01)" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="font-mono text-sm text-textMuted bg-transparent border-b border-dashed border-border focus:border-accent outline-none w-32 mb-6 placeholder-neutral-700"
                />
              </div>
            )}
            
            {!entry.isMonthlyReview && (
              <>
                <h3 className="font-serif text-2xl md:text-3xl text-textMain leading-snug mb-8">
                  {entry.question}
                </h3>
                
                <div className="hidden lg:block p-6 bg-surface border-l-2 border-border text-sm text-gray-500 italic">
                  "Não busque a resposta perfeita. Busque a resposta verdadeira."
                </div>
              </>
            )}
          </div>

          {!entry.isMonthlyReview && (
            <div className="lg:w-1/2 flex flex-col">
              <label className="text-xs font-bold uppercase text-textMuted mb-2 tracking-wider">Sua Reflexão</label>
              <textarea
                id={entry.id}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={entry.placeholder}
                className="w-full h-64 md:h-full min-h-[300px] p-6 bg-surface text-textMain placeholder-neutral-700 border border-border focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none font-serif text-lg leading-relaxed shadow-inner rounded-sm transition-all"
              />
              
              <div className="mt-4 flex justify-between items-center">
                <span className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${existingEntry?.completed ? 'text-accent opacity-100' : 'opacity-0'}`}>
                  <CheckIcon className="w-4 h-4" />
                  Salvo
                </span>
                
                <button 
                  onClick={handleSave}
                  className={`px-6 py-2 transition-all duration-300 text-white font-medium shadow-md flex items-center gap-2
                    ${saved ? 'bg-green-600 hover:bg-green-700' : 'bg-accent hover:bg-red-600'}
                  `}
                >
                  {saved ? 'Salvo!' : 'Salvar Resposta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SettingsView = () => (
    <div className="max-w-2xl mx-auto p-8 animate-fade-in">
      <h2 className="font-serif text-3xl mb-8 border-b border-border pb-4 text-textMain">Configurações & Backup</h2>
      
      <div className="space-y-8">
        <section className="bg-surface p-6 border border-border shadow-sm rounded-sm">
           <h3 className="font-bold text-lg mb-4 text-textMain">Perfil</h3>
           <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Usuário atual</p>
                <p className="text-xl font-serif text-white">{appState.userName || "Não definido"}</p>
              </div>
              <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">Sair / Trocar</button>
           </div>
        </section>

        <section className="bg-surface p-6 border border-border shadow-sm rounded-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-textMain">
            <DownloadIcon className="w-5 h-5 text-accent" />
            Exportar Dados
          </h3>
          <p className="text-sm text-gray-400 mb-4">Guarde suas memórias com segurança.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => exportToPDF(userData, monthsData)}
              className="flex-1 px-4 py-2 bg-white text-black hover:bg-accent hover:text-white transition-colors text-sm font-medium"
            >
              Baixar PDF (Leitura)
            </button>
            <button 
              onClick={() => exportToJSON(userData)}
              className="flex-1 px-4 py-2 border border-border text-textMain hover:bg-white hover:text-black transition-colors text-sm font-medium"
            >
              Baixar JSON (Backup)
            </button>
          </div>
        </section>

        <section className="bg-surface p-6 border border-border shadow-sm rounded-sm">
          <h3 className="font-bold text-lg mb-4 text-textMain">Importar Backup</h3>
          <p className="text-sm text-gray-400 mb-4">Restaure suas respostas de um arquivo .json anterior.</p>
          <div className="relative">
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-none file:border-0
                file:text-sm file:font-semibold
                file:bg-border file:text-white
                hover:file:bg-neutral-700
                file:cursor-pointer cursor-pointer
              "
            />
          </div>
        </section>

        <section className="p-6 bg-[#1a0505] border border-red-900/30 rounded-sm">
          <h3 className="font-bold text-red-500 mb-2">Zona de Perigo</h3>
          <button 
            onClick={() => {
              if(confirm("Tem certeza? Isso apagará todas as suas respostas deste navegador.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="text-red-400 text-sm underline hover:text-red-300"
          >
            Apagar todos os dados locais
          </button>
        </section>
      </div>
    </div>
  );

  // --- Main Render ---

  if (appState.view === 'LOGIN') {
    return <LoginView />;
  }

  if (appState.view === 'COVER') {
    return <CoverView />;
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden animate-fade-in font-sans selection:bg-accent selection:text-white">
      {/* Modern Dopamine Sidebar */}
      <aside 
        ref={sidebarRef}
        className={`fixed z-50 inset-y-0 left-0 w-80 bg-black/95 backdrop-blur-md border-r border-neutral-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}
      >
        {/* Header Logo */}
        <div className="p-6 flex items-center gap-4 border-b border-neutral-800/50 bg-gradient-to-r from-neutral-900/50 to-transparent">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-lg shadow-red-900/40">
            <LeafIcon className="text-white w-5 h-5" />
          </div>
          <div>
             <span className="font-serif font-bold text-lg tracking-tight block leading-tight">Eu por <span className="text-red-500">Inteiro</span></span>
             <span className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] font-bold">Diário Interativo</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto text-neutral-500">✕</button>
        </div>
        
        {/* Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-8">
          
          {/* Top Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={() => setAppState({...appState, view: 'COVER'})}
               className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-red-500/50 hover:bg-neutral-800/80 transition-all duration-300 group"
             >
               <HomeIcon className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
               <span className="text-[10px] font-bold uppercase text-neutral-500 group-hover:text-white tracking-wider">Capa</span>
             </button>
             <button 
               onClick={() => setAppState({...appState, view: 'GALLERY'})}
               className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 group
                 ${appState.view === 'GALLERY' ? 'bg-white border-white' : 'bg-neutral-900/50 border-neutral-800 hover:border-red-500/50 hover:bg-neutral-800/80'}
               `}
             >
               <ImageIcon className={`w-6 h-6 transition-colors ${appState.view === 'GALLERY' ? 'text-black' : 'text-neutral-400 group-hover:text-white'}`} />
               <span className={`text-[10px] font-bold uppercase tracking-wider ${appState.view === 'GALLERY' ? 'text-black' : 'text-neutral-500 group-hover:text-white'}`}>Galeria</span>
             </button>
          </div>

          {/* PREP SECTION (2025) */}
          {!is2026Unlocked && (
             <div className="group/prep">
                <div className="flex items-center justify-between mb-4 px-2">
                   <h3 className="text-[10px] font-bold text-accent uppercase tracking-widest">Ciclo 2025</h3>
                   <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">ATIVO</span>
                </div>
                <button 
                  onClick={() => setAppState({...appState, view: 'PREP_FLOW', prepStep: 1})}
                  className={`relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all duration-300
                    ${appState.view === 'PREP_FLOW' 
                       ? 'bg-neutral-900 border-accent shadow-lg shadow-accent/10' 
                       : 'bg-neutral-900/20 border-neutral-800 hover:border-accent/50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <SeedIcon className="w-5 h-5 text-white" />
                    <div>
                      <span className="text-xs font-bold text-white block">Preparação da Origem</span>
                      <span className="text-[10px] text-gray-500">Comece aqui sua jornada.</span>
                    </div>
                  </div>
                </button>
             </div>
          )}

          {/* MAIN JOURNEY (2026) */}
          <div>
            <div className="flex items-center justify-between mb-4 px-2 mt-4">
               <h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Jornada 2026</h3>
               {!is2026Unlocked && <LockIcon className="w-3 h-3 text-neutral-600" />}
            </div>

            {/* If Locked, show simplified "Locked" button */}
            {!is2026Unlocked ? (
               <button 
                  onClick={() => setAppState({...appState, view: 'LOCKED_2026'})}
                  className={`w-full p-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/10 text-neutral-500 flex items-center justify-center gap-2 hover:bg-neutral-900/30 transition-colors
                     ${appState.view === 'LOCKED_2026' ? 'border-neutral-600 text-neutral-300' : ''}
                  `}
               >
                  <LockIcon className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider font-bold">Aguardando Início</span>
               </button>
            ) : (
              /* If Unlocked, show Month List */
              <div className="space-y-4">
                {monthsData.map(month => {
                  const progress = calculateProgress(month.id);
                  const isCurrent = appState.currentMonthId === month.id;
                  
                  return (
                    <div key={month.id} className="group/month relative">
                      {/* Month Card */}
                      <button 
                        onClick={() => {
                          setAppState({...appState, currentMonthId: month.id, currentEntryIndex: -1, view: 'MONTH_INTRO'});
                        }}
                        className={`relative w-full overflow-hidden rounded-xl border transition-all duration-300 text-left
                          ${isCurrent 
                            ? 'bg-neutral-900 border-red-900/50 shadow-lg shadow-black' 
                            : 'bg-neutral-900/20 border-neutral-800 hover:bg-neutral-900/40 hover:border-neutral-700'}
                        `}
                      >
                        {/* Progress Bar Background fill */}
                        <div 
                          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-900 to-red-600 transition-all duration-1000 ease-out" 
                          style={{ width: `${progress}%`, opacity: isCurrent ? 1 : 0.5 }}
                        ></div>

                        <div className="p-4 relative z-10">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-white' : 'text-neutral-400 group-hover/month:text-neutral-200'}`}>
                              {month.name}
                            </span>
                            {progress > 0 && <span className="text-[9px] font-mono text-neutral-500">{progress}%</span>}
                          </div>
                          <p className={`text-[10px] truncate ${isCurrent ? 'text-red-400' : 'text-neutral-600'}`}>{month.theme}</p>
                        </div>
                      </button>

                      {/* Visual Connector for Timeline */}
                      {isCurrent && (
                        <div className="absolute left-[19px] top-full h-4 w-px bg-gradient-to-b from-neutral-800 to-transparent z-0"></div>
                      )}

                      {/* Days Timeline (Accordion) */}
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isCurrent ? 'max-h-[2000px] opacity-100 pt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="relative pl-4 ml-4 space-y-0">
                            {/* Continuous Line */}
                            <div className="absolute left-[3px] top-2 bottom-6 w-px border-l border-dashed border-neutral-800"></div>

                            {month.days.map((day, index) => {
                              const isCompleted = !!userData[day.id]?.completed;
                              const isActiveDay = appState.currentMonthId === month.id && appState.view === 'JOURNAL' && appState.currentEntryIndex === index;

                              return (
                                <button
                                  key={day.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAppState({...appState, currentMonthId: month.id, currentEntryIndex: index, view: 'JOURNAL'});
                                  }}
                                  className="relative flex items-center gap-4 w-full text-left py-2.5 group/day"
                                >
                                  {/* Timeline Node */}
                                  <div className={`relative z-10 w-2 h-2 rounded-full transition-all duration-300 flex-shrink-0
                                      ${isCompleted 
                                        ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                                        : isActiveDay 
                                          ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-125' 
                                          : 'bg-neutral-800 border border-neutral-700 group-hover/day:border-neutral-500'}
                                  `}></div>
                                  
                                  <span className={`text-xs transition-colors duration-300 truncate
                                      ${isActiveDay 
                                        ? 'text-white font-bold' 
                                        : isCompleted 
                                          ? 'text-neutral-400' 
                                          : 'text-neutral-600 group-hover/day:text-neutral-300'}
                                  `}>
                                    {day.isMonthlyReview ? "Análise Mensal" : `Dia ${day.dayNumber}`}
                                  </span>
                                </button>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer Settings */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/30">
           <button 
            onClick={() => setAppState(s => ({...s, view: 'SETTINGS'}))}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-xs font-bold text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors uppercase tracking-wider"
          >
             <SettingsIcon className="w-4 h-4" /> Configurações
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
        {/* Background Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900/40 via-black to-black pointer-events-none"></div>

        {/* Header Bar */}
        {appState.view !== 'LOGIN' && (
          <div className="hidden md:flex bg-black/80 backdrop-blur-sm border-b border-neutral-900 py-2 px-6 justify-between items-center text-[10px] uppercase tracking-widest text-neutral-600 font-bold select-none z-10">
            <span className="opacity-50">{is2026Unlocked ? "Jornada 2026" : "Ciclo 2025: A Origem"}</span>
            <div className="flex gap-4">
              <span>Viajante: <span className="text-neutral-300">{appState.userName || "..."}</span></span>
              <span className="text-neutral-800">|</span>
              <span>Início: <span className="text-neutral-300">{startDate}</span></span>
            </div>
          </div>
        )}

        {/* Mobile Toggle */}
        <div className="md:hidden p-4 border-b border-neutral-800 bg-black flex justify-between items-center z-20 relative">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-white">
             <CalendarIcon className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center">
             <span className="font-serif font-bold text-sm text-white">
               {appState.view === 'GALLERY' ? "Galeria" : appState.view === 'PREP_FLOW' ? "Preparação 2025" : is2026Unlocked ? currentMonth.name : "Aguarde"}
             </span>
          </div>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          {appState.view === 'SETTINGS' ? (
            <SettingsView />
          ) : appState.view === 'GALLERY' ? (
            <GalleryView />
          ) : appState.view === 'PREP_FLOW' ? (
            <PrepFlowView />
          ) : appState.view === 'LOCKED_2026' ? (
             <Locked2026View />
          ) : appState.view === 'MONTH_INTRO' && is2026Unlocked ? (
             <MonthIntroView />
          ) : appState.view === 'JOURNAL' && currentEntry && is2026Unlocked ? (
            <JournalEntryView entry={currentEntry} />
          ) : (
             <CoverView />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
