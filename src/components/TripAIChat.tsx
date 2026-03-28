'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TripAIChatProps {
  tripId: string
}

export function TripAIChat({ tripId }: TripAIChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hey! I can modify this itinerary for you. Try something like "add a rooftop bar on day 2 evening", "make this trip cheaper", or "replace the museum with something outdoors".',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setIsLoading(true)

    try {
      const res = await fetch('/api/modify-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, message: text }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.error || 'Something went wrong. Try again.' },
        ])
        return
      }

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.message },
      ])

      if (data.appliedChanges?.length > 0) {
        router.refresh()
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error — please try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Sidebar panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: isOpen ? 0 : (isMobile ? '-105vw' : '-420px'),
          width: isMobile ? '100vw' : '400px',
          height: '100dvh',
          background: '#0f0f0d',
          borderLeft: '1px solid rgba(242,237,228,0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '-20px 0 60px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(242,237,228,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(232,98,58,0.15)',
                border: '1px solid rgba(232,98,58,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              ✦
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#f2ede4', margin: 0 }}>
                AI Trip Editor
              </p>
              <p style={{ fontSize: '11px', color: '#b8b0a2', margin: 0 }}>
                Modify your itinerary with natural language
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#b8b0a2',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? '#e8623a' : '#1a1a17',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(242,237,228,0.08)',
                  color: msg.role === 'user' ? '#fff' : '#f2ede4',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '16px 16px 16px 4px',
                  background: '#1a1a17',
                  border: '1px solid rgba(242,237,228,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '12px', color: '#b8b0a2' }}>Thinking</span>
                <span style={{ display: 'flex', gap: '3px' }}>
                  {[0, 1, 2].map(n => (
                    <span
                      key={n}
                      style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: '#e8623a',
                        display: 'inline-block',
                        animation: `pulse 1.2s ease-in-out ${n * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        {messages.length <= 1 && (
          <div
            style={{
              padding: '0 16px 12px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
            }}
          >
            {[
              'Make it cheaper',
              'Add hidden gems',
              'More outdoor activities',
              'Better nightlife',
            ].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                style={{
                  fontSize: '11px',
                  padding: '5px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(232,98,58,0.3)',
                  background: 'rgba(232,98,58,0.06)',
                  color: '#e8623a',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div
          style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid rgba(242,237,228,0.08)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
              background: '#141412',
              border: '1px solid rgba(242,237,228,0.1)',
              borderRadius: '12px',
              padding: '10px 12px',
              transition: 'border-color 0.15s',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. add a rooftop bar on day 2 evening..."
              rows={1}
              disabled={isLoading}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#f2ede4',
                fontSize: '13px',
                lineHeight: '1.5',
                resize: 'none',
                maxHeight: '100px',
                overflowY: 'auto',
                fontFamily: 'inherit',
              }}
              onInput={e => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 100) + 'px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: input.trim() && !isLoading ? '#e8623a' : 'rgba(232,98,58,0.2)',
                border: 'none',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke={input.trim() && !isLoading ? '#fff' : 'rgba(232,98,58,0.6)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p style={{ fontSize: '10px', color: '#b8b0a2', marginTop: '6px', textAlign: 'center' }}>
            Changes are saved automatically · Enter to send
          </p>
        </div>
      </div>

      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: '#e8623a',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(232,98,58,0.4)',
          zIndex: 51,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(232,98,58,0.55)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(232,98,58,0.4)'
        }}
        aria-label="AI Trip Editor"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12C2 13.85 2.5 15.58 3.37 17.07L2 22L6.93 20.63C8.42 21.5 10.15 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M8 12H8.01M12 12H12.01M16 12H16.01" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 49,
          }}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
