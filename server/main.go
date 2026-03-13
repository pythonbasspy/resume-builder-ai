package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strings" // Adicionado para checar texto vazio
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Experience struct {
	Company string   `json:"company"`
	Role    string   `json:"role"`
	Period  string   `json:"period"`
	Bullets []string `json:"bullets"`
}

type Education struct {
	Institution string `json:"institution"`
	Course      string `json:"course"`
	Period      string `json:"period"`
}

type PersonalInfo struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Linkedin string `json:"linkedin"`
	Location string `json:"location"`
}

type ResumeData struct {
	PersonalInfo PersonalInfo `json:"personal_info"`
	Summary      string       `json:"summary"`
	Experience   []Experience `json:"experience"`
	Education    []Education  `json:"education"`
	Skills       []string     `json:"skills"`
}

type LLMResponse struct {
	PtBr ResumeData `json:"pt_br"`
	UsEng ResumeData `json:"us_eng"`
}

func main() {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174"},
		AllowMethods:     []string{"POST", "GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.POST("/api/v1/upload", handleUpload)
	log.Println("Servidor Go rodando na porta 8080...")
	r.Run(":8080")
}

func handleUpload(c *gin.Context) {
	file, err := c.FormFile("document")
	creativeMode := c.PostForm("creativeMode") == "true"
	if err != nil {
		log.Printf("Erro ao receber arquivo: %v", err)
		c.String(http.StatusBadRequest, "Erro no arquivo")
		return
	}

	// 1. Extrai o texto no Python
	extractedText, err := extractTextFromPython(file)
	if err != nil {
		log.Printf("Erro na comunicação com Python: %v", err)
		c.String(http.StatusInternalServerError, "Falha ao extrair texto do arquivo")
		return
	}

	// DEBUG: Mostra no terminal do Go o que o Python leu
	fmt.Printf("\n--- TEXTO EXTRAÍDO DO ARQUIVO ---\n%s\n---------------------------------\n", extractedText)

	// 2. TRAVA DE SEGURANÇA: Se o texto estiver vazio, para tudo!
	if strings.TrimSpace(extractedText) == "" {
		log.Println("Erro: O arquivo está vazio ou o formato não é suportado pelo extrator.")
		c.String(http.StatusBadRequest, "Nenhum texto encontrado. Se for um .docx, tente salvar como .pdf e reenviar.")
		return
	}

	// 3. Manda para a IA
	finalJson, err := processWithLLM(extractedText, creativeMode)
	if err != nil {
		log.Printf("Erro na IA: %v", err)
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, finalJson)
}

func extractTextFromPython(fileHeader *multipart.FileHeader) (string, error) {
	file, _ := fileHeader.Open()
	defer file.Close()
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", fileHeader.Filename)
	io.Copy(part, file)
	writer.Close()
	
	resp, err := http.Post("http://localhost:8000/extract", writer.FormDataContentType(), body)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	
	var result map[string]string
	json.NewDecoder(resp.Body).Decode(&result)
	return result["text"], nil
}

func processWithLLM(text string, creative bool) (*LLMResponse, error) {
	temp := 0.0
	modeDesc := "STRICT: Extraia os dados exatamente como estão. Não invente nomes ou experiências sob nenhuma hipótese."
	if creative {
		temp = 0.7
		modeDesc = "CREATIVE: Melhore a descrição das atividades profissionalmente, mas mantenha os cargos e nomes reais."
	}

	systemPrompt := fmt.Sprintf(`Você é um extrator de dados de currículos.
MODO ATUAL: %s

Sua resposta DEVE SER EXCLUSIVAMENTE um JSON válido. NÃO INVENTE DADOS QUE NÃO ESTEJAM NO TEXTO.
Se uma informação não existir, use "" (string vazia) ou [] (array vazio). Nunca use null.

{
  "pt_br": {
    "personal_info": { "name": "", "email": "", "phone": "", "linkedin": "", "location": "" },
    "summary": "",
    "experience": [{"company": "", "role": "", "period": "", "bullets": [""]}],
    "education": [{"institution": "", "course": "", "period": ""}],
    "skills": [""]
  },
  "us_eng": {
    "personal_info": { "name": "", "email": "", "phone": "", "linkedin": "", "location": "" },
    "summary": "",
    "experience": [{"company": "", "role": "", "period": "", "bullets": [""]}],
    "education": [{"institution": "", "course": "", "period": ""}],
    "skills": [""]
  }
}`, modeDesc)

	requestBody, _ := json.Marshal(map[string]interface{}{
		"model": "qwen2:7b",
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": text},
		},
		"stream": false,
		"format": "json",
		"options": map[string]interface{}{"temperature": temp},
	})

	resp, _ := http.Post("http://localhost:11434/api/chat", "application/json", bytes.NewBuffer(requestBody))
	defer resp.Body.Close()
	
	var ollamaResp struct { Message struct { Content string `json:"content"` } `json:"message"` }
	json.NewDecoder(resp.Body).Decode(&ollamaResp)

	var finalData LLMResponse
	err := json.Unmarshal([]byte(ollamaResp.Message.Content), &finalData)
	if err != nil {
		return nil, fmt.Errorf("Erro de JSON: a IA falhou ao processar a estrutura.")
	}
	return &finalData, nil
}
