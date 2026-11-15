export interface AvatarOption {
  id: string
  emoji: string
  bg: string
  label: string
}

export const AVATARS: AvatarOption[] = [
  { id: 'strawberry', emoji: '🍓', bg: '#FFE0E6', label: 'Strawberry' },
  { id: 'avocado', emoji: '🥑', bg: '#E3F2D3', label: 'Avocado' },
  { id: 'peach', emoji: '🍑', bg: '#FFE6D6', label: 'Peach' },
  { id: 'lemon', emoji: '🍋', bg: '#FFF4C2', label: 'Lemon' },
  { id: 'cupcake', emoji: '🧁', bg: '#FBE3F4', label: 'Cupcake' },
  { id: 'donut', emoji: '🍩', bg: '#F6E3D0', label: 'Donut' },
  { id: 'croissant', emoji: '🥐', bg: '#F8EBCF', label: 'Croissant' },
  { id: 'onigiri', emoji: '🍙', bg: '#E8ECF4', label: 'Rice ball' },
  { id: 'taco', emoji: '🌮', bg: '#FFEFC9', label: 'Taco' },
  { id: 'pizza', emoji: '🍕', bg: '#FFE3D1', label: 'Pizza' },
  { id: 'ramen', emoji: '🍜', bg: '#E4EEF9', label: 'Ramen' },
  { id: 'watermelon', emoji: '🍉', bg: '#DDF3E4', label: 'Watermelon' },
]

export const avatarById = (id?: string) => AVATARS.find((a) => a.id === id)
