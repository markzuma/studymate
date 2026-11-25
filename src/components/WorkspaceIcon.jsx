export default function WorkspaceIcon({
  name,
  size = 21,
  ...props
}) {
  const paths = {
    home: <>
      <path d="m3 10 9-7 9 7"/>
      <path d="M5 9v12h5v-7h4v7h5V9"/>
    </>,
    courses: <>
      <path d="m2 7 10-5 10 5-10 5z"/>
      <path d="m2 12 10 5 10-5"/>
      <path d="m2 17 10 5 10-5"/>
    </>,
    book: <>
      <path d="M12 5v16"/>
      <path d="M12 5C8 2 4 3 2 4v16c4-2 7-2 10 1"/>
      <path d="M12 5c4-3 8-2 10-1v16c-4-2-7-2-10 1"/>
    </>,
    exams: <>
      <path d="m2 8 10-5 10 5-10 5z"/>
      <path d="M6 10v7c4 3 8 3 12 0v-7"/>
      <path d="M22 8v9"/>
    </>,
    papers: <>
      <path d="M5 2h9l5 5v15H5z"/>
      <path d="M14 2v6h5M8 12h8M8 16h8"/>
    </>,
    tools: <>
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </>,
    planner: <>
      <rect x="3" y="5" width="18" height="17" rx="2"/>
      <path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3"/>
    </>,
    premium: <>
      <path d="m2 5 5 5 5-7 5 7 5-5-3 13H5z"/>
      <path d="M5 22h14"/>
    </>,
    account: <>
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 22v-3a8 8 0 0 1 16 0v3z"/>
    </>,
    progress: <>
      <path d="M4 21v-6M9 21V10M14 21V6M19 21V2"/>
    </>,
    play: <>
      <circle cx="12" cy="12" r="10"/>
      <path d="m10 7 7 5-7 5z"/>
    </>,
    question: <>
      <circle cx="12" cy="12" r="10"/>
      <path d="M9 8a3 3 0 1 1 5 2c-2 2-2 2-2 4"/>
      <path d="M12 18h.01"/>
    </>,
    bolt: <path d="m13 2-10 12h8l-1 8 11-13h-9z"/>,
    chevron: <path d="m9 5 7 7-7 7"/>,
    down: <path d="m6 9 6 6 6-6"/>,
    back: <path d="m14 5-7 7 7 7M7 12h15"/>,
    check: <>
      <circle cx="12" cy="12" r="10"/>
      <path d="m7 12 3 3 7-7"/>
    </>,
    clinical: <>
      <path d="M4 3v7a6 6 0 0 0 12 0V3"/>
      <path d="M2 3h4M14 3h4M10 16v2a4 4 0 0 0 8 0"/>
      <circle cx="20" cy="14" r="3"/>
    </>,
    simulator: <>
      <path d="M2 12h5l3-8 4 16 3-8h5"/>
    </>,
    tutor: <>
      <path d="M3 3h18v15H9l-6 4z"/>
      <path d="M7 8h10M7 12h7"/>
    </>,
    hub: <>
      <rect x="3" y="3" width="5" height="18" rx="1"/>
      <rect x="10" y="3" width="5" height="18" rx="1"/>
      <path d="m17 4 4-1 4 17-4 1z"/>
    </>
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.book}
    </svg>
  )
}
