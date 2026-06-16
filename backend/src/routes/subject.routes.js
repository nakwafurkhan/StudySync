const express = require('express');
const {
  listSubjects,
  createSubject,
  updateSubject,
  removeSubject,
} = require('../controllers/subject.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Every subject route requires authentication.
router.use(protect);

router.get('/', listSubjects);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', removeSubject);

module.exports = router;
