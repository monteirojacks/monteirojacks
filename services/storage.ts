
import { UserData, UserAnswer, PhotoEntry, MonthlySummaries } from '../types';
import jsPDF from 'jspdf';

const STORAGE_KEY = 'eu_por_inteiro_data_v1';
const USER_KEY = 'eu_por_inteiro_user_v1';
const PHOTOS_KEY = 'eu_por_inteiro_photos_v1';
const SUMMARIES_KEY = 'eu_por_inteiro_summaries_v1';

// --- User Profile ---

export const getUserName = (): string | null => {
  return localStorage.getItem(USER_KEY);
};

export const saveUserName = (name: string) => {
  localStorage.setItem(USER_KEY, name);
};

export const clearUser = () => {
  localStorage.removeItem(USER_KEY);
};

// --- Journal Data ---

export const loadData = (): UserData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to load data", e);
    return {};
  }
};

export const saveData = (data: UserData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data", e);
  }
};

export const saveEntry = (entryId: string, text: string, dateString: string) => {
  const currentData = loadData();
  const entry: UserAnswer = {
    text,
    timestamp: Date.now(),
    completed: true,
    dateString
  };
  const newData = { ...currentData, [entryId]: entry };
  saveData(newData);
  return newData;
};

// --- AI Summaries Data ---

export const loadSummaries = (): MonthlySummaries => {
  try {
    const data = localStorage.getItem(SUMMARIES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

export const saveSummary = (monthId: number, text: string) => {
  const current = loadSummaries();
  const updated = { ...current, [monthId]: text };
  localStorage.setItem(SUMMARIES_KEY, JSON.stringify(updated));
  return updated;
};


// --- Photo Data ---

export const loadPhotos = (): PhotoEntry[] => {
  try {
    const data = localStorage.getItem(PHOTOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load photos", e);
    return [];
  }
};

export const savePhoto = (photo: PhotoEntry) => {
  const currentPhotos = loadPhotos();
  const newPhotos = [photo, ...currentPhotos];
  try {
    localStorage.setItem(PHOTOS_KEY, JSON.stringify(newPhotos));
    return newPhotos;
  } catch (e) {
    console.error("Storage Limit Reached?", e);
    alert("Armazenamento cheio. Tente apagar fotos antigas ou use imagens menores.");
    return currentPhotos;
  }
};

// Image Compression Helper
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800; // Limit size for localStorage
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG 0.6 quality
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// --- Export/Import ---

export const exportToJSON = (data: UserData) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `eu_por_inteiro_backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importFromJSON = async (file: File): Promise<UserData | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        saveData(json);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
};

export const exportToPDF = (data: UserData, months: any[]) => {
  const doc = new jsPDF();
  
  // Title Page
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.text("Eu por Inteiro", 105, 100, { align: "center" });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text("Diário de Autoconhecimento", 105, 110, { align: "center" });
  
  const userName = getUserName();
  if (userName) {
    doc.setFontSize(12);
    doc.text(`Pertence a: ${userName}`, 105, 130, { align: "center" });
  }

  doc.setFontSize(10);
  doc.text(`Exportado em: ${new Date().toLocaleDateString()}`, 105, 280, { align: "center" });

  let yPos = 20;
  
  // Content
  months.forEach(month => {
    // Check if month has any entries
    const monthHasEntries = month.days.some((d: any) => data[d.id]);
    
    if (monthHasEntries) {
      doc.addPage();
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.text(month.name, 20, 20);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text(month.theme, 20, 30);
      
      yPos = 40;

      month.days.forEach((day: any) => {
        const entry = data[day.id];
        if (entry && entry.text.trim().length > 0) {
          
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont('times', 'bold');
          doc.setFontSize(12);
          const dayTitle = day.isMonthlyReview ? "Revisão Mensal" : `Dia ${day.dayNumber} (${day.dayOfMonth}/${month.id})`;
          doc.text(`${dayTitle} ${entry.dateString ? `(${entry.dateString})` : ''}`, 20, yPos);
          yPos += 7;

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(100);
          const splitQuestion = doc.splitTextToSize(day.question, 170);
          doc.text(splitQuestion, 20, yPos);
          yPos += (splitQuestion.length * 5) + 2;

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0);
          const splitAnswer = doc.splitTextToSize(entry.text, 170);
          doc.text(splitAnswer, 20, yPos);
          yPos += (splitAnswer.length * 5) + 10;
        }
      });
    }
  });

  doc.save("eu_por_inteiro_diario.pdf");
};
