from fastapi import FastAPI, UploadFile, File, HTTPException
import io
import PyPDF2
import docx # Nova biblioteca para ler .docx

app = FastAPI()

@app.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    try:
        content = await file.read()
        extracted_text = ""

        # Lê extensão em minúsculo para evitar erros (ex: .DOCX)
        filename = file.filename.lower()

        # 1. MOTOR PARA PDF
        if filename.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"
        
        # 2. MOTOR PARA WORD (.docx)
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
        
        # 3. MOTOR PARA BLOCO DE NOTAS (.txt)
        elif filename.endswith(".txt"):
            extracted_text = content.decode("utf-8", errors="ignore")
            
        else:
            raise HTTPException(status_code=400, detail="Formato não suportado. Envie PDF, DOCX ou TXT.")

        return {"text": extracted_text.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno no extrator: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    # Garante que vai rodar na porta 8000, onde o Go está esperando
    uvicorn.run(app, host="0.0.0.0", port=8000)
