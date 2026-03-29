/**
 * Social Sharing Image Generator
 * Generates shareable achievement/rank images
 */

const fs = require('fs');
const path = require('path');

// Simple SVG-based image generation for achievements
function generateAchievementImage(achievement, user) {
  const svg = `
<svg width="1200" width="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
    <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#d97706"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Border -->
  <rect x="20" y="20" width="1160" height="590" rx="20" fill="none" stroke="#334155" stroke-width="2"/>
  
  <!-- Achievement Icon -->
  <text x="600" y="250" font-size="150" text-anchor="middle">${achievement.icon || '🏆'}</text>
  
  <!-- Achievement Name -->
  <text x="600" y="350" font-family="Arial" font-size="64" font-weight="bold" fill="white" text-anchor="middle">
    ${achievement.name}
  </text>
  
  <!-- User -->
  <text x="600" y="420" font-family="Arial" font-size="32" fill="#94a3b8" text-anchor="middle">
    Achieved by ${user.displayName || user.username}
  </text>
  
  <!-- Rarity Badge -->
  <rect x="500" y="470" width="200" height="50" rx="25" fill="url(#badge)"/>
  <text x="600" y="505" font-family="Arial" font-size="24" font-weight="bold" fill="#0f172a" text-anchor="middle">
    ${achievement.rarity?.toUpperCase() || 'COMMON'}
  </text>
  
  <!-- Watermark -->
  <text x="600" y="580" font-family="Arial" font-size="24" fill="#64748b" text-anchor="middle">
    AutoSena Trading Platform
  </text>
</svg>
`;

  return svg;
}

function generateRankImage(rank, user, period) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  
  const svg = `
<svg width="1200" width="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Header -->
  <text x="600" y="100" font-family="Arial" font-size="48" font-weight="bold" fill="#0ea5e9" text-anchor="middle">
    ${period.toUpperCase()} LEADERBOARD
  </text>
  
  <!-- Rank -->
  <text x="600" y="280" font-size="180" text-anchor="middle">${medal}</text>
  
  <!-- User -->
  <text x="600" y="380" font-family="Arial" font-size="56" font-weight="bold" fill="white" text-anchor="middle">
    ${user.displayName || user.username}
  </text>
  
  <!-- Subtitle -->
  <text x="600" y="450" font-family="Arial" font-size="32" fill="#94a3b8" text-anchor="middle">
    Rank #${rank} on the ${period} leaderboard
  </text>
  
  <!-- Watermark -->
  <text x="600" y="580" font-family="Arial" font-size="24" fill="#64748b" text-anchor="middle">
    AutoSena Trading Platform
  </text>
</svg>
`;

  return svg;
}

module.exports = { generateAchievementImage, generateRankImage };
