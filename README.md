# DocuMind — Document-Based LLM Chatbot (RAG)

A local, educational RAG application with a React/Vite frontend, FastAPI backend, Sentence Transformers embeddings, cosine-similarity retrieval, and an Ollama local LLM. Supports PDF, DOCX, and TXT.

## Features
- Upload one document at a time (PDF, DOCX, TXT; max 15 MB)
- Extract text, chunk it, and embed chunks locally
- Retrieve the top five passages for each question
- Two-stage scope/answerability checking: embedding similarity gate + LLM classifier
- Answer using retrieved passages only; show retrieved passage previews
- Clear the current document
- No paid LLM API key

## Prerequisites
- Windows 10/11
- Python 3.11 recommended
- Node.js LTS (includes npm)
- Ollama for Windows
- Enough free RAM/disk for the local models (the embedding model and LLM download take space)

## Setup on Windows / VS Code

### 1. Install tools
- Python: https://www.python.org/downloads/ (check **Add Python to PATH** during installation)
- Node.js LTS: https://nodejs.org/
- Ollama: https://ollama.com/download/windows
- VS Code: https://code.visualstudio.com/

Restart VS Code after installing tools if the terminal cannot find `python`, `node`, or `ollama`.

### 2. Download the local chat model
Open PowerShell or the VS Code terminal and run:

```powershell
ollama pull qwen2.5:3b
```

Ollama normally runs in the background on `http://localhost:11434`. Verify:

```powershell
ollama list
```

You can test it with:

```powershell
ollama run qwen2.5:3b
```

Type a question and then `/bye` to exit the interactive session. Keep Ollama installed and available while using the app.

### 3. Start the backend
Open the `backend` directory in a VS Code terminal:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If PowerShell blocks environment activation, use this for the current terminal only, then activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Start the backend:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The first backend startup downloads `sentence-transformers/all-MiniLM-L6-v2`, so it needs internet access and may take a few minutes. Keep this terminal running. Open http://127.0.0.1:8000/docs to inspect/test the API and http://127.0.0.1:8000/api/health to check status.

### 4. Start the React frontend
Open a **second** VS Code terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL Vite prints, normally http://localhost:5173.

## How to test
1. Upload a text-based PDF, DOCX, or TXT file. A scanned PDF with no selectable text needs OCR first.
2. Ask a question that is clearly answered by the document.
3. Ask a question about the document's subject whose answer is not stated; the bot should say it could not find enough information.
4. Ask a clearly unrelated question, e.g. a cricket score question about a document on machine learning; the bot should return the out-of-scope message.
5. Upload a different document to replace the active document, or click the trash icon to clear it.

Expected out-of-scope response:

> I'm sorry, but your question is not relevant to the document provided. Please ask a question related to the document's content.

Expected not-found response:

> I couldn't find enough information to answer that question from the provided document. Please ask another question based on the document.

## Project structure

```text
document-chatbot-project/
├── README.md
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── App.jsx
        ├── main.jsx
        └── styles.css
```

## How RAG works in this app
1. **Load:** extract text from the uploaded file.
2. **Chunk:** split the text into overlapping passages.
3. **Embed:** Sentence Transformers maps each passage to a vector.
4. **Retrieve:** embed the user's question and rank passages by cosine similarity.
5. **Gate:** reject very low-similarity questions; otherwise ask the local LLM whether the question is in scope and whether retrieved evidence can answer it.
6. **Generate:** ask the LLM to answer only from retrieved passages.
7. **Display:** show the answer/status and the retrieved passage previews.

## Important limitations
- This is a local demo for one active document and one local user. It is not a multi-user production service.
- Similarity thresholds are heuristic and must be tested/tuned for your actual documents and embedding model. A threshold alone is not a perfect scope detector.
- The LLM classifier can make mistakes. Review responses and test relevant, irrelevant, and unanswerable questions.
- Scanned/image-only PDFs need OCR, which is not included.
- Tables in DOCX are extracted as text; complex layouts may not preserve their structure.
- Uploaded content is sent to the local backend and local Ollama model; this project does not intentionally send prompts to a hosted LLM API. The initial model downloads require internet.
- For public deployment, add authentication, per-user document isolation, request limits, malware scanning, and robust file handling. Do not expose the development server directly to the internet.

## Troubleshooting
- **`ollama` not recognized:** reinstall/launch Ollama, restart VS Code, then run `ollama list`.
- **Cannot connect to Ollama:** make sure Ollama is running; try `ollama run qwen2.5:3b` in another terminal.
- **Model missing:** run `ollama pull qwen2.5:3b`.
- **Backend cannot import a package:** activate `.venv` and run `pip install -r requirements.txt` again.
- **FAISS install not needed:** this version uses NumPy cosine similarity to keep Windows setup simpler.
- **Frontend shows Backend offline:** check that Uvicorn is still running at port 8000.
- **CORS error:** run Vite at its default `http://localhost:5173` URL.
- **Out-of-scope decision is too strict/lenient:** test several known questions and adjust `MIN_SIMILARITY` in `backend/main.py`; do not tune on just one question.
