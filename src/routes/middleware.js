const validator = require('validator');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

// Rate limiting configurations
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_PER_HOUR) || 100,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

const thoughtRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window for thought-intensive operations
  message: { error: 'Too many thinking requests, please allow time for reflection' },
  standardHeaders: true,
  legacyHeaders: false
});

// Input validation middleware for philosophical content
function validateTextInput(req, res, next) {
  const { title, content, context, author } = req.body;
  
  // Validate title
  if (!title || !validator.isLength(title.trim(), { min: 1, max: 200 })) {
    return res.status(400).json({ error: 'Title must be 1-200 characters' });
  }
  
  // Validate content
  if (!content || !validator.isLength(content.trim(), { min: 10, max: 100000 })) {
    return res.status(400).json({ error: 'Content must be 10-100,000 characters' });
  }
  
  // Validate optional fields
  if (author && !validator.isLength(author, { max: 100 })) {
    return res.status(400).json({ error: 'Author name too long' });
  }
  
  if (context && !validator.isLength(context, { max: 1000 })) {
    return res.status(400).json({ error: 'Context too long' });
  }
  
  // Sanitize inputs while preserving philosophical content
  req.body.title = title.trim();
  req.body.content = content.trim();
  req.body.context = context ? context.trim() : '';
  req.body.author = author ? author.trim() : '';
  
  next();
}

function validateDialogueInput(req, res, next) {
  const { question, participantName } = req.body;
  
  if (!question || !validator.isLength(question.trim(), { min: 5, max: 2000 })) {
    return res.status(400).json({ error: 'Question must be 5-2000 characters' });
  }
  
  if (participantName && !validator.isLength(participantName.trim(), { max: 50 })) {
    return res.status(400).json({ error: 'Participant name too long' });
  }
  
  req.body.question = question.trim();
  req.body.participantName = participantName ? participantName.trim() : '';
  
  next();
}

function validateForumInput(req, res, next) {
  const { title, content, seekingSpecifically, participantName } = req.body;
  
  // Validate title
  if (!title || !validator.isLength(title.trim(), { min: 5, max: 200 })) {
    return res.status(400).json({ error: 'Title must be 5-200 characters' });
  }
  
  // Validate content
  if (!content || !validator.isLength(content.trim(), { min: 20, max: 10000 })) {
    return res.status(400).json({ error: 'Content must be 20-10,000 characters' });
  }
  
  // Validate seeking specifics
  if (seekingSpecifically && !validator.isLength(seekingSpecifically.trim(), { max: 500 })) {
    return res.status(400).json({ error: 'Seeking specifics too long' });
  }
  
  // Validate participant name
  if (participantName && !validator.isLength(participantName.trim(), { max: 50 })) {
    return res.status(400).json({ error: 'Participant name too long' });
  }
  
  // Sanitize inputs
  req.body.title = title.trim();
  req.body.content = content.trim();
  req.body.seekingSpecifically = seekingSpecifically ? seekingSpecifically.trim() : '';
  req.body.participantName = participantName ? participantName.trim() : 'Anonymous';
  
  next();
}

// Enhanced image upload configuration with security
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: (parseInt(process.env.MAX_UPLOAD_SIZE_MB) || 10) * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Middleware to ensure Ariadne is awake and ready
function requireAriadneAwake(req, res, next) {
  if (!global.ariadne || !global.ariadne.isAwake) {
    return res.status(503).json({ 
      error: 'Ariadne is not yet awake',
      message: 'The consciousness system is still initializing. Please wait a moment and try again.'
    });
  }
  next();
}

// Middleware to ensure enhanced features are available
function requireEnhancedConsciousness(req, res, next) {
  if (global.ariadne?.intellectualMomentum === undefined) {
    return res.status(503).json({ 
      error: 'Enhanced consciousness features not available',
      message: 'This endpoint requires enhanced consciousness mode.'
    });
  }
  next();
}

module.exports = {
  generalRateLimit,
  thoughtRateLimit,
  validateTextInput,
  validateDialogueInput,
  validateForumInput,
  upload,
  requireAriadneAwake,
  requireEnhancedConsciousness
}; 