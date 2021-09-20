const { dropTables, createTables } = require('../utils/create-tables');
const { fillTables } = require('../utils/fill-tables');

const seed = async (data) => {
    try {
        await dropTables();
        await createTables();
        await fillTables(data);
    } catch (err) {
        console.log(err);
    }
};

module.exports = seed;
