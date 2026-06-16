const mongoose = require('mongoose');
const Subject = require('../models/Subject');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

function validDeadline(value) {
  return value && !Number.isNaN(new Date(value).getTime());
}

/**
 * GET /api/subjects — list the current user's subjects, soonest deadline first.
 */
async function listSubjects(req, res, next) {
  try {
    const subjects = await Subject.find({ userId: req.user.id }).sort({ deadline: 1 });
    res.json({ subjects });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/subjects — create a subject for the current user.
 */
async function createSubject(req, res, next) {
  try {
    const { name, deadline, priority } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!validDeadline(deadline)) {
      return res.status(400).json({ message: 'A valid deadline is required' });
    }

    const subject = await Subject.create({
      userId: req.user.id,
      name: name.trim(),
      deadline,
      priority,
    });
    return res.status(201).json({ subject });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/subjects/:id — update an owned subject.
 */
async function updateSubject(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const updates = {};
    const { name, deadline, priority } = req.body || {};
    if (name !== undefined) updates.name = name.trim();
    if (deadline !== undefined) {
      if (!validDeadline(deadline)) {
        return res.status(400).json({ message: 'A valid deadline is required' });
      }
      updates.deadline = deadline;
    }
    if (priority !== undefined) updates.priority = priority;

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    return res.json({ subject });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/subjects/:id — delete an owned subject.
 */
async function removeSubject(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    const subject = await Subject.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }
    return res.json({ message: 'Subject deleted', id: req.params.id });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listSubjects, createSubject, updateSubject, removeSubject };
