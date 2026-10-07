export const currentUser = {
  id: 'usr-1',
  name: 'Alex Rivera',
  email: 'alex.rivera@relay.dev',
  status: 'online',
  role: 'Lead Frontend Engineer'
};

export const mockEmails = [
  {
    id: 'em-1',
    senderName: 'Sarah Jenkins',
    senderEmail: 'sarah.j@enterprise.io',
    recipient: 'alex.rivera@relay.dev',
    subject: 'Q4 Product Roadmap & Architecture Sync',
    preview: 'Hi Alex, following up on our quarterly alignment meeting. The team has outlined the primary real-time milestones...',
    body: 'Hi Alex,\n\nFollowing up on our quarterly alignment meeting. The team has outlined the primary real-time milestones for Relay.\n\nWe would love your thoughts on the modular component system before we freeze the design specs next Wednesday.\n\nBest regards,\nSarah Jenkins',
    timestamp: '10:42 AM',
    unread: true,
    starred: true,
    folder: 'inbox',
    attachmentsCount: 2,
    tags: ['Roadmap', 'Design']
  },
  {
    id: 'em-2',
    senderName: 'DevOps Automated Alert',
    senderEmail: 'alerts@infra.internal',
    recipient: 'engineering@relay.dev',
    subject: '[Resolved] Production Staging Ingress Latency Recovery',
    preview: 'Traffic ingress latency returned to baseline (<15ms) across EU and US-East clusters following edge proxy updates.',
    body: 'The automated health monitor has marked the incident INC-8921 as RESOLVED. Baseline response times have stabilized at 12ms average.\n\nNo developer action is required.',
    timestamp: '09:15 AM',
    unread: true,
    starred: false,
    folder: 'inbox',
    tags: ['Infra']
  },
  {
    id: 'em-3',
    senderName: 'Marcus Vance',
    senderEmail: 'm.vance@venturelabs.co',
    recipient: 'alex.rivera@relay.dev',
    subject: 'Feedback on the unified communication canvas',
    preview: 'The balance between calm whitespace and dense operational data in the new navigation shell looks exceptionally sharp.',
    body: 'Alex,\n\nJust reviewed the interactive layout prototypes. The restrained indigo accent system works significantly better than high-saturation alternatives for all-day focus.\n\nLet us schedule 15 minutes to review file dropzone micro-interactions tomorrow.\n\nCheers,\nMarcus',
    timestamp: 'Yesterday',
    unread: false,
    starred: true,
    folder: 'inbox',
    attachmentsCount: 1,
    tags: ['Feedback']
  },
  {
    id: 'em-4',
    senderName: 'Security Ops',
    senderEmail: 'security@relay.dev',
    recipient: 'alex.rivera@relay.dev',
    subject: 'Annual SOC2 Access Audit Confirmation',
    preview: 'Please confirm that your active developer cryptographic keys and multi-factor hardware tokens have been verified.',
    body: 'Annual compliance review is underway. Please sign off on your cryptographic key fingerprint in the internal directory by Friday.',
    timestamp: 'Oct 05',
    unread: false,
    starred: false,
    folder: 'inbox',
    tags: ['Security']
  },
  {
    id: 'em-5',
    senderName: 'Alex Rivera',
    senderEmail: 'alex.rivera@relay.dev',
    recipient: 'sarah.j@enterprise.io',
    subject: 'Re: Q4 Product Roadmap & Architecture Sync',
    preview: 'Hi Sarah, I reviewed the real-time milestones. The modular component structure aligns cleanly with the design specs...',
    body: 'Hi Sarah,\n\nI reviewed the real-time milestones. The modular component structure aligns cleanly with the design specs. Let us proceed with the review next Wednesday.\n\nBest,\nAlex',
    timestamp: 'Oct 04',
    unread: false,
    starred: false,
    folder: 'sent',
    tags: ['Roadmap', 'Architecture']
  },
  {
    id: 'em-6',
    senderName: 'Alex Rivera',
    senderEmail: 'alex.rivera@relay.dev',
    recipient: 'team@relay.dev',
    subject: '[Draft] Relay V1 Component Library Guidelines',
    preview: 'Notes on typography hierarchy, accessible color tokens, and keyboard navigation standards...',
    body: 'Notes on typography hierarchy, accessible color tokens, and keyboard navigation standards for Relay.\n\n1. Use calm slate surfaces\n2. Use restrained indigo accents\n3. Support full keyboard navigation',
    timestamp: 'Oct 03',
    unread: false,
    starred: false,
    folder: 'drafts',
    tags: ['Design', 'Guidelines']
  },
  {
    id: 'em-7',
    senderName: 'Newsletter Dispatch',
    senderEmail: 'digest@techweekly.news',
    recipient: 'alex.rivera@relay.dev',
    subject: 'Weekly Tech Digest #412',
    preview: 'Top trends in frontend engineering, distributed state systems, and real-time collaboration engines...',
    body: 'This week in engineering: distributed protocols, WebSockets vs Server-Sent Events, and accessible keyboard designs.',
    timestamp: 'Sep 29',
    unread: false,
    starred: false,
    folder: 'trash',
    tags: ['Newsletter']
  }
];

export const mockConversations = [
  {
    id: 'c-1',
    type: 'channel',
    name: 'general-announcements',
    topic: 'Company-wide updates, product launches, and milestones',
    lastMessage: 'Sarah: Sprint 14 demo begins in 30 minutes in Room 4B.',
    timestamp: '11:15 AM',
    unreadCount: 3,
    membersCount: 48
  },
  {
    id: 'c-2',
    type: 'channel',
    name: 'frontend-core',
    topic: 'Relay client architecture, accessibility, & tokens',
    lastMessage: 'Alex: Scaffolding the responsive app shell with Vite & Tailwind.',
    timestamp: '10:30 AM',
    unreadCount: 0,
    membersCount: 12
  },
  {
    id: 'c-3',
    type: 'direct',
    name: 'Elena Rostova',
    role: 'Principal UX Designer',
    avatarUrl: '',
    lastMessage: 'Can you double-check the contrast ratio on the badge pills?',
    timestamp: '10:02 AM',
    unreadCount: 1,
    status: 'online',
    isOnline: true
  },
  {
    id: 'c-4',
    type: 'direct',
    name: 'David Chen',
    role: 'Full Stack Engineer',
    avatarUrl: '',
    lastMessage: 'Sending over the updated SVG icon set shortly.',
    timestamp: 'Yesterday',
    unreadCount: 0,
    status: 'away',
    isOnline: false
  },
  {
    id: 'c-5',
    type: 'channel',
    name: 'release-ops',
    topic: 'Deployment pipelines, staging builds & canary metrics',
    lastMessage: 'DevOps: Latency recovered to 12ms baseline.',
    timestamp: '09:20 AM',
    unreadCount: 1,
    membersCount: 18
  },
  {
    id: 'c-6',
    type: 'direct',
    name: 'Sarah Jenkins',
    role: 'VP of Product',
    avatarUrl: '',
    lastMessage: 'Loved the updated email draft persistence interaction.',
    timestamp: 'Yesterday',
    unreadCount: 0,
    status: 'online',
    isOnline: true
  },
  {
    id: 'c-7',
    type: 'direct',
    name: 'Marcus Vance',
    role: 'Technical Advisor',
    avatarUrl: '',
    lastMessage: 'Hey Alex, excited to test the enhanced Chat module.',
    timestamp: '10:15 AM',
    unreadCount: 0,
    status: 'offline',
    isOnline: false
  }
];

export const mockChatMessages = {
  'c-1': [
    {
      id: 'm-1',
      senderId: 'usr-2',
      senderName: 'Elena Rostova',
      content: 'Good morning everyone! Please make sure pull requests for sprint 14 are reviewed before noon.',
      timestamp: '09:00 AM',
      date: 'Today',
      isSelf: false
    },
    {
      id: 'm-2',
      senderId: 'usr-2',
      senderName: 'Elena Rostova',
      content: 'Also, UX guidelines for the chat layout have been published in #design.',
      timestamp: '09:02 AM',
      date: 'Today',
      isSelf: false
    },
    {
      id: 'm-3',
      senderId: 'usr-3',
      senderName: 'Sarah Jenkins',
      content: 'Sprint 14 demo begins in 30 minutes in Room 4B. The link is in the calendar invite.',
      timestamp: '11:15 AM',
      date: 'Today',
      isSelf: false
    }
  ],
  'c-2': [
    {
      id: 'm-4',
      senderId: 'usr-4',
      senderName: 'Marcus Vance',
      content: 'Hey Alex, do we have the app shell layout container finalized?',
      timestamp: '04:45 PM',
      date: 'Yesterday',
      isSelf: false
    },
    {
      id: 'm-5',
      senderId: 'usr-1',
      senderName: 'Alex Rivera',
      content: 'Yes! Scaffolding the responsive app shell with Vite & Tailwind now.',
      timestamp: '05:00 PM',
      date: 'Yesterday',
      status: 'read',
      isSelf: true
    },
    {
      id: 'm-6',
      senderId: 'usr-1',
      senderName: 'Alex Rivera',
      content: 'Keeping the surfaces calm slate neutral with restrained indigo accents.',
      timestamp: '05:01 PM',
      date: 'Yesterday',
      status: 'read',
      isSelf: true
    },
    {
      id: 'm-7',
      senderId: 'usr-4',
      senderName: 'Marcus Vance',
      content: 'That matches our product design system perfectly. Let us review the chat module next.',
      timestamp: '10:15 AM',
      date: 'Today',
      isSelf: false
    },
    {
      id: 'm-8',
      senderId: 'usr-1',
      senderName: 'Alex Rivera',
      content: 'Working on search, filters, sender grouping, and responsive layout right now.',
      timestamp: '10:30 AM',
      date: 'Today',
      status: 'delivered',
      isSelf: true
    }
  ],
  'c-3': [
    {
      id: 'm-9',
      senderId: 'usr-2',
      senderName: 'Elena Rostova',
      content: 'Hi Alex! The typography hierarchy in the new inbox reading pane looks really great.',
      timestamp: '09:40 AM',
      date: 'Today',
      isSelf: false
    },
    {
      id: 'm-10',
      senderId: 'usr-2',
      senderName: 'Elena Rostova',
      content: 'Can you double-check the contrast ratio on the badge pills? Just want to ensure WCAG AA compliance.',
      timestamp: '10:02 AM',
      date: 'Today',
      isSelf: false
    }
  ],
  'c-4': [
    {
      id: 'm-11',
      senderId: 'usr-5',
      senderName: 'David Chen',
      content: 'Hey Alex, I am assembling the SVG icon set for the message stream.',
      timestamp: '02:15 PM',
      date: 'Yesterday',
      isSelf: false
    },
    {
      id: 'm-12',
      senderId: 'usr-5',
      senderName: 'David Chen',
      content: 'Sending over the updated SVG icon set shortly.',
      timestamp: '02:30 PM',
      date: 'Yesterday',
      isSelf: false
    }
  ],
  'c-5': [
    {
      id: 'm-13',
      senderId: 'usr-6',
      senderName: 'DevOps Automated Alert',
      content: 'Latency recovered to 12ms baseline across EU-West cluster.',
      timestamp: '09:20 AM',
      date: 'Today',
      isSelf: false
    }
  ],
  'c-6': [
    {
      id: 'm-14',
      senderId: 'usr-3',
      senderName: 'Sarah Jenkins',
      content: 'Loved the updated email draft persistence interaction. Can we bring that same polish to chat?',
      timestamp: 'Yesterday',
      date: 'Yesterday',
      isSelf: false
    }
  ]
};

export const mockContacts = [
  {
    id: 'ct-1',
    name: 'Elena Rostova',
    email: 'elena.rostova@relay.dev',
    phone: '+1 (555) 234-8901',
    role: 'Principal UX Designer',
    department: 'Design',
    location: 'San Francisco, CA (PST)',
    bio: 'Leads Relay design tokens, design systems, and accessible interface standards.',
    status: 'online',
    recentActivity: 'Shared Relay-Design-System-v2.fig 2 hours ago'
  },
  {
    id: 'ct-2',
    name: 'David Chen',
    email: 'david.chen@relay.dev',
    phone: '+1 (555) 456-1123',
    role: 'Full Stack Engineer',
    department: 'Engineering',
    location: 'Seattle, WA (PST)',
    bio: 'Specializes in real-time socket clusters, message queues, and Node.js backends.',
    status: 'away',
    recentActivity: 'Pushed edge ingress performance improvements yesterday'
  },
  {
    id: 'ct-3',
    name: 'Sarah Jenkins',
    email: 'sarah.j@enterprise.io',
    phone: '+1 (555) 789-4450',
    role: 'VP of Product',
    department: 'Product',
    location: 'New York, NY (EST)',
    bio: 'Leads quarterly roadmap alignment and enterprise communications strategy.',
    status: 'online',
    recentActivity: 'Sent Q4 Product Roadmap & Architecture Sync email'
  },
  {
    id: 'ct-4',
    name: 'Marcus Vance',
    email: 'm.vance@venturelabs.co',
    phone: '+1 (555) 321-9988',
    role: 'Technical Advisor',
    department: 'Advisory',
    location: 'Austin, TX (CST)',
    bio: 'Consults on real-time event streaming and scalable client-server architectures.',
    status: 'offline',
    recentActivity: 'Reviewed unified communication canvas layout'
  },
  {
    id: 'ct-5',
    name: 'Liam Patel',
    email: 'liam.patel@relay.dev',
    phone: '+44 20 7946 0912',
    role: 'Frontend Architect',
    department: 'Engineering',
    location: 'London, UK (GMT)',
    bio: 'Focuses on Vite bundler optimizations, tree shaking, and zero-runtime CSS tokens.',
    status: 'online',
    recentActivity: 'Audited client build pipeline and asset chunks'
  },
  {
    id: 'ct-6',
    name: 'Chloe Bennett',
    email: 'chloe.b@relay.dev',
    phone: '+1 (555) 678-9012',
    role: 'Head of People & Ops',
    department: 'Operations',
    location: 'Chicago, IL (CST)',
    bio: 'Oversees organizational growth, developer onboarding, and remote work infrastructure.',
    status: 'online',
    recentActivity: 'Published team scheduling guide for Q4 sprint demo'
  },
  {
    id: 'ct-7',
    name: 'Maya Lin',
    email: 'maya.lin@relay.dev',
    phone: '+1 (555) 890-1234',
    role: 'Motion & Brand Designer',
    department: 'Design',
    location: 'San Francisco, CA (PST)',
    bio: 'Crafts micro-interactions, responsive SVG iconography, and brand guidelines.',
    status: 'away',
    recentActivity: 'Updated SVG icon set and brand palette tokens'
  },
  {
    id: 'ct-8',
    name: 'Zack Miller',
    email: 'zack.miller@relay.dev',
    phone: '+1 (555) 345-6789',
    role: 'Developer Relations Lead',
    department: 'Marketing',
    location: 'Toronto, Canada (EST)',
    bio: 'Coordinates community feedback, open documentation, and developer ecosystem.',
    status: 'offline',
    recentActivity: 'Drafted developer setup guide for Relay client'
  }
];

export const mockFiles = [
  {
    id: 'f-1',
    name: 'Relay-Design-System-v2.fig',
    size: '14.2 MB',
    sizeBytes: 14889779,
    type: 'design',
    updatedAt: '2 hours ago',
    date: '2026-10-07T13:30:00Z',
    sharedBy: 'Elena Rostova',
    relatedContext: {
      type: 'chat',
      title: '#frontend-core',
      snippet: 'Elena shared the updated component kit'
    },
    previewSnippet: 'Figma binary component library containing Relay UI frames, design tokens, light/dark surfaces, and accessible focus rings.'
  },
  {
    id: 'f-2',
    name: 'Q4-Architecture-Roadmap.pdf',
    size: '3.8 MB',
    sizeBytes: 3984588,
    type: 'document',
    updatedAt: 'Yesterday',
    date: '2026-10-06T10:42:00Z',
    sharedBy: 'Sarah Jenkins',
    relatedContext: {
      type: 'email',
      title: 'Q4 Product Roadmap & Architecture Sync',
      snippet: 'Attached to quarterly planning email'
    },
    previewSnippet: 'Quarterly milestone plan covering real-time messaging latency targets (<20ms) and multi-device session sync.'
  },
  {
    id: 'f-3',
    name: 'relay-brand-tokens.json',
    size: '48 KB',
    sizeBytes: 49152,
    type: 'code',
    updatedAt: '3 days ago',
    date: '2026-10-04T15:20:00Z',
    sharedBy: 'Alex Rivera',
    relatedContext: {
      type: 'chat',
      title: '#frontend-core',
      snippet: 'Alex posted the color scale specification'
    },
    previewSnippet: '{\n  "colors": {\n    "brand-50": "#eef2ff",\n    "brand-600": "#4f46e5",\n    "surface-slate": "#f8fafc"\n  }\n}'
  },
  {
    id: 'f-4',
    name: 'Security-Audit-Checklist.xlsx',
    size: '890 KB',
    sizeBytes: 911360,
    type: 'document',
    updatedAt: 'Oct 04',
    date: '2026-10-04T08:15:00Z',
    sharedBy: 'Security Ops',
    relatedContext: {
      type: 'email',
      title: 'Annual SOC2 Access Audit Confirmation',
      snippet: 'Attached to SOC2 compliance verification'
    },
    previewSnippet: 'Compliance verification sheet including cryptographic keys, multi-factor tokens, and IAM role certifications.'
  },
  {
    id: 'f-5',
    name: 'relay-mobile-mockups.png',
    size: '5.6 MB',
    sizeBytes: 5872025,
    type: 'image',
    updatedAt: 'Oct 03',
    date: '2026-10-03T16:00:00Z',
    sharedBy: 'Maya Lin',
    relatedContext: {
      type: 'chat',
      title: 'Elena Rostova',
      snippet: 'Maya sent direct mobile viewport mockup'
    },
    previewSnippet: 'High-resolution PNG mockup demonstrating responsive drawer navigation, touch targets, and chat bubble layouts.'
  },
  {
    id: 'f-6',
    name: 'socket-event-protocol-spec.md',
    size: '24 KB',
    sizeBytes: 24576,
    type: 'code',
    updatedAt: 'Oct 02',
    date: '2026-10-02T11:00:00Z',
    sharedBy: 'David Chen',
    relatedContext: {
      type: 'chat',
      title: '#release-ops',
      snippet: 'David posted event protocol draft'
    },
    previewSnippet: '# Socket Event Protocol\n- message:new (payload: ChatMessage)\n- presence:update (payload: UserStatus)\n- typing:start (payload: { userId, channelId })'
  }
];

export const mockNotifications = [
  {
    id: 'n-1',
    title: 'New unread email',
    description: 'Sarah Jenkins sent "Q4 Product Roadmap & Architecture Sync"',
    timestamp: '10:42 AM',
    read: false,
    type: 'email',
    targetTab: 'inbox',
    targetEmailId: 'e-1'
  },
  {
    id: 'n-2',
    title: 'Mentioned in #frontend-core',
    description: 'Marcus Vance: "Hey Alex, do we have the app shell scaffolding ready?"',
    timestamp: '10:15 AM',
    read: false,
    type: 'chat',
    targetTab: 'chat',
    targetConvId: 'c-2'
  },
  {
    id: 'n-3',
    title: 'Design System Tokens Updated',
    description: 'Elena Rostova updated color tokens & contrast ratios in Figma',
    timestamp: '09:40 AM',
    read: false,
    type: 'email',
    targetTab: 'inbox',
    targetEmailId: 'e-2'
  },
  {
    id: 'n-4',
    title: 'Direct message from Elena Rostova',
    description: '"Can you double-check the contrast ratio on the badge pills?"',
    timestamp: '09:20 AM',
    read: false,
    type: 'chat',
    targetTab: 'chat',
    targetConvId: 'c-3'
  },
  {
    id: 'n-5',
    title: 'Automated Build Success',
    description: 'Relay client package passed unit test and production build validations.',
    timestamp: '09:00 AM',
    read: true,
    type: 'system'
  },
  {
    id: 'n-6',
    title: 'Security Alert: New Sign-in',
    description: 'New session started from Chrome on Windows (Relay Core Dev).',
    timestamp: 'Yesterday',
    read: true,
    type: 'system'
  },
  {
    id: 'n-7',
    title: 'Incident Resolved: #release-ops',
    description: 'DevOps confirmed staging latency recovered to 12ms baseline.',
    timestamp: 'Yesterday',
    read: true,
    type: 'chat',
    targetTab: 'chat',
    targetConvId: 'c-5'
  },
  {
    id: 'n-8',
    title: 'Local Draft Synchronized',
    description: 'Your offline draft was saved to local browser storage automatically.',
    timestamp: 'Yesterday',
    read: true,
    type: 'system'
  }
];
