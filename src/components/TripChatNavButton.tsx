'use client'

export function TripChatNavButton() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent('open-group-chat'))
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-[#b8b0a2] hover:text-[#f2ede4] transition-colors"
    >
      💬 Chat
    </button>
  )
}
