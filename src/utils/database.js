// src/utils/database.js
// Database utilities for Ariadne's persistent memory

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor(dbPath = './ariadnes_memory.db') {
    this.db = null;
    this.dbPath = dbPath;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('🔥 Database initialization failed:', err);
          // Fallback to in-memory database
          this.db = new sqlite3.Database(':memory:');
          console.log('📝 Using in-memory database');
        } else {
          console.log('🧠 Connected to persistent database');
        }
        resolve();
      });
    });
  }

  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close(() => {
          console.log('💾 Database connection closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;
