const db = require('../db/connection');

exports.fetchCategories = async () => {
    const query_body = 'SELECT * FROM categories;';
    const categories = await db.query(query_body);
    return categories.rows;
};

exports.addCategory = async ({ slug, description }) => {
    if (
        !slug ||
        !description ||
        typeof slug !== 'string' ||
        typeof description !== 'string'
    ) {
        return Promise.reject({
            status: 400,
            error: `Invalid key name`,
            format: `{ slug: STRING, description: STRING }`,
            endpoint: '/api/reviews/:id',
        });
    }
    const queryBody = `
                    INSERT INTO categories(slug, description)
                    VALUES ($1, $2)
                    RETURNING *;
                    `;

    const category = await db.query(queryBody, [slug, description]);
    return category.rows[0];
};
