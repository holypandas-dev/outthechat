'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ChatMessage {
  id: string
  trip_id: string
  user_id: string
  body: string
  message_type: 'text' | 'activity_share'
  activity_id: string | null
  created_at: string
  profiles?: { display_name: string | null; avatar_url: string | null } | null
}

interface MemberProfile {
  user_id: string
  display_name: string | null
}

interface TripGroupChatProps {
  tripId: string
  currentUserId: string
  memberProfiles: MemberProfile[]
}

const MEMBER_COLORS = ['#e8623a', '#5b8bd4', '#6bbf8e', '#c47bd4', '#e8a23a']

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜', activity: '🎯', nightlife: '🎉', culture: '🏛️',
  nature: '🌿', hidden_gem: '💎', hotel: '🏨', transport: '🚗',
}

export function TripGroupChat({ tripId, currentUserId, memberProfiles }: TripGroupChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = useRef(createClient())
  const isOpenRef = useRef(false)

  // Build stable lookup maps from props
  const profileLookup = Object.fromEntries(
    memberProfiles.map(m => [m.user_id, m.display_name || 'Member'])
  )
  const colorMap = Object.fromEntries(
    memberProfiles.map((m, i) => [m.user_id, MEMBER_COLORS[i % MEMBER_COLORS.length]])
  )

  // Track open state in ref for use inside event callbacks
  useEffect(() => {
    isOpenRef.current = isOpen
    if (isOpen) setUnreadCount(0)
  }, [isOpen])

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Load messages + realtime + custom events
  useEffect(() => {
    const db = supabase.current

    // Initial load
    db.from('comments')
      .select('*, profiles(display_name, avatar_url)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load messages:', error)
        if (data) setMessages(data as ChatMessage[])
      })

    // Realtime subscription
    const channel = db
      .channel(`group-chat-${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          if (!isOpenRef.current) {
            setUnreadCount(n => n + 1)
          }
        }
      )
      .subscribe()

    // Open panel event
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-group-chat', handleOpen)

    // Share activity to chat event
    const handleShareActivity = async (e: Event) => {
      const { activity } = (e as CustomEvent<{ activity: Record<string, unknown> }>).detail
      setIsOpen(true)
      const { error } = await db.from('comments').insert({
        trip_id: tripId,
        user_id: currentUserId,
        body: JSON.stringify({
          title: activity.title,
          location: activity.location,
          category: activity.category,
          time_slot: activity.time_slot,
          cost_estimate: activity.cost_estimate,
          description: activity.description,
        }),
        message_type: 'activity_share',
        activity_id: activity.id,
      })
      if (error) setSendError(error.message)
    }
    window.addEventListener('share-activity-to-chat', handleShareActivity)

    return () => {
      db.removeChannel(channel)
      window.removeEventListener('open-group-chat', handleOpen)
      window.removeEventListener('share-activity-to-chat', handleShareActivity)
    }
  }, [tripId, currentUserId])

  async function handleSend() {
    const text = input.trim()
    if (!text || isSending) return
    setIsSending(true)
    setSendError(null)
    try {
      const { error } = await supabase.current.from('comments').insert({
        trip_id: tripId,
        user_id: currentUserId,
        body: text,
        message_type: 'text',
      })
      if (error) throw error
      setInput('')
    } catch (err) {
      setSendError(err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  function formatTime(ts: string) {
    const d = new Date(ts)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Yesterday ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  function getSenderName(msg: ChatMessage) {
    return msg.profiles?.display_name || profileLookup[msg.user_id] || 'Member'
  }

  function getSenderColor(userId: string) {
    return colorMap[userId] || '#b8b0a2'
  }

  const panelWidth = isMobile ? '100vw' : '380px'
  const panelRight = isOpen ? '0' : (isMobile ? '-100vw' : '-400px')

  return (
    <>
      {/* Sliding panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: panelRight,
          width: panelWidth,
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
              💬
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#f2ede4', margin: 0 }}>
                Group Chat
              </p>
              <p style={{ fontSize: '11px', color: '#b8b0a2', margin: 0 }}>
                {memberProfiles.length} {memberProfiles.length === 1 ? 'member' : 'members'}
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
              fontSize: '20px',
              lineHeight: 1,
              padding: '4px 6px',
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
            gap: '16px',
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                paddingTop: '60px',
              }}
            >
              <span style={{ fontSize: '32px' }}>💬</span>
              <p style={{ fontSize: '13px', color: '#b8b0a2', textAlign: 'center', margin: 0 }}>
                No messages yet
              </p>
              <p style={{ fontSize: '11px', color: 'rgba(184,176,162,0.6)', textAlign: 'center', margin: 0 }}>
                Share activities or start a conversation
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isOwn = msg.user_id === currentUserId
            const senderName = getSenderName(msg)
            const initial = senderName[0]?.toUpperCase() || '?'
            const color = getSenderColor(msg.user_id)

            if (msg.message_type === 'activity_share') {
              let activity: Record<string, unknown> = {}
              try { activity = JSON.parse(msg.body) } catch { /* skip */ }
              const emoji = CATEGORY_EMOJI[activity.category as string] || '📍'

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: '4px' }}>
                  {!isOwn && (
                    <span style={{ fontSize: '11px', color: '#b8b0a2', paddingLeft: '36px' }}>{senderName}</span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                    {!isOwn && (
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {initial}
                      </div>
                    )}
                    <div style={{
                      maxWidth: '270px',
                      background: '#141412',
                      border: '1px solid rgba(232,98,58,0.25)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        padding: '7px 12px',
                        borderBottom: '1px solid rgba(232,98,58,0.15)',
                        background: 'rgba(232,98,58,0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <span style={{ fontSize: '10px', color: '#e8623a', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {emoji} {activity.category as string}
                        </span>
                        <span style={{ fontSize: '10px', color: 'rgba(232,98,58,0.6)' }}>·</span>
                        <span style={{ fontSize: '10px', color: 'rgba(232,98,58,0.7)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {activity.time_slot as string}
                        </span>
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#f2ede4', margin: '0 0 3px' }}>
                          {activity.title as string}
                        </p>
                        {activity.location && (
                          <p style={{ fontSize: '11px', color: '#b8b0a2', margin: '0 0 4px' }}>
                            📍 {activity.location as string}
                          </p>
                        )}
                        {(activity.cost_estimate as number) > 0 && (
                          <p style={{ fontSize: '11px', color: '#f2ede4', margin: 0, fontFamily: 'monospace' }}>
                            ~${activity.cost_estimate as number}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', color: 'rgba(184,176,162,0.6)', paddingLeft: isOwn ? 0 : '36px', paddingRight: isOwn ? '2px' : 0 }}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              )
            }

            // Text message
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: '4px' }}>
                {!isOwn && (
                  <span style={{ fontSize: '11px', color: '#b8b0a2', paddingLeft: '36px' }}>{senderName}</span>
                )}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                  {!isOwn && (
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {initial}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '250px',
                    padding: '9px 13px',
                    borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isOwn ? '#e8623a' : '#1a1a17',
                    border: isOwn ? 'none' : '1px solid rgba(242,237,228,0.08)',
                    color: '#f2ede4',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    wordBreak: 'break-word',
                  }}>
                    {msg.body}
                  </div>
                </div>
                <span style={{ fontSize: '10px', color: 'rgba(184,176,162,0.6)', paddingLeft: isOwn ? 0 : '36px', paddingRight: isOwn ? '2px' : 0 }}>
                  {formatTime(msg.created_at)}
                </span>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: '12px 16px 16px',
            borderTop: '1px solid rgba(242,237,228,0.08)',
            flexShrink: 0,
          }}
        >
          {sendError && (
            <p style={{
              fontSize: '11px',
              color: '#e05a3a',
              margin: '0 0 8px',
              padding: '6px 10px',
              background: 'rgba(224,90,58,0.1)',
              border: '1px solid rgba(224,90,58,0.25)',
              borderRadius: '8px',
            }}>
              {sendError}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              background: '#141412',
              border: '1px solid rgba(242,237,228,0.1)',
              borderRadius: '12px',
              padding: '10px 12px',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message..."
              disabled={isSending}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#f2ede4',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: input.trim() && !isSending ? '#e8623a' : 'rgba(232,98,58,0.2)',
                border: 'none',
                cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed',
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
                  stroke={input.trim() && !isSending ? '#fff' : 'rgba(232,98,58,0.6)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop (mobile only) */}
      {isOpen && isMobile && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 49,
          }}
        />
      )}

      {/* Unread badge on nav button (dispatches event to update) */}
      {unreadCount > 0 && !isOpen && (
        <style>{`
          [data-chat-badge]::after {
            content: '${unreadCount > 9 ? '9+' : unreadCount}';
            position: absolute;
            top: -4px;
            right: -6px;
            background: #e8623a;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            min-width: 14px;
            height: 14px;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 3px;
          }
        `}</style>
      )}
    </>
  )
}
