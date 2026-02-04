import { useState, useEffect } from "react"
import { Mic, MicOff, Loader2, X, Bot, Send } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api"

export default function Topbar() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [aiResponse, setAiResponse] = useState("")
  const [recognition, setRecognition] = useState(null)

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = "en-US"

      recognitionInstance.onresult = (event) => {
        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + " " + finalTranscript)
        }
      }

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  function toggleListening() {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.")
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      setTranscript("")
      setAiResponse("")
      setShowVoiceModal(true)
      recognition.start()
      setIsListening(true)
    }
  }

  function closeModal() {
    if (isListening && recognition) {
      recognition.stop()
    }
    setIsListening(false)
    setShowVoiceModal(false)
    setTranscript("")
    setAiResponse("")
    setProcessing(false)
  }

  async function processVoiceCommand() {
    if (!transcript.trim()) return
    
    if (isListening && recognition) {
      recognition.stop()
      setIsListening(false)
    }

    setProcessing(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE}/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: transcript.trim() })
      })
      const data = await res.json()
      setAiResponse(data.reply || "Done! Your request has been processed.")
      
      // If action was taken, refresh the page after a delay
      if (data.action && data.action !== "chat") {
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (err) {
      setAiResponse("Sorry, I couldn't process that. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <span className="text-2xl">📅</span>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Smart AI Scheduler</span>
        </h1>

        <div className="flex items-center gap-3">
          {/* Voice Assistant Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${
              isListening 
                ? "bg-gradient-to-r from-red-500 to-rose-500 animate-pulse shadow-lg shadow-red-500/30" 
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/20"
            }`}
            title="Voice Assistant - Click to speak"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            <span className="text-sm font-medium hidden sm:inline">
              {isListening ? "Stop" : "Voice"}
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all shadow-lg shadow-red-500/20 text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Voice Assistant Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 blur-3xl rounded-full" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/20 blur-3xl rounded-full" />
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-6">
                <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                  isListening 
                    ? "bg-gradient-to-br from-red-500 to-rose-500 animate-pulse" 
                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                }`}>
                  {processing ? (
                    <Loader2 size={36} className="animate-spin" />
                  ) : isListening ? (
                    <Mic size={36} className="animate-bounce" />
                  ) : (
                    <Bot size={36} />
                  )}
                </div>
                <h2 className="text-xl font-bold mb-1">Voice Assistant</h2>
                <p className="text-sm text-white/60">
                  {isListening ? "Listening... Speak now" : processing ? "Processing your request..." : "Click the mic to start"}
                </p>
              </div>

              {/* Waveform Animation */}
              {isListening && (
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: "0.5s"
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Transcript */}
              {transcript && (
                <div className="p-4 rounded-xl bg-black/30 border border-white/10 mb-4">
                  <p className="text-sm text-white/80">
                    <span className="text-purple-400 font-medium">You said:</span> {transcript.trim()}
                  </p>
                </div>
              )}

              {/* AI Response */}
              {aiResponse && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4">
                  <div className="flex items-start gap-2">
                    <Bot size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{aiResponse}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!aiResponse ? (
                  <>
                    <button
                      onClick={toggleListening}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                        isListening
                          ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                          : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      }`}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                      {isListening ? "Stop Recording" : "Start Recording"}
                    </button>
                    {transcript && !isListening && (
                      <button
                        onClick={processVoiceCommand}
                        disabled={processing}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {processing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {processing ? "Processing..." : "Send to AI"}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={closeModal}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-medium transition-all"
                  >
                    Done
                  </button>
                )}
              </div>

              {/* Tips */}
              <div className="mt-4 text-center">
                <p className="text-xs text-white/40">
                  Try: "Add meeting tomorrow at 3pm" or "Create a task to buy groceries"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
