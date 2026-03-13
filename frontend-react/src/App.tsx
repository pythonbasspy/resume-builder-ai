import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, Download, AlertCircle, Trash2, Type, Sparkles, Plus } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { ResumePreview } from './components/ResumePreview';
import type { LLMResponse, ResumeData } from './types';

const ATSWarning = ({ message }: { message: string }) => (
  <div className="group relative inline-flex items-center ml-2 cursor-help">
    <AlertCircle className="h-4 w-4 text-amber-500 hover:text-amber-600 transition-colors" />
    <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible absolute z-50 w-72 p-4 mt-0 text-xs text-white bg-slate-800 rounded-xl shadow-2xl left-full ml-3 top-[-10px] transition-all duration-200 pointer-events-none border border-slate-700">
      <div className="font-bold text-amber-400 mb-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Atenção (Filtro ATS)</div>
      <div className="leading-relaxed text-slate-200">{message}</div>
      <div className="absolute top-[14px] -left-1.5 w-3 h-3 bg-slate-800 rotate-45 border-l border-b border-slate-700"></div>
    </div>
  </div>
);

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState<LLMResponse | null>(null);
  const [language, setLanguage] = useState<'pt_br' | 'us_eng'>('pt_br');
  const [themeColor, setThemeColor] = useState('#1e293b');
  const [isCreativeMode, setIsCreativeMode] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [titleFontSize, setTitleFontSize] = useState(42);
  const [headerFontSize, setHeaderFontSize] = useState(15);
  const [titleFontFamily, setTitleFontFamily] = useState("'Montserrat', sans-serif");
  const [bodyFontFamily, setBodyFontFamily] = useState("'Lato', sans-serif");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('resume_builder_draft');
    if (saved) setResumeData(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (resumeData) localStorage.setItem('resume_builder_draft', JSON.stringify(resumeData));
  }, [resumeData]);

  const clearDraft = () => {
    if (window.confirm("Deseja voltar para a página inicial? O seu rascunho atual será perdido.")) {
      localStorage.removeItem('resume_builder_draft');
      setResumeData(null);
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('document', file);
    formData.append('creativeMode', String(isCreativeMode));
    try {
      const response = await fetch('http://localhost:8080/api/v1/upload', { method: 'POST', body: formData });
      if (!response.ok) throw new Error(await response.text());
      const data: LLMResponse = await response.json();
      setResumeData(data);
    } catch (error) {
      alert(`Erro no processamento: Tente enviar o arquivo novamente. (${error instanceof Error ? error.message : 'Falha'})`);
    } finally { setIsLoading(false); }
  };

  const handleDownloadPDF = () => {
    if (!resumeData) return;
    setIsGeneratingPdf(true);
    const element = document.getElementById('resumePaper');
    const userName = resumeData[language]?.personal_info?.name?.replace(/\s+/g, '_') || 'Curriculo';
    const opt = {
      margin: 0, filename: `${userName}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => setIsGeneratingPdf(false));
  };

  const updatePersonalInfo = (field: keyof ResumeData['personal_info'], value: string) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const currentLangData = prev[language] || { personal_info: {}, experience: [], education: [], skills: [], summary: "" };
      return { ...prev, [language]: { ...currentLangData, personal_info: { ...(currentLangData.personal_info || {}), [field]: value } } };
    });
  };

  const updateSummary = (value: string) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const currentLangData = prev[language] || { personal_info: {}, experience: [], education: [], skills: [], summary: "" };
      return { ...prev, [language]: { ...currentLangData, summary: value } };
    });
  };

  const updateExperience = (index: number, field: string, value: string | string[]) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const currentLangData = prev[language] || { experience: [] };
      const newExp = [...(currentLangData.experience || [])];
      newExp[index] = { ...newExp[index], [field]: value };
      return { ...prev, [language]: { ...currentLangData, experience: newExp } };
    });
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const currentLangData = prev[language] || { education: [] };
      const newEdu = [...(currentLangData.education || [])];
      newEdu[index] = { ...newEdu[index], [field]: value };
      return { ...prev, [language]: { ...currentLangData, education: newEdu } };
    });
  };

  const updateSkills = (value: string) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const currentLangData = prev[language] || { skills: [] };
      return { ...prev, [language]: { ...currentLangData, skills: value.split('\n').filter(s => s.trim() !== '') } };
    });
  };

  // --- NOVAS FUNÇÕES: Adicionar e Remover Itens ---
  const addExperience = () => {
    setResumeData(prev => {
      if (!prev) return prev;
      const currentLangData = prev[language] || { experience: [] };
      const newExp = [...(currentLangData.experience || []), { company: '', role: '', period: '', bullets: [] }];
      return { ...prev, [language]: { ...currentLangData, experience: newExp } };
    });
  };

  const removeExperience = (index: number) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const currentLangData = prev[language] || { experience: [] };
      const newExp = (currentLangData.experience || []).filter((_, i) => i !== index);
      return { ...prev, [language]: { ...currentLangData, experience: newExp } };
    });
  };

  const addEducation = () => {
    setResumeData(prev => {
      if (!prev) return prev;
      const currentLangData = prev[language] || { education: [] };
      const newEdu = [...(currentLangData.education || []), { institution: '', course: '', period: '' }];
      return { ...prev, [language]: { ...currentLangData, education: newEdu } };
    });
  };

  const removeEducation = (index: number) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const currentLangData = prev[language] || { education: [] };
      const newEdu = (currentLangData.education || []).filter((_, i) => i !== index);
      return { ...prev, [language]: { ...currentLangData, education: newEdu } };
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <nav className="bg-white shadow-sm px-8 py-4 flex flex-col gap-4 sticky top-0 z-40 border-b">
        <div className="flex justify-between items-center w-full">
          <button onClick={resumeData ? clearDraft : undefined} className="font-bold text-xl text-indigo-600 flex items-center gap-2 hover:opacity-80 transition">
            <FileText className="h-6 w-6" /> ResumeBuilder.ai
          </button>
          {resumeData && (
            <div className="flex items-center gap-6">
              <div className="flex gap-2">
                {['#1e293b', '#4f46e5', '#059669', '#e11d48'].map(c => (
                  <button key={c} onClick={() => setThemeColor(c)} className={`w-6 h-6 rounded-full border-2 ${themeColor === c ? 'border-slate-400' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
              <button onClick={() => setLanguage(language === 'pt_br' ? 'us_eng' : 'pt_br')} className="bg-slate-100 px-3 py-1.5 rounded text-xs font-black text-slate-600 uppercase">
                {language === 'pt_br' ? '🇧🇷 PT-BR' : '🇺🇸 EN-US'}
              </button>
              <div className="flex gap-2">
                <button onClick={clearDraft} className="p-2 text-slate-400 hover:text-red-500 transition" title="Limpar tudo"><Trash2 className="h-5 w-5" /></button>
                <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                  {isGeneratingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Baixar PDF
                </button>
              </div>
            </div>
          )}
        </div>
        
        {resumeData && (
          <div className="flex items-center gap-6 py-2 border-t border-slate-50 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex items-center gap-3">
              <Type className="h-4 w-4 text-slate-400" />
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nome</label>
              <input type="range" min="14" max="64" value={titleFontSize} onChange={(e) => setTitleFontSize(parseInt(e.target.value))} className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              <span className="text-xs font-bold text-slate-600 w-8">{titleFontSize}px</span>
            </div>
            <div className="flex items-center gap-3 border-l pl-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Subtítulos</label>
              <input type="range" min="10" max="24" value={headerFontSize} onChange={(e) => setHeaderFontSize(parseInt(e.target.value))} className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              <span className="text-xs font-bold text-slate-600 w-6">{headerFontSize}pt</span>
            </div>
            <div className="flex items-center gap-3 border-l pl-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fonte Títulos</label>
              <select value={titleFontFamily} onChange={(e) => setTitleFontFamily(e.target.value)} className="text-xs border rounded p-1 font-medium bg-slate-50 outline-none">
                <option value="'Montserrat', sans-serif">Montserrat</option><option value="'Lato', sans-serif">Lato</option>
                <option value="'EB Garamond', serif">EB Garamond</option><option value="'Lora', serif">Lora</option>
              </select>
            </div>
            <div className="flex items-center gap-3 border-l pl-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fonte Corpo</label>
              <select value={bodyFontFamily} onChange={(e) => setBodyFontFamily(e.target.value)} className="text-xs border rounded p-1 font-medium bg-slate-50 outline-none">
                <option value="'Lato', sans-serif">Lato</option><option value="'Inter', sans-serif">Inter</option>
                <option value="'EB Garamond', serif">EB Garamond</option><option value="'Lora', serif">Lora</option>
              </select>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 mt-8">
        {!resumeData && !isLoading ? (
          <div className="max-w-xl mx-auto bg-white p-12 rounded-2xl shadow-sm text-center mt-20 border border-slate-100">
            <h2 className="text-3xl font-black text-slate-800 mb-6 uppercase tracking-widest">Otimize para ATS</h2>
            <div className="mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center gap-3">
              <input type="checkbox" id="creative" checked={isCreativeMode} onChange={(e) => setIsCreativeMode(e.target.checked)} className="w-5 h-5 accent-indigo-600 cursor-pointer" />
              <label htmlFor="creative" className="text-sm font-bold text-indigo-900 cursor-pointer flex items-center gap-2"><Sparkles className="h-4 w-4" /> Permitir melhoria de texto por IA</label>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition">{file ? file.name : "SELECIONAR CURRÍCULO"}</button>
            {file && <button onClick={handleUpload} className="block w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-black hover:bg-black transition uppercase tracking-widest">Analisar com IA</button>}
          </div>
        ) : resumeData && !isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 overflow-y-auto max-h-[82vh] custom-scrollbar flex flex-col gap-10">
              
              {/* DADOS PESSOAIS */}
              <section>
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-6">Dados Pessoais</h3>
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Nome Completo</label>
                    <input type="text" value={resumeData[language]?.personal_info?.name || ""} onChange={e => updatePersonalInfo('name', e.target.value)} className="w-full border-b-2 border-slate-100 p-2 font-bold text-slate-700 outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Localização</label>
                    <input type="text" value={resumeData[language]?.personal_info?.location || ""} onChange={e => updatePersonalInfo('location', e.target.value)} className="w-full border-b-2 border-slate-100 p-2 font-bold text-slate-700 outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1">LinkedIn</label>
                    <input type="text" value={resumeData[language]?.personal_info?.linkedin || ""} onChange={e => updatePersonalInfo('linkedin', e.target.value)} className="w-full border-b-2 border-slate-100 p-2 font-bold text-slate-700 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Email</label>
                    <input type="text" value={resumeData[language]?.personal_info?.email || ""} onChange={e => updatePersonalInfo('email', e.target.value)} className="w-full border-b-2 border-slate-100 p-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Telefone</label>
                    <input type="text" value={resumeData[language]?.personal_info?.phone || ""} onChange={e => updatePersonalInfo('phone', e.target.value)} className="w-full border-b-2 border-slate-100 p-2 text-sm outline-none" />
                  </div>
                </div>
              </section>

              {/* RESUMO */}
              <section>
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Resumo Profissional</h3>
                <textarea value={resumeData[language]?.summary || ""} onChange={e => updateSummary(e.target.value)} rows={5} className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-xl p-4 text-sm outline-none focus:border-indigo-500 transition" />
              </section>

              {/* EXPERIÊNCIA */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Experiência</h3>
                  <button onClick={addExperience} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition bg-indigo-50 px-3 py-1.5 rounded-md">
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                </div>
                
                {(resumeData[language]?.experience || []).map((exp, index) => (
                  <div key={index} className="mb-8 p-6 border border-slate-100 rounded-2xl bg-slate-50/20 relative group">
                    <button 
                      onClick={() => removeExperience(index)} 
                      className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      title="Remover Experiência"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Cargo</label>
                    <input type="text" value={exp.role || ""} onChange={e => updateExperience(index, 'role', e.target.value)} className="w-full border-b p-1 font-bold text-slate-700 mb-2 outline-none bg-transparent" />
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1">Empresa</label>
                      <input type="text" value={exp.company || ""} onChange={e => updateExperience(index, 'company', e.target.value)} className="w-full border-b p-1 text-sm outline-none bg-transparent" /></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1">Período</label>
                      <input type="text" value={exp.period || ""} onChange={e => updateExperience(index, 'period', e.target.value)} className="w-full border-b p-1 text-sm outline-none bg-transparent" /></div>
                    </div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Atividades (Um por linha)</label>
                    <textarea value={(exp.bullets || []).join('\n')} onChange={e => updateExperience(index, 'bullets', e.target.value.split('\n'))} rows={5} className="w-full border-2 border-slate-50 rounded-xl p-3 text-sm outline-none focus:border-indigo-500" />
                  </div>
                ))}
              </section>

              {/* EDUCAÇÃO */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Educação e Cursos</h3>
                  <button onClick={addEducation} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition bg-indigo-50 px-3 py-1.5 rounded-md">
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                </div>

                {(resumeData[language]?.education || []).map((edu, index) => (
                  <div key={index} className="mb-4 p-4 border border-slate-100 rounded-xl bg-slate-50/20 relative group">
                    <button 
                      onClick={() => removeEducation(index)} 
                      className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition"
                      title="Remover Formação"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <input type="text" value={edu.course || ""} onChange={e => updateEducation(index, 'course', e.target.value)} placeholder="Curso/Formação" className="w-full border-b p-1 font-bold outline-none mb-2 text-sm bg-transparent pr-8" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" value={edu.institution || ""} onChange={e => updateEducation(index, 'institution', e.target.value)} placeholder="Instituição" className="w-full border-b p-1 text-sm outline-none bg-transparent" />
                      <input type="text" value={edu.period || ""} onChange={e => updateEducation(index, 'period', e.target.value)} placeholder="Período" className="w-full border-b p-1 text-sm outline-none bg-transparent" />
                    </div>
                  </div>
                ))}
              </section>

              {/* COMPETÊNCIAS */}
              <section>
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Competências</h3>
                <textarea value={(resumeData[language]?.skills || []).join('\n')} onChange={e => updateSkills(e.target.value)} rows={4} className="w-full border-2 border-slate-50 rounded-xl p-4 text-sm outline-none focus:border-indigo-500" />
              </section>

            </div>
            <div className="sticky top-44 scale-[0.80] origin-top">
              <ResumePreview 
                data={resumeData[language]} 
                language={language} 
                themeColor={themeColor} 
                titleFontSize={titleFontSize} 
                headerFontSize={headerFontSize}
                titleFontFamily={titleFontFamily} 
                bodyFontFamily={bodyFontFamily} 
              />
            </div>
          </div>
        ) : (
          <div className="text-center mt-32 flex flex-col items-center"><Loader2 className="h-14 w-14 text-indigo-600 animate-spin mb-6" /><h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Extraindo Dados...</h2></div>
        )}
      </main>
      <style dangerouslySetInnerHTML={{__html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Montserrat:wght@900&family=Lato:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,700;1,400&display=swap'); .custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }`}} />
    </div>
  );
}
export default App;
