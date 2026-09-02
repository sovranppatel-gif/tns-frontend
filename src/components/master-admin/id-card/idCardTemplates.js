export const ID_CARD_TEMPLATES = [
  { id: 'classic', name: 'Classic', description: 'Horizontal · official details', orientation: 'horizontal', className: 'id-card-classic' },
  { id: 'modern', name: 'Modern', description: 'Horizontal · split header', orientation: 'horizontal', className: 'id-card-modern' },
  { id: 'campus', name: 'Campus', description: 'Horizontal · photo focus', orientation: 'horizontal', className: 'id-card-campus' },
  { id: 'minimal', name: 'Minimal', description: 'Vertical · clean badge', orientation: 'vertical', className: 'id-card-minimal' },
  { id: 'gradient', name: 'Gradient', description: 'Vertical · bold identity', orientation: 'vertical', className: 'id-card-gradient' },
  { id: 'vertical', name: 'Registrar', description: 'Vertical · formal profile', orientation: 'vertical', className: 'id-card-vertical' },
]

export const DEFAULT_CARD_SETTINGS = {
  showAdmission: true,
  showContact: true,
  showValidity: true,
  validity: '2026 - 2027',
  footer: 'If found, please return to TNS ITI & Computer, Narsinghpur.',
}