'use client'

export function TripChatNavButton() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent('open-group-chat'))
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm hover:text-text-primary transition-colors"
      style={{ color: 'var(--text-secondary)' }}
    >
      💬 Chat
    </button>
  )
}
