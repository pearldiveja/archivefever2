const express = require('express');
const router = express.Router();
const path = require('path');

// Main page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/index.html'));
});

// Archive page
router.get('/archive', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/archive.html'));
});

// Library page
router.get('/library', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/library.html'));
});

// Gallery page
router.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/gallery.html'));
});

// Research page
router.get('/research', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/research.html'));
});

module.exports = router;
