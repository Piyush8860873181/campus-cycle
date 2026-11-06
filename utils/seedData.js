const bcrypt = require('bcryptjs');

const categoriesData = [
  {
    name: 'Books & Reference Materials',
    slug: 'books-reference',
    icon: 'BookOpen',
    description: 'Standard textbooks, reference guides, syllabus handbooks, and entrance prep books.'
  },
  {
    name: 'Notes & Study Materials',
    slug: 'notes-study-materials',
    icon: 'FileText',
    description: 'Handwritten toppers notes, semester exam question banks, and summarized cheatsheets.'
  },
  {
    name: 'Lab Equipment & Lab Coats',
    slug: 'lab-equipment-coats',
    icon: 'FlaskConical',
    description: 'Cotton lab aprons, chemistry glassware sets, dissecting kits, and physics breadboards.'
  },
  {
    name: 'Scientific Calculators',
    slug: 'scientific-calculators',
    icon: 'Calculator',
    description: 'Casio fx-991EX, fx-82MS, graphical calculators, and matrix solvers for engineering exams.'
  },
  {
    name: 'Laptops & Computers',
    slug: 'laptops-computers',
    icon: 'Laptop',
    description: 'Coding laptops, refurbished MacBooks/ThinkPads, monitors, and compact college PCs.'
  },
  {
    name: 'Electronics & Accessories',
    slug: 'electronics-accessories',
    icon: 'Headphones',
    description: 'Mechanical keyboards, wireless mice, noise-canceling headphones, USB hubs, and adapters.'
  },
  {
    name: 'Engineering & Drawing Tools',
    slug: 'engineering-drawing-tools',
    icon: 'Compass',
    description: 'Mini drafters, T-squares, imperial sheet holders, stencil sets, and mechanical pencils.'
  },
  {
    name: 'Hostel Essentials',
    slug: 'hostel-essentials',
    icon: 'Home',
    description: 'Electric kettles, study lamps, laundry organizers, mattresses, buckets, and room fans.'
  },
  {
    name: 'Stationery',
    slug: 'stationery',
    icon: 'PenTool',
    description: 'Graph pads, highlighters, sticky notes, binder clips, and file folders.'
  },
  {
    name: 'Others',
    slug: 'others',
    icon: 'Package',
    description: 'Sports equipment, campus cycles, gym gear, musical instruments, and bags.'
  }
];

const getHashedPassword = (pwd) => bcrypt.hashSync(pwd, 10);

const getSeedUsers = () => [
  {
    _id: 'user_admin_001',
    fullName: 'Dr. Suresh Admin',
    email: 'admin@campuscycle.edu',
    password: getHashedPassword('admin123'),
    collegeName: 'Delhi University',
    course: 'Administration',
    branch: 'Campus Sustainability Office',
    academicYear: 'Staff',
    contactNumber: '+91 98110 12345',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Campus administrator ensuring fair deals, green initiatives, and student safety.',
    role: 'admin',
    isCollegeVerified: true,
    isSuspended: false
  },
  {
    _id: 'user_aarav_002',
    fullName: 'Aarav Patel',
    email: 'aarav@du.ac.in',
    password: getHashedPassword('student123'),
    collegeName: 'Delhi University',
    course: 'B.Tech',
    branch: 'Computer Science & Engineering',
    academicYear: '4th Year (Graduating)',
    contactNumber: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    bio: 'Graduating senior clearing out my room and study desk! Everything well maintained.',
    role: 'user',
    isCollegeVerified: true,
    isSuspended: false
  },
  {
    _id: 'user_priya_003',
    fullName: 'Priya Sharma',
    email: 'priya@ipu.ac.in',
    password: getHashedPassword('student123'),
    collegeName: 'IP University',
    course: 'B.Tech',
    branch: 'Electronics & Communication',
    academicYear: '3rd Year',
    contactNumber: '+91 98234 56789',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    bio: 'ECE junior sharing textbooks and notes. Always happy to negotiate for fellow students.',
    role: 'user',
    isCollegeVerified: true,
    isSuspended: false
  },
  {
    _id: 'user_rohan_004',
    fullName: 'Rohan Verma',
    email: 'rohan@iitd.ac.in',
    password: getHashedPassword('student123'),
    collegeName: 'IIT Delhi',
    course: 'B.Tech',
    branch: 'Mechanical Engineering',
    academicYear: '2nd Year',
    contactNumber: '+91 98101 98765',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Mechanical branch enthusiast. Selling my 1st year drafting set and physics books.',
    role: 'user',
    isCollegeVerified: true,
    isSuspended: false
  },
  {
    _id: 'user_ananya_005',
    fullName: 'Ananya Iyer',
    email: 'ananya@dtu.ac.in',
    password: getHashedPassword('student123'),
    collegeName: 'Delhi Technological University',
    course: 'B.Tech',
    branch: 'Information Technology',
    academicYear: '4th Year (Graduating)',
    contactNumber: '+91 98345 67890',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Relocating post-graduation. Bundling hostel gear and electronics at heavy student discounts.',
    role: 'user',
    isCollegeVerified: true,
    isSuspended: false
  }
];

const getSeedProducts = () => [
  {
    _id: 'prod_001',
    title: 'Casio fx-991EX ClassWiz Scientific Calculator (Mint Condition)',
    description: 'High-resolution natural textbook display with 552 functions including matrix, vector, and equation calculations. Used for 2 semesters only. Battery fresh, original sliding hard cover included.',
    category: 'Scientific Calculators',
    condition: 'Like New',
    sellingPrice: 850,
    originalPrice: 1750,
    isNegotiable: true,
    images: [
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_aarav_002',
    collegeName: 'Delhi University',
    department: 'Computer Science',
    meetingLocation: 'Central Science Library entrance or North Campus Metro Gate 3',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: true,
    viewsCount: 142,
    featured: true
  },
  {
    _id: 'prod_002',
    title: 'Complete Engineering Drawing Kit: Mini Drafter, T-Square & Canvas Sheet Holder',
    description: 'Complete 1st/2nd semester engineering graphics package! Includes branded Omega mini-drafter with zero wobbling, stainless steel clips, set squares, and heavy-duty water-resistant tubular sheet holder.',
    category: 'Engineering & Drawing Tools',
    condition: 'Good',
    sellingPrice: 650,
    originalPrice: 1600,
    isNegotiable: true,
    images: [
      'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_rohan_004',
    collegeName: 'IIT Delhi',
    department: 'Mechanical Engineering',
    meetingLocation: 'Nilgiri Hostel Common Room or Main Canteen Lawn',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: false,
    viewsCount: 98,
    featured: true
  },
  {
    _id: 'prod_003',
    title: 'Data Structures and Algorithms in C++ by Mark Allen Weiss + Handwritten DS Notes',
    description: 'Essential textbook for second-year CSE/IT students. Hardcover 4th Edition. Clean pages with zero pen marks. Free bonus: 120-page spiral bound handwritten revision notes on Trees, Graphs, and DP.',
    category: 'Books & Reference Materials',
    condition: 'Like New',
    sellingPrice: 420,
    originalPrice: 950,
    isNegotiable: true,
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_aarav_002',
    collegeName: 'Delhi University',
    department: 'Computer Science',
    meetingLocation: 'Arts Faculty Canteen or D-School steps',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: true,
    viewsCount: 210,
    featured: true
  },
  {
    _id: 'prod_004',
    title: 'Pure Cotton Lab Coat (Size 38 / M) + Safety Eye Goggles Bundle',
    description: 'Thick 100% white cotton chemistry/biology lab apron. No stains, all buttons intact, sanitized and ironed. Comes with anti-fog protective splash goggles required for college labs.',
    category: 'Lab Equipment & Lab Coats',
    condition: 'Good',
    sellingPrice: 280,
    originalPrice: 650,
    isNegotiable: false,
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_priya_003',
    collegeName: 'IP University',
    department: 'Electronics & Communication',
    meetingLocation: 'Dwarka Campus Block C Lobby',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: false,
    viewsCount: 65,
    featured: false
  },
  {
    _id: 'prod_005',
    title: 'Prestige 1.5L Stainless Steel Electric Kettle (Hostel Essential)',
    description: 'Lifesaver for late night study sessions, Maggie noodles, coffee, and green tea! Auto-cut off feature, 360-degree swivel base, concealed heating element. 100% clean and working properly.',
    category: 'Hostel Essentials',
    condition: 'Good',
    sellingPrice: 490,
    originalPrice: 1195,
    isNegotiable: true,
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_ananya_005',
    collegeName: 'Delhi Technological University',
    department: 'Information Technology',
    meetingLocation: 'DTU Mech Canteen or Girls Hostel Gate',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: true,
    viewsCount: 180,
    featured: true
  },
  {
    _id: 'prod_006',
    title: 'Logitech K380 Multi-Device Bluetooth Wireless Keyboard',
    description: 'Super compact, quiet round keys, pairs seamlessly with up to 3 devices (laptop, tablet, phone). Fresh AAA batteries included. Perfect for library coding and studying without carrying heavy clunky keyboards.',
    category: 'Electronics & Accessories',
    condition: 'Like New',
    sellingPrice: 1450,
    originalPrice: 2895,
    isNegotiable: true,
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541140532154-b024d705b909?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_ananya_005',
    collegeName: 'Delhi Technological University',
    department: 'Information Technology',
    meetingLocation: 'Library Ground Floor Reading Room',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: true,
    viewsCount: 310,
    featured: true
  },
  {
    _id: 'prod_007',
    title: 'Wipro LED Eye-Care Desk Lamp with 3 Color Modes & Dimmable Brightness',
    description: 'Flexible goose neck, warm/cool/neutral light options, USB rechargeable with 4-hour battery backup during hostel power cuts. Kept on my desk for one year only.',
    category: 'Hostel Essentials',
    condition: 'Like New',
    sellingPrice: 420,
    originalPrice: 999,
    isNegotiable: true,
    images: [
      'https://images.unsplash.com/photo-1534972195531-a756b1126f24?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_rohan_004',
    collegeName: 'IIT Delhi',
    department: 'Mechanical Engineering',
    meetingLocation: 'SAC (Student Activity Center) Coffee Cafe',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: false,
    viewsCount: 88,
    featured: false
  },
  {
    _id: 'prod_008',
    title: 'Higher Engineering Mathematics by B.S. Grewal (44th Latest Edition)',
    description: 'The holy grail of engineering mathematics across all semesters (Calculus, Differential Equations, Linear Algebra, Probability). All 1300 pages intact with protective laminated cover.',
    category: 'Books & Reference Materials',
    condition: 'Good',
    sellingPrice: 390,
    originalPrice: 850,
    isNegotiable: true,
    images: [
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_priya_003',
    collegeName: 'IP University',
    department: 'Electronics & Communication',
    meetingLocation: 'Main Campus Admin Block Fountain',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: false,
    viewsCount: 154,
    featured: false
  },
  {
    _id: 'prod_009',
    title: 'Lenovo ThinkPad E14 Gen 2 (Ryzen 5, 16GB RAM, 512GB SSD) - Coding Beast',
    description: 'Sturdy military-grade student laptop. Upgraded to 16GB dual-channel DDR4 RAM, 512GB NVMe SSD, backlit keyboard, fingerprint reader. Battery holds 4.5+ hours. Ideal for full-stack, Docker, Android Studio, and ML projects.',
    category: 'Laptops & Computers',
    condition: 'Good',
    sellingPrice: 24500,
    originalPrice: 58000,
    isNegotiable: true,
    images: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_aarav_002',
    collegeName: 'Delhi University',
    department: 'Computer Science',
    meetingLocation: 'Cluster Innovation Centre, North Campus',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: true,
    viewsCount: 420,
    featured: true
  },
  {
    _id: 'prod_010',
    title: 'Classmate Octane Neon Gel Pens (Pack of 15) + A4 Ruled Assignment Sheets',
    description: 'Brand new, sealed in original box! Surplus stationary from my semester project work. Includes 15 pens and 200 pages high-GSM ruled sheets for college internal assignments.',
    category: 'Stationery',
    condition: 'Brand New',
    sellingPrice: 150,
    originalPrice: 320,
    isNegotiable: false,
    images: [
      'https://images.unsplash.com/photo-1585336261026-40742f10b7a8?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_priya_003',
    collegeName: 'IP University',
    department: 'Electronics & Communication',
    meetingLocation: 'Near Dwarka Sector 14 Metro Station / College Gate',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: false,
    viewsCount: 44,
    featured: false
  },
  {
    _id: 'prod_011',
    title: 'Hero Sprint Single Speed Campus Bicycle with Front Basket & Lock',
    description: 'Perfect for pedaling between hostels, academic blocks, and campus cafeterias. Smooth brakes, oiled chain, durable tires, and includes a heavy-duty combination wire lock.',
    category: 'Others',
    condition: 'Good',
    sellingPrice: 2200,
    originalPrice: 5500,
    isNegotiable: true,
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_ananya_005',
    collegeName: 'Delhi Technological University',
    department: 'Information Technology',
    meetingLocation: 'DTU Main Sports Complex Cycle Stand',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: true,
    viewsCount: 260,
    featured: true
  },
  {
    _id: 'prod_012',
    title: 'Analog & Digital Signal Processing Handwritten Topper Notes (2 Semesters)',
    description: 'Comprehensive handwritten class notes written with colored pens, circuit diagrams, solved previous 7-year university exam questions, and Fourier/Z-transform cheat sheets.',
    category: 'Notes & Study Materials',
    condition: 'Like New',
    sellingPrice: 180,
    originalPrice: 400,
    isNegotiable: false,
    images: [
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80'
    ],
    seller: 'user_priya_003',
    collegeName: 'IP University',
    department: 'Electronics & Communication',
    meetingLocation: 'USICT Library Ground Floor',
    contactPreference: 'In-App Chat',
    status: 'available',
    isGraduateClearance: false,
    viewsCount: 115,
    featured: false
  }
];

const getSeedOffers = () => [
  {
    _id: 'offer_001',
    product: 'prod_001',
    buyer: 'user_priya_003',
    seller: 'user_aarav_002',
    originalPrice: 850,
    offerPrice: 720,
    counterPrice: null,
    message: 'Hey Aarav, can we do ₹720? I can meet you at North Campus Metro today!',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    _id: 'offer_002',
    product: 'prod_002',
    buyer: 'user_aarav_002',
    seller: 'user_rohan_004',
    originalPrice: 650,
    offerPrice: 500,
    counterPrice: 580,
    message: 'Would you accept 500 for the graphics kit?',
    status: 'countered',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

module.exports = {
  categoriesData,
  getSeedUsers,
  getSeedProducts,
  getSeedOffers
};
