export const PHONES = {
  primary: '9479962103',
  secondary: '7566903103',
}

export const telLink = (n) => `tel:+91${n}`
export const waLink = (n, text = '') => {
  const base = `https://wa.me/91${n}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export const SITE = {
  name: 'Thakur Niranjan Singh I.T.I. & Computer',
  shortName: 'TNS ITI & Computer',
  city: 'Narsinghpur',
  taglineEn: 'Learn • Skill • Grow',
  taglineHi: 'ज्ञान से कौशल, कौशल से उज्ज्वल भविष्य',
  taglineEnLong: 'From Knowledge to Skill, From Skill to a Bright Future',
  motto: 'Skill Today • Success Tomorrow',
  since: '2003',
  address: 'Ram Colony, Belapurkar Ward, Narsinghpur, Madhya Pradesh – 487001',
  addressHint: 'Behind Shriram Traders, near VIP School, Ram Colony, Kandeli, Narsinghpur',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Ram+Colony+Belapurkar+Ward+Narsinghpur+Madhya+Pradesh+487001',
  website: 'https://www.tnsiti.com',
  email: 'info@tnsiti.com',
}

export const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#courses', label: 'Courses' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#admission', label: 'Admission' },
  { href: '#contact', label: 'Contact' },
]
