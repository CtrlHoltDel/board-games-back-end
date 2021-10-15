const format = require('pg-format');
const db = require('../db/connection');

exports.pullCount = async (select, table, column, criteria) => {
  const queryBody = format(
    `SELECT COUNT(%L) :: INT FROM %I WHERE %I = $1;`,
    select,
    table,
    column
  );

  const { rows } = await db.query(queryBody, [criteria]);
  return rows[0].count;
};

exports.pullAllData = async (table) => {
  const queryBody = format(`SELECT * FROM %I`, table);
  const { rows } = await db.query(queryBody);
  return rows;
};

exports.pullList = async (table, column, criteria, limit = 10, p = 0) => {
  const queryBody = format(
    `
    SELECT * FROM %I 
    WHERE %I = %L
    LIMIT $1 OFFSET $2
    `,
    table,
    column,
    criteria
  );

  const { rows } = await db.query(queryBody, [limit, p]);

  return rows;
};

exports.insertItem = async (table, values, input) => {
  const queryBody = format(
    `
    INSERT INTO %I
    (%I)
    VALUES
    (%L)
    RETURNING *;
    `,
    table,
    values,
    input
  );

  const { rows } = await db.query(queryBody);

  return rows[0];
};

exports.updateVote = async (table, amount, column, id) => {
  const queryBody = format(
    `UPDATE %I SET votes = votes + %s WHERE %I = $1 RETURNING *;`,
    table,
    amount,
    column
  );

  const { rows } = await db.query(queryBody, [id]);

  return rows[0];
};

exports.updateBody = async (table, cell, body, column, criteria) => {
  const queryBody = format(
    `UPDATE %I SET %I = %L WHERE %I = $1 RETURNING *;`,
    table,
    cell,
    body,
    column
  );

  const { rows } = await db.query(queryBody, [criteria]);
  return rows;
};

exports.deleteFromDb = async (table, column, id) => {
  const queryBody = format(`DELETE FROM %I WHERE %I = $1`, table, column);

  await db.query(queryBody, [id]);
};
