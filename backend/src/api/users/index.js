const express = require('express');
const router = express.Router();
const db = require('../../models/schema');
const { v4: uuidv4 } = require('uuid');

// GET /api/users/:userId - Get user profile
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const user = db.prepare(`
      SELECT id, username, display_name, avatar_url, total_profit, 
             total_trades, winning_trades, followers_count, following_count, credits, created_at
      FROM users WHERE id = ?
    `).get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get streak
    const streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId);
    
    // Get earned achievements count
    const achievementsCount = db.prepare(`
      SELECT COUNT(*) as count FROM user_achievements 
      WHERE user_id = ? AND completed = 1
    `).get(userId);

    res.json({ 
      user: {
        ...user,
        streak,
        achievementsCount: achievementsCount.count
      }
    });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users/:userId/follow - Follow a user
router.post('/:userId/follow', (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body; // The person doing the following
    
    if (!followerId) {
      return res.status(400).json({ error: 'followerId required' });
    }

    if (userId === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if target user exists
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existing = db.prepare(`
      SELECT * FROM followers WHERE follower_id = ? AND following_id = ?
    `).get(followerId, userId);

    if (existing) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow relationship
    db.prepare(`
      INSERT INTO followers (id, follower_id, following_id)
      VALUES (?, ?, ?)
    `).run(uuidv4(), followerId, userId);

    // Update counts
    db.prepare('UPDATE users SET following_count = following_count + 1 WHERE id = ?').run(followerId);
    db.prepare('UPDATE users SET followers_count = followers_count + 1 WHERE id = ?').run(userId);

    res.json({ success: true, message: 'Now following user' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// DELETE /api/users/:userId/follow - Unfollow a user
router.delete('/:userId/follow', (req, res) => {
  try {
    const { userId } = req.params;
    const { followerId } = req.body;
    
    if (!followerId) {
      return res.status(400).json({ error: 'followerId required' });
    }

    const existing = db.prepare(`
      SELECT * FROM followers WHERE follower_id = ? AND following_id = ?
    `).get(followerId, userId);

    if (!existing) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    // Remove follow relationship
    db.prepare('DELETE FROM followers WHERE follower_id = ? AND following_id = ?').run(followerId, userId);

    // Update counts
    db.prepare('UPDATE users SET following_count = MAX(0, following_count - 1) WHERE id = ?').run(followerId);
    db.prepare('UPDATE users SET followers_count = MAX(0, followers_count - 1) WHERE id = ?').run(userId);

    res.json({ success: true, message: 'Unfollowed user' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// GET /api/users/:userId/followers - Get user's followers
router.get('/:userId/followers', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const followers = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.total_profit, u.followers_count
      FROM users u
      JOIN followers f ON u.id = f.follower_id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(limit), parseInt(offset));

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM followers WHERE following_id = ?
    `).get(userId);

    res.json({ followers, total: total.count });
  } catch (error) {
    console.error('Followers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// GET /api/users/:userId/following - Get users this user follows
router.get('/:userId/following', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const following = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.total_profit, u.followers_count
      FROM users u
      JOIN followers f ON u.id = f.following_id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(userId, parseInt(limit), parseInt(offset));

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM followers WHERE follower_id = ?
    `).get(userId);

    res.json({ following, total: total.count });
  } catch (error) {
    console.error('Following fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// POST /api/users - Create a new user (for testing/seeding)
router.post('/', (req, res) => {
  try {
    const { id, username, displayName, avatarUrl } = req.body;
    
    if (!id || !username) {
      return res.status(400).json({ error: 'id and username required' });
    }

    // Check if username exists
    const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    db.prepare(`
      INSERT INTO users (id, username, display_name, avatar_url)
      VALUES (?, ?, ?, ?)
    `).run(id, username, displayName || username, avatarUrl || null);

    // Create streak record
    db.prepare(`
      INSERT INTO streaks (id, user_id, current_streak, longest_streak)
      VALUES (?, ?, 0, 0)
    `).run(uuidv4(), id);

    res.json({ success: true, userId: id });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

module.exports = router;
