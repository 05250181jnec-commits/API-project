const pool = require('../db');

exports.getAll = async () => {
  const [rows] = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  return rows[0];
};

exports.create = async (title, completed = false) => {
  const [result] = await pool.query('INSERT INTO tasks (title, completed) VALUES (?, ?)', [title, completed]);
  return { id: result.insertId, title, completed };
};

exports.update = async (id, title, completed) => {
  await pool.query('UPDATE tasks SET title = ?, completed = ? WHERE id = ?', [title, completed, id]);
  return { id, title, completed };
};

exports.patch = async (id, fields) => {
  const keys = Object.keys(fields);
  if (keys.length === 0) return exports.getById(id);
  
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const values = Object.values(fields);
  values.push(id);

  await pool.query(`UPDATE tasks SET ${setClause} WHERE id = ?`, values);
  return exports.getById(id);
};

exports.delete = async (id) => {
  const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  return result.affectedRows > 0;
};