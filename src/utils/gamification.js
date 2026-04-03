export const ACHIEVEMENTS = [
  { id: 'first_class', name: 'Primer Paso', description: 'Realiza tu primer check-in en el Box.', icon: '💪', secret: false },
  { id: 'early_bird', name: 'Madrugador', description: 'Realiza un check-in antes de las 08:00 AM.', icon: '🌅', secret: false },
  { id: 'night_owl', name: 'Búho Nocturno', description: 'Realiza un check-in después de las 20:00 PM.', icon: '🦉', secret: false },
  { id: 'constant_3', name: 'Constancia III', description: 'Asiste 3 días seguidos en una misma semana.', icon: '🔥', secret: false },
  { id: 'constant_5', name: 'Imparable', description: 'Asiste 5 días seguidos en una misma semana.', icon: '⚡', secret: false },
  { id: 'level_10', name: 'Aprendiz', description: 'Llegar al Nivel 10.', icon: '🥉', secret: false },
  { id: 'level_30', name: 'Veterano', description: 'Llegar al Nivel 30.', icon: '🥈', secret: false },
  { id: 'level_50', name: 'Leyenda IWOKA', description: 'Llegar al Nivel 50.', icon: '🥇', secret: false },
  { id: 'photo_first', name: 'Como te ven te tratan', description: 'Completa tu perfil (identidad y foto) para que el staff pueda reconocerte.', icon: '📸', secret: false },
  
  // Logros Especiales / Secretos
  { id: 'saturday_hero', name: 'Hermosa Mañana Verdad?', description: '¿???', secretDescription: 'Asistir todos los sábados de un mes completo.', icon: '🌅', secret: true },
  
  // Secret Achievements (Generic)
  { id: 'secret_1', name: 'Secreto', description: '???', icon: '❓', secret: true },
  { id: 'secret_2', name: 'Secreto', description: '???', icon: '❓', secret: true },
  { id: 'secret_3', name: 'Secreto', description: '???', icon: '❓', secret: true },
  { id: 'secret_4', name: 'Secreto', description: '???', icon: '❓', secret: true },
  { id: 'secret_5', name: 'Secreto', description: '???', icon: '❓', secret: true },
];

export const BANNERS = [
    { 
        id: 'default', 
        name: 'IWOKA Classic', 
        url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2669&auto=format&fit=crop',
        requirement: null 
    },
    { 
        id: 'box_spirit', 
        name: 'Espíritu IWOKA', 
        url: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=2685&auto=format&fit=crop',
        requirement: null 
    },
    { 
        id: 'first_step', 
        name: 'Primer Paso', 
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2670&auto=format&fit=crop',
        requirement: 'first_class' 
    },
    { 
        id: 'iron_discipline', 
        name: 'Disciplina de Hierro', 
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2670&auto=format&fit=crop',
        requirement: 'level_10' 
    },
    { 
        id: 'morning_ritual', 
        name: 'Ritual Mañanero', 
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2670&auto=format&fit=crop',
        requirement: 'saturday_hero' 
    },
    { 
        id: 'early_sun', 
        name: 'Sol de Mañana', 
        url: 'https://images.unsplash.com/photo-1541534401786-2077dee30a74?q=80&w=2669&auto=format&fit=crop',
        requirement: 'early_bird' 
    },
    { 
        id: 'neon_strength', 
        name: 'Fuerza Neón', 
        url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2670&auto=format&fit=crop',
        requirement: 'level_30' 
    },
    { 
        id: 'dark_box', 
        name: 'Box Nocturno', 
        url: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2670&auto=format&fit=crop',
        requirement: 'night_owl'
    },
    { 
        id: 'unstoppable', 
        name: 'Imparable', 
        url: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=2685&auto=format&fit=crop',
        requirement: 'constant_5'
    },
    { 
        id: 'legendary', 
        name: 'Leyenda IWOKA', 
        url: 'https://images.unsplash.com/photo-1623910380170-fc21ba6e680a?q=80&w=2671&auto=format&fit=crop',
        requirement: 'level_50'
    }
];

export const getLevelInfo = (level) => {
  if (level <= 10) return { name: 'Madera', color: 'text-orange-900', border: 'border-orange-900', bg: 'bg-orange-900/10' };
  if (level <= 20) return { name: 'Bronce', color: 'text-orange-400', border: 'border-orange-400', bg: 'bg-orange-400/10' };
  if (level <= 30) return { name: 'Plata', color: 'text-gray-300', border: 'border-gray-300', bg: 'bg-gray-300/10' };
  if (level <= 40) return { name: 'Oro', color: 'text-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-400/10' };
  return { name: 'Diamante', color: 'text-blue-300', border: 'border-blue-300', bg: 'bg-blue-300/10' };
};

export const getExpForLevel = (level) => {
  // Simple formula: Level * 100 + 500
  return level * 100 + 500;
};
