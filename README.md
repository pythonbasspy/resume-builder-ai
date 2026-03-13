# 📄 ResumeBuilder.ai

Um gerador e otimizador de currículos para sistemas ATS (Applicant Tracking System), movido a Inteligência Artificial e executado 100% localmente para garantir total privacidade dos dados.

## 🚀 Arquitetura e Tecnologias

Este projeto utiliza uma arquitetura de microserviços:

- **Frontend (React + Vite):** Interface Split-Screen reativa, com painel de customização de tipografia e geração de PDF em alta qualidade (`html2pdf.js`).
- **Orquestrador (Go / Gin):** Backend de alta performance responsável por receber o arquivo, comunicar com o extrator e aplicar regras rígidas de *Prompt Engineering* na IA.
- **Extrator (Python / FastAPI):** Microserviço dedicado à extração limpa de textos em formatos `.pdf`, `.docx` e `.txt` (`PyPDF2`, `python-docx`).
- **Cérebro IA (Ollama / Qwen2:7b):** LLM rodando localmente, garantindo zero custo de API e segurança para dados sensíveis.

## ✨ Principais Funcionalidades

- **Privacidade Total:** Como o LLM roda na própria máquina, os dados pessoais do usuário nunca são enviados para a nuvem.
- **Modo Estrito vs Criativo:** Permite escolher entre uma extração de dados 100% literal ou a aplicação de melhorias profissionais (ex: transformar "Vendedor" em "Especialista B2C").
- **Edição em Tempo Real:** Editor do lado esquerdo com reflexo instantâneo no PDF (lado direito).
- **Auto-Save:** Rascunhos são salvos automaticamente no navegador (`localStorage`).
- **Design ATS-Friendly:** Código limpo, quebra de páginas controlada e fontes legíveis por robôs de recrutamento.

## 🛠️ Como rodar o projeto localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/)
- [Go](https://go.dev/)
- [Python 3.x](https://www.python.org/)
- [Ollama](https://ollama.ai/) com o modelo `qwen2:7b` baixado (`ollama run qwen2:7b`).

### 2. Iniciando o Extrator (Python)
```bash
cd server # ou a pasta onde está seu main.py
python -m venv venv
source venv/bin/activate # ou venv\Scripts\activate no Windows
pip install fastapi uvicorn PyPDF2 python-docx python-multipart
python main.py

#Roda na porta 8000.

3. Iniciando o Orquestrador (Go)
Bash
cd server
go mod tidy
go run main.go

#Roda na porta 8080.

4. Iniciando o Frontend (React)
Bash
cd frontend-react
npm install
npm run dev

#Acesse em http://localhost:5173 ou a porta que ele fornecer. 

Desenvolvido com 💡 e foco em arquitetura de software por [pythonbasspy]


