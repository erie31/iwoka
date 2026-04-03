export const ACHIEVEMENTS = [
  { id: 'first_class', name: 'Primer Paso', description: 'Realiza tu primer check-in en el Box.', icon: '💪', secret: false },
  { id: 'early_bird', name: 'Madrugador', description: 'Realiza un check-in antes de las 08:00 AM.', icon: '🌅', secret: false },
  { id: 'night_owl', name: 'Búho Nocturno', description: 'Realiza un check-in después de las 20:00 PM.', icon: '🦉', secret: false },
  { id: 'constant_3', name: 'Constancia III', description: 'Asiste 3 días seguidos en una misma semana.', icon: '🔥', secret: false },
  { id: 'constant_5', name: 'Imparable', description: 'Asiste 5 días seguidos en una misma semana.', icon: '⚡', secret: false },
  { id: 'level_10', name: 'Aprendiz', description: 'Llegar al Nivel 10.', icon: '🥉', secret: false },
  { id: 'level_30', name: 'Veterano', description: 'Llegar al Nivel 30.', icon: '🥈', secret: false },
  { id: 'level_50', name: 'Leyenda IWOKA', description: 'Llegar al Nivel 50.', icon: '🥇', secret: false },
  { id: 'photo_first', name: 'Como te ven te tratan', description: 'Sube tu primer foto de perfil para que todos te reconozcan.', icon: '📸', secret: false },
  
  // Logros Especiales / Secretos
  { id: 'saturday_hero', name: 'Hermosa Mañana Verdad?', description: '¿???', secretDescription: 'Asistir todos los sábados de un mes completo.', icon: '🌅', secret: true },
  
  // Secret Achievements (Generic)
  { id: 'secret_1', name: 'Secreto', description: '???', icon: '❓', secret: true },
  { id: 'secret_2', name: 'Secreto', description: '???', icon: '❓', secret: true },
  { id: 'secret_3', name: 'Secreto', description: '???', icon: '❓', secret: true },
  { id: 'secret_4', name: 'Secreto', description: '???', icon: '❓', secret: true },
  { id: 'secret_5', name: 'Secreto', description: '???', icon: '❓', secret: true },
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
