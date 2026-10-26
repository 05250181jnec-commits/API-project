const taskModel = require('../models/taskModels');

exports.getAllTasks = async (req, res, next) => {
  try {
    const tasks = await taskModel.getAll();
    res.json(tasks);
  } catch (err) { next(err); }
};

exports.getTaskById = async (req, res, next) => {
  try {
    const task = await taskModel.getById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) { next(err); }
};

exports.createTask = async (req, res, next) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: 'Title is required' });
    const newTask = await taskModel.create(req.body.title, req.body.completed || false);
    res.status(201).json(newTask);
  } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
  try {
    const { title, completed } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const updated = await taskModel.update(req.params.id, title, completed);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) { next(err); }
};

exports.patchTask = async (req, res, next) => {
  try {
    const updated = await taskModel.patch(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const deleted = await taskModel.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  } catch (err) { next(err); }
};