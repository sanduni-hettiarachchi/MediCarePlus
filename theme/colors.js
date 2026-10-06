export const colors = {
  text: {
    primary: '#0F172A',
    secondary: '#4B5563',
    muted: '#4B5563',
    onGreen: '#FFFFFF',
    danger: '#B42318',
    taken: '#2F6B52',
    missed: '#B42318',
    upcoming: '#4B5563',
  },
  background: {
    white: '#FFFFFF',
    surface: '#F8FAFC',
    green: '#0B7666',
    highContrast: '#000000',
  },
  contrastPairs: [
    { name: 'primary on white', foreground: '#0F172A', background: '#FFFFFF', minimum: 4.5 },
    { name: 'secondary on white', foreground: '#4B5563', background: '#FFFFFF', minimum: 4.5 },
    { name: 'danger on white', foreground: '#B42318', background: '#FFFFFF', minimum: 4.5 },
    { name: 'taken on white', foreground: '#2F6B52', background: '#FFFFFF', minimum: 4.5 },
    { name: 'missed on white', foreground: '#B42318', background: '#FFFFFF', minimum: 4.5 },
    { name: 'upcoming on white', foreground: '#4B5563', background: '#FFFFFF', minimum: 4.5 },
    { name: 'white on green button', foreground: '#FFFFFF', background: '#0B7666', minimum: 4.5 },
    { name: 'primary on surface', foreground: '#0F172A', background: '#F8FAFC', minimum: 4.5 },
    { name: 'secondary on surface', foreground: '#4B5563', background: '#F8FAFC', minimum: 4.5 },
    { name: 'black on high contrast', foreground: '#FFFFFF', background: '#000000', minimum: 4.5 },
  ],
};

export default colors;
