import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  FileText,
  Upload,
  Send,
  Trash2,
  Sparkles,
  UserRound,
  ShieldCheck,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

const welcomeMessage = {
  role: 'assistant',
  text: 'Hello! Upload a PDF, DOCX, or TXT document, then ask me questions about its content. I will use the document to answer and let you know when a question is outside its scope.',
};

export default function App() {
  const [file, setFile] = useState(null);
  const [documentInfo, setDocumentInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([welcomeMessage]);
  const [error, setError] = useState('');
  const [health, setHealth] = useState('checking');

  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  // Check the backend connection.
  useEffect(() => {
    let active = true;

    const checkBackend = async () => {
      try {
        const response = await fetch(`${API}/health`);

        if (!response.ok) {
          throw new Error('Backend health check failed');
        }

        await response.json();

        if (active) {
          setHealth('online');
        }
      } catch {
        if (active) {
          setHealth('offline');
        }
      }
    };

    checkBackend();

    return () => {
      active = false;
    };
  }, []);

  // Scroll to the newest chat message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages, sending]);

  // Upload and process a document.
  async function uploadDocument(event) {
    event.preventDefault();

    if (!file || uploading) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Upload failed.');
      }

      setDocumentInfo(data);

      setMessages([
        {
          role: 'assistant',
          text: `Your document "${data.filename}" is ready! I extracted ${Number(
            data.characters
          ).toLocaleString()} characters and created ${
            data.chunks
          } searchable chunks. Ask me something about it.`,
        },
      ]);
    } catch (e) {
      setError(
        e.message ||
          'Could not connect to the backend. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  }

  // Send a question about the uploaded document.
  async function sendQuestion(event) {
    event.preventDefault();

    const q = question.trim();

    if (!q || sending) return;

    if (!documentInfo) {
      setError('Upload a document before asking a question.');
      return;
    }

    setQuestion('');
    setError('');

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: q },
    ]);

    setSending(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: q }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'The question could not be answered.'
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer,
          status: data.status,
          sources: data.sources || [],
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `I couldn't process that question. ${
            e.message ||
            'Please check that the backend and local model are running.'
          }`,
          status: 'error',
        },
      ]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  // Remove the current document and reset the conversation.
  async function clearDocument() {
    try {
      const response = await fetch(`${API}/document`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Could not clear the document on the backend.');
      }
    } catch (e) {
      setError(e.message || 'Could not clear the document.');
    }

    setDocumentInfo(null);
    setFile(null);
    setQuestion('');
    setMessages([welcomeMessage]);

    const picker = document.getElementById('document-picker');

    if (picker) {
      picker.value = '';
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#top"
          aria-label="Document AI Assistant home"
        >
          <span className="brand-icon">
            <Bot size={22} />
          </span>

          <span>
            DocuMind<span className="brand-dot">.</span>
            <small>DOCUMENT AI ASSISTANT</small>
          </span>
        </a>

        <div className={`connection ${health}`}>
          <span className="connection-dot" />
          {health === 'online'
            ? 'Backend connected'
            : health === 'offline'
              ? 'Backend offline'
              : 'Connecting…'}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">
          <Sparkles size={14} />
          YOUR DOCUMENT, YOUR ANSWERS
        </div>

        <h1>
          Ask your documents
          <br />
          <span>anything that matters.</span>
        </h1>

        <p>
          Upload a document and explore its contents with an AI
          assistant that stays grounded in your source.
        </p>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <div className="section-heading">
            <span>YOUR DOCUMENT</span>
            <span className="step-tag">STEP 01</span>
          </div>

          <form onSubmit={uploadDocument}>
            <label
              className={`dropzone ${file ? 'has-file' : ''}`}
              htmlFor="document-picker"
            >
              <span className="upload-icon">
                <Upload size={21} />
              </span>

              <strong>
                {file ? 'Document selected' : 'Upload a document'}
              </strong>

              <span className="drop-copy">
                {file
                  ? file.name
                  : 'Click to browse or choose a file'}
              </span>

              <span className="file-types">
                PDF <i /> DOCX <i /> TXT
              </span>

              <input
                id="document-picker"
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  setError('');
                }}
              />
            </label>

            <button
              className="primary-button upload-button"
              disabled={!file || uploading}
              type="submit"
            >
              {uploading ? (
                <>
                  <LoaderCircle className="spin" size={17} />
                  Processing…
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload and process
                </>
              )}
            </button>
          </form>

          {documentInfo && (
            <div className="document-card">
              <div className="doc-file-icon">
                <FileText size={20} />
              </div>

              <div className="doc-details">
                <strong>{documentInfo.filename}</strong>

                <span>
                  {Number(documentInfo.characters).toLocaleString()}
                  {' characters · '}
                  {documentInfo.chunks} chunks
                </span>

                <span className="ready-label">
                  <CheckCircle2 size={13} />
                  Ready to chat
                </span>
              </div>

              <button
                className="icon-button"
                title="Remove document"
                type="button"
                onClick={clearDocument}
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <div className="sidebar-note">
            <ShieldCheck size={17} />

            <p>
              <strong>Document-focused answers</strong>
              <br />
              Questions are checked against your document before an
              answer is generated.
            </p>
          </div>

          <div className="how-card">
            <strong>How it works</strong>

            <ol>
              <li>
                <span>1</span> Upload your document
              </li>
              <li>
                <span>2</span> Ask a question
              </li>
              <li>
                <span>3</span> Get a grounded answer
              </li>
            </ol>
          </div>

          <div className="privacy-note">
            <span className="privacy-dot" />
            Local model · No paid API key
          </div>
        </aside>

        <section className="chat-panel" aria-label="Document chat">
          <div className="chat-header">
            <div className="chat-title-icon">
              <Bot size={20} />
            </div>

            <div>
              <h2>Document chat</h2>
              <p>
                {documentInfo
                  ? `Chatting with ${documentInfo.filename}`
                  : 'Your document conversation starts here'}
              </p>
            </div>

            <span className="rag-pill">
              <span /> RAG ENABLED
            </span>
          </div>

          <div className="messages">
            {messages.map((message, index) => (
              <div
                className={`message-row ${message.role}`}
                key={index}
              >
                <div className={`avatar ${message.role}`}>
                  {message.role === 'assistant' ? (
                    <Bot size={18} />
                  ) : (
                    <UserRound size={17} />
                  )}
                </div>

                <div className="message-content">
                  <span className="message-author">
                    {message.role === 'assistant'
                      ? 'DOCUMIND AI'
                      : 'YOU'}
                  </span>

                  <div className={`bubble ${message.status || ''}`}>
                    {message.text}
                  </div>

                  {message.status === 'out_of_scope' && (
                    <div className="status-note">
                      <AlertCircle size={13} />
                      Outside document scope
                    </div>
                  )}

                  {message.status === 'not_found' && (
                    <div className="status-note">
                      <AlertCircle size={13} />
                      Not found in source
                    </div>
                  )}

                  {message.sources?.length > 0 && (
                    <details className="sources">
                      <summary>
                        View retrieved passages (
                        {message.sources.length})
                      </summary>

                      {message.sources.map((source, sourceIndex) => (
                        <div
                          className="source-item"
                          key={sourceIndex}
                        >
                          <strong>
                            {source.passage} · score {source.similarity}
                          </strong>

                          <p>
                            {source.preview}
                            {source.preview?.length >= 260 ? '…' : ''}
                          </p>
                        </div>
                      ))}
                    </details>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="message-row assistant">
                <div className="avatar assistant">
                  <Bot size={18} />
                </div>

                <div className="message-content">
                  <span className="message-author">DOCUMIND AI</span>

                  <div className="bubble loading-bubble">
                    <LoaderCircle size={16} className="spin" />
                    Searching your document and preparing an answer…
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={15} />
              {error}

              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          <form className="composer" onSubmit={sendQuestion}>
            <div className="input-wrap">
              <input
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder={
                  documentInfo
                    ? 'Ask something about your document…'
                    : 'Upload a document to start chatting…'
                }
                disabled={!documentInfo || sending}
                aria-label="Your question"
              />

              <span className="enter-hint">ENTER ↵</span>
            </div>

            <button
              className="send-button"
              type="submit"
              disabled={
                !documentInfo || !question.trim() || sending
              }
              aria-label="Send question"
            >
              <Send size={17} />
            </button>
          </form>

          <p className="disclaimer">
            AI responses can be inaccurate. Verify important details
            against the original document.
          </p>
        </section>
      </section>

      <footer>
        BUILT WITH REACT · FASTAPI · SENTENCE TRANSFORMERS · OLLAMA
      </footer>
    </main>
  );
}
