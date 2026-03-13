export interface Experience {
  company: string;
  role: string;
  period: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  course: string;
  period: string;
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
}

export interface ResumeData {
  personal_info: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

export interface LLMResponse {
  pt_br: ResumeData;
  us_eng: ResumeData;
}
