import './ReferralCentre.css'

export default function ReferralShortcut({
  compact = false
}) {
  return (
    <section
      className={
        'prf-shortcut' +
        (compact ? ' prf-shortcut-compact' : '')
      }
    >
      <div className="prf-shortcut-icon"
        aria-hidden="true">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="8" width="18" height="4" rx="1"/>
          <path d="M5 12v9h14v-9M12 8v13"/>
          <path d="M12 8H8.5a2.5 2.5 0 1 1 2.5-2.5L12 8Z"/>
          <path d="M12 8h3.5A2.5 2.5 0 1 0 13 5.5L12 8Z"/>
        </svg>
      </div>

      <div className="prf-shortcut-text">
        <strong>Invite friends. Earn Premium.</strong>
        <small>
          Get one day of Premium for every new
          student who joins through your link.
        </small>
      </div>

      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new Event('periak:open-referrals')
          )
        }}
      >
        Invite &amp; Earn
      </button>
    </section>
  )
}
