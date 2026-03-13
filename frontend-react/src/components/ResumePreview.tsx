import React from 'react';
import type { ResumeData } from '../types';

interface ResumePreviewProps {
  data: ResumeData;
  language: 'pt_br' | 'us_eng';
  themeColor: string;
  titleFontSize: number;
  headerFontSize: number;
  titleFontFamily: string;
  bodyFontFamily: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  data, 
  language, 
  themeColor,
  titleFontSize,
  headerFontSize,
  titleFontFamily,
  bodyFontFamily
}) => {
  const t = {
    experience: language === 'pt_br' ? 'Experiência Profissional' : 'Professional Experience',
    education: language === 'pt_br' ? 'Formação Acadêmica' : 'Education',
    skills: language === 'pt_br' ? 'Competências e Tecnologias' : 'Skills & Technologies',
    summary: language === 'pt_br' ? 'Resumo Profissional' : 'Professional Summary'
  };

  // Agrupa os dados de contato que existem para separá-los com bullets
  const contactItems = [
    data.personal_info.location,
    data.personal_info.email,
    data.personal_info.phone,
    data.personal_info.linkedin ? data.personal_info.linkedin.replace(/^https?:\/\/(www\.)?/, '') : null
  ].filter(Boolean);

  return (
    <div className="bg-white shadow-2xl mx-auto overflow-hidden rounded-sm border border-slate-200" 
         id="resumePaper" 
         style={{ 
           width: '210mm', 
           minHeight: '297mm', 
           padding: '15mm 20mm', 
           fontFamily: bodyFontFamily,
           color: '#1e293b'
         }}>
      
      {/* CABEÇALHO */}
      <header className="border-b-4 pb-5 mb-6 text-center break-inside-avoid" style={{ borderColor: themeColor }}>
        <h1 className="font-black text-slate-900 uppercase tracking-tighter mb-2" 
            style={{ fontSize: `${titleFontSize}px`, fontFamily: titleFontFamily, lineHeight: '1.1' }}>
          {data.personal_info.name || 'Seu Nome'}
        </h1>

        <div className="flex justify-center flex-wrap gap-x-2 gap-y-1 text-[10pt] text-slate-600 font-medium mt-1">
          {contactItems.map((item, index) => (
            <React.Fragment key={index}>
              <span>{item}</span>
              {index < contactItems.length - 1 && <span>•</span>}
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* RESUMO */}
      <section className="mb-6 text-justify break-inside-avoid">
        <h2 className="font-black uppercase tracking-widest mb-2" style={{ fontSize: `${headerFontSize}pt`, color: themeColor, fontFamily: titleFontFamily, pageBreakAfter: 'avoid' }}>
          {t.summary}
        </h2>
        <p className="text-[11pt] leading-relaxed italic">{data.summary}</p>
      </section>

      {/* EXPERIÊNCIA */}
      <section className="mb-6">
        <h2 className="font-black uppercase tracking-widest mb-4 border-b border-slate-100 pb-1" style={{ fontSize: `${headerFontSize}pt`, color: themeColor, fontFamily: titleFontFamily, pageBreakAfter: 'avoid' }}>
          {t.experience}
        </h2>
        {data.experience?.map((exp, i) => (
          <div key={i} className="mb-5 last:mb-0 break-inside-avoid">
            <div className="flex justify-between items-baseline">
              <h3 className="text-[12pt] font-bold text-slate-900">{exp.role}</h3>
              <span className="text-[9pt] font-bold text-slate-500 uppercase">{exp.period}</span>
            </div>
            <div className="text-[10pt] font-bold text-slate-600 mb-2 italic">{exp.company}</div>
            <ul className="list-disc ml-5 space-y-1">
              {exp.bullets?.filter(b => b.trim() !== "").map((bullet, j) => (
                <li key={j} className="text-[11pt] text-slate-700 leading-snug text-justify">{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* COMPETÊNCIAS */}
      <section className="mb-6 break-inside-avoid">
        <h2 className="font-black uppercase tracking-widest mb-3 border-b border-slate-100 pb-1" style={{ fontSize: `${headerFontSize}pt`, color: themeColor, fontFamily: titleFontFamily, pageBreakAfter: 'avoid' }}>
          {t.skills}
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.skills?.map((skill, i) => (
            <span key={i} className="bg-slate-50 text-slate-800 text-[9pt] px-3 py-1 rounded border border-slate-200 font-bold uppercase tracking-tight">
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* EDUCAÇÃO */}
      <section className="break-inside-avoid">
        <h2 className="font-black uppercase tracking-widest mb-3 border-b border-slate-100 pb-1" style={{ fontSize: `${headerFontSize}pt`, color: themeColor, fontFamily: titleFontFamily, pageBreakAfter: 'avoid' }}>
          {t.education}
        </h2>
        {data.education?.map((edu, i) => (
          <div key={i} className="flex justify-between items-baseline mb-2 text-[11pt] break-inside-avoid">
            <div><span className="font-bold text-slate-800">{edu.course}</span> — {edu.institution}</div>
            <span className="text-[9pt] text-slate-500 font-bold uppercase">{edu.period}</span>
          </div>
        ))}
      </section>
    </div>
  );
};
