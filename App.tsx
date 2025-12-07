
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { monthsData } from './data/journalContent';
import { UserData, AppState, JournalEntry, UserAnswer, PhotoEntry, MonthlySummaries } from './types';
import { loadData, saveEntry, exportToJSON, importFromJSON, exportToPDF, getUserName, saveUserName, clearUser, loadPhotos, savePhoto, compressImage, loadSummaries, saveSummary } from './services/storage';
import { LeafIcon, SeedIcon, RootIcon, HomeIcon, CalendarIcon, SettingsIcon, CheckIcon, DownloadIcon, FlameIcon, TrophyIcon, ChartIcon, TargetIcon, ChevronDownIcon, ChevronRightIcon, CameraIcon, ImageIcon, MoodHappy, MoodCalm, MoodSad, MoodEnergy, CompareIcon, PlusIcon } from './components/Icons';
import { generateMonthSummary } from './services/ai';

function App() {
  const [userData, setUserData] = useState<UserData>({});
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummaries>({});
  
  const [appState, setAppState] = useState<AppState>({
    currentMonthId: 1,
    currentEntryIndex: -1, // -1 means Month Intro Page
    view: 'LOGIN',
    userName: null
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const sidebarRef = useRef<HTMLElement>(null);

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
    const completedCount = answers.length;
    const completionRate = Math.round((completedCount / totalDays) * 100);

    // Streak Logic
    // 1. Get all timestamps and convert to YYYY-MM-DD
    const sortedDates = answers
      .map(a => new Date(a.timestamp).toISOString().split('T')[0])
      .sort()
      .filter((date, index, self) => self.indexOf(date) === index); // Unique

    // 2. Calculate Current Streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // If no entry today or yesterday, streak is 0 (unless we want to be lenient and count today as 0 but valid if filled)
    // We will check backwards from the last entry
    if (sortedDates.length > 0) {
      const lastEntryDate = sortedDates[sortedDates.length - 1];
      
      // If the last entry is not today or yesterday, the streak is broken (0)
      if (lastEntryDate === today || lastEntryDate === yesterday) {
         currentStreak = 1;
         // Check backwards
         for (let i = sortedDates.length - 2; i >= 0; i--) {
            const date = new Date(sortedDates[i]);
            const nextDate = new Date(sortedDates[i+1]);
            const diffTime = Math.abs(nextDate.getTime() - date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
         }
      }
    }

    // 3. Calculate Best Streak
    let bestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
       if (i === 0) {
         tempStreak = 1;
       } else {
          const date = new Date(sortedDates[i-1]);
          const nextDate = new Date(sortedDates[i]);
          const diffTime = Math.abs(nextDate.getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
       }
       if (tempStreak > bestStreak) bestStreak = tempStreak;
    }

    return {
      completedCount,
      completionRate,
      currentStreak,
      bestStreak
    };
  }, [userData]);

  const getMotivationalMessage = (stats: { completedCount: number, currentStreak: number, completionRate: number }) => {
    if (stats.currentStreak === 0) return "Todo dia é uma nova oportunidade de recomeçar.";
    if (stats.currentStreak >= 30) return "Incrível! Você construiu um hábito sólido.";
    if (stats.currentStreak >= 10) return "Sua consistência está gerando resultados profundos.";
    if (stats.currentStreak >= 3) return "Você está embalado! Continue assim.";
    
    // Milestones
    if (stats.completedCount % 30 >= 27) return "Você está quase completando mais um mês!";
    if (stats.completionRate >= 50) return "Metade da jornada concluída. Olhe o quanto cresceu.";
    
    return "Pequenos passos constantes levam a grandes destinos.";
  };

  const handleSaveEntry = (text: string, dateString: string) => {
    if (!currentEntry) return;
    const newData = saveEntry(currentEntry.id, text, dateString);
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

           {appState.userName && (
             <button 
               onClick={handleLogout}
               className="mt-6 text-xs text-neutral-600 hover:text-red-500 transition-colors underline decoration-dotted"
             >
               Não é {appState.userName}? Trocar conta.
             </button>
           )}
        </div>
      </div>
    );
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

          {/* Metrics Grid */}
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

            <div className="bg-surface p-4 border border-border rounded-sm flex flex-col items-center justify-center group hover:border-accent/50 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-textMuted text-xs uppercase tracking-wider">
                <FlameIcon className="w-3 h-3 text-red-500" />
                <span className="group-hover:text-red-500 transition-colors">Sequência</span>
              </div>
              <span className="font-serif text-3xl md:text-4xl font-bold text-white">
                {calculateStats.currentStreak}
                <span className="text-sm text-gray-600 font-sans font-normal ml-1">dias</span>
              </span>
            </div>

            <div className="bg-surface p-4 border border-border rounded-sm flex flex-col items-center justify-center group hover:border-accent/50 transition-colors">
              <div className="flex items-center gap-2 mb-2 text-textMuted text-xs uppercase tracking-wider">
                <TrophyIcon className="w-3 h-3 text-yellow-500" />
                <span className="group-hover:text-yellow-500 transition-colors">Recorde</span>
              </div>
              <span className="font-serif text-3xl md:text-4xl font-bold text-white">
                {calculateStats.bestStreak}
                <span className="text-sm text-gray-600 font-sans font-normal ml-1">dias</span>
              </span>
            </div>

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

          <div className="bg-[#0a0a0a] border border-neutral-900 p-6 max-w-lg w-full mb-12 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
             <p className="font-serif italic text-lg text-gray-300 relative z-10">
              "{motivation}"
            </p>
          </div>
          
          <button 
            onClick={() => setAppState({...appState, view: 'MONTH_INTRO'})}
            className="group relative px-10 py-4 bg-white text-black font-sans font-bold tracking-wider hover:bg-accent hover:text-white transition-colors duration-300 w-full md:w-auto"
          >
            ABRIR O DIÁRIO
            <span className="absolute -bottom-2 -right-2 w-full h-full border border-white group-hover:border-accent transition-colors duration-300 pointer-events-none"></span>
          </button>
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
        // Find today's date if possible, otherwise just go to journal
        // For simplicity, go to current active month/day or first day of current month
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
      handleSaveEntry(text, date);
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

          {/* Chapters List */}
          <div>
            <h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-4 px-2">Sua Jornada</h3>
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
            <span className="opacity-50">Jornada 2025</span>
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
               {appState.view === 'GALLERY' ? "Galeria" : appState.view === 'SETTINGS' ? "Ajustes" : currentMonth.name}
             </span>
          </div>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
          {appState.view === 'SETTINGS' ? (
            <SettingsView />
          ) : appState.view === 'GALLERY' ? (
            <GalleryView />
          ) : appState.view === 'MONTH_INTRO' ? (
             <MonthIntroView />
          ) : currentEntry ? (
            <JournalEntryView entry={currentEntry} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default App;
