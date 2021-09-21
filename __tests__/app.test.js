const db = require('../db/connection.js');
const app = require('../app.js');
const request = require('supertest');

const testData = require('../db/data/test-data/index.js');
const seed = require('../db/seeds/seed.js');

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe('Missing path', () => {
    it("404: When given a path that doesn't exist, returns an error.", async () => {
        const res = await request(app).get('/broken_link').expect(404);
        expect(res.body.error).toBe('route not found');
    });
});

describe('Categories', () => {
    describe('/api/categories', () => {
        it('200: Returns a list of all categories containing both the "slug" and "description" keys', async () => {
            const res = await request(app).get('/api/categories').expect(200);
            expect(res.body.categories).toHaveLength(4);
            res.body.categories.forEach((category) => {
                expect(category).toMatchObject({
                    description: expect.any(String),
                    slug: expect.any(String),
                });
            });
        });
    });
});

describe('Reviews', () => {
    describe('/api/reviews/:id', () => {
        describe('GET', () => {
            it('200: Returns a review object with the correct properties', async () => {
                const res = await request(app)
                    .get('/api/reviews/2')
                    .expect(200);
                expect(res.body.review).toMatchObject({
                    title: expect.any(String),
                    review_id: expect.any(Number),
                    review_body: expect.any(String),
                    designer: expect.any(String),
                    review_img_url: expect.any(String),
                    category: expect.any(String),
                    created_at: expect.any(String),
                    votes: expect.any(Number),
                });
            });
            it('400: Returns an error if passed a non-number as a parametric endpoint', async () => {
                const res = await request(app)
                    .get('/api/reviews/not_a_number')
                    .expect(400);
                expect(res.body.error).toEqual({
                    status: 400,
                    endpoint: '/api/reviews/:id',
                    error: 'id must be a number',
                });
            });
            it("400: Returns an error if passed a number which doesn't relate to a review", async () => {
                const res = await request(app)
                    .get('/api/reviews/3434')
                    .expect(400);
                expect(res.body.error).toEqual({
                    status: 400,
                    error: 'No reviews with an id of 3434',
                    endpoint: '/api/reviews/:id',
                });
            });
        });
        describe('PATCH', () => {
            it('200: Returns the updated item after incrimenting/decrimenting the vote', async () => {
                const res = await request(app)
                    .patch('/api/reviews/2')
                    .expect(200)
                    .send({ inc_votes: 5 });
                expect(res.body.updated_review).toMatchObject({
                    review_id: expect.any(Number),
                    title: expect.any(String),
                    review_body: expect.any(String),
                    designer: expect.any(String),
                    review_img_url: expect.any(String),
                    votes: expect.any(Number),
                    category: expect.any(String),
                    owner: expect.any(String),
                    created_at: expect.any(String),
                });
                expect(res.body.updated_review.votes).toBe(10);
            });
            it('200: Update also works with negative numbers', async () => {
                const res = await request(app)
                    .patch('/api/reviews/2')
                    .expect(200)
                    .send({ inc_votes: -20 });

                expect(res.body.updated_review.votes).toBe(-15);
            });
            it("400: Returns an error if endpoint doesn't end in a number.", async () => {
                const res = await request(app)
                    .patch('/api/reviews/invalid_id')
                    .expect(400);

                expect(res.body.error).toEqual({
                    status: 400,
                    endpoint: '/api/reviews/:id',
                    error: 'id must be a number',
                });
            });
            it('400: Returns an error if passed an invalid object in the body.', async () => {
                const res = await request(app)
                    .patch('/api/reviews/2')
                    .expect(400)
                    .send({ bad_key: 'not a number' });

                expect(res.body.error).toEqual({
                    status: 400,
                    endpoint: '/api/reviews/:id',
                    error: 'format to { inc_votes : number }',
                });
            });
        });
    });
    describe('/api/reviews?queries=', () => {
        describe('GET', () => {
            it('200: Returns a full list of reviews when passed no queries.', async () => {
                const res = await request(app).get('/api/reviews').expect(200);
                res.body.reviews.forEach((review) => {
                    expect(review).toMatchObject({
                        owner: expect.any(String),
                        title: expect.any(String),
                        review_id: expect.any(Number),
                        category: expect.any(String),
                        review_img_url: expect.any(String),
                        created_at: expect.any(String),
                        votes: expect.any(Number),
                        amount_of_comments: expect.any(String),
                    });
                });
            });
            it('200: Returns the list in ASC/DESC order when passed an order query', async () => {
                const resAsc = await request(app)
                    .get('/api/reviews?order=asc')
                    .expect(200);
                const asc = resAsc.body.reviews.map(
                    (review) => review.review_id
                );
                const ascOrder = [...asc].sort((x, y) => x - y);
                expect(asc).toEqual(ascOrder);

                const resDesc = await request(app)
                    .get('/api/reviews?order=desc')
                    .expect(200);
                const desc = resDesc.body.reviews.map(
                    (review) => review.review_id
                );
                const descOrder = [...desc].sort((x, y) => y - x);
                expect(desc).toEqual(descOrder);
            });
            it('200: Returns the a filtered list based upon given category', async () => {
                const res = await request(app)
                    .get('/api/reviews?category=social_deduction')
                    .expect(200);

                const all_check = res.body.reviews.every(
                    (review) => review.category === 'social deduction'
                );
                expect(all_check).toBe(true);
            });
            it('404: Returns an error when passed a valid category but invalid query', async () => {
                const res = await request(app)
                    .get('/api/reviews?category=invalid_query')
                    .expect(404);
                expect(res.body.error).toEqual({
                    status: 404,
                    endpoint: '/api/reviews?category=query',
                    error: 'Invalid query',
                });
            });
            it("400: Returns an error with a list of valid categories when passed a category that doesn't exist.", async () => {
                const res = await request(app)
                    .get('/api/reviews?not_a_category=me_neither')
                    .expect(400);
                expect(res.body.error).toMatchObject({
                    endpoint: '/api/reviews?category=query',
                    error: { valid_queries: ['sort_by', 'order', 'category'] },
                    status: 400,
                });
            });
            it('200: Returns all reviews sorted by date if passed an empty sort_by query.', async () => {
                const res = await request(app)
                    .get('/api/reviews?sort_by')
                    .expect(200);

                const test_result = res.body.reviews.map(
                    (review) => review.created_at
                );

                const ordered = test_result.sort((x, y) => {
                    return x - y;
                });

                expect(test_result).toEqual(ordered);
            });
            it('200: Returns a list of reviews sorted by column when passed that column as a query', async () => {
                const res = await request(app)
                    .get('/api/reviews?sort_by=amount_of_comments')
                    .expect(200);

                const test_result = res.body.reviews.map(
                    (review) => review.amount_of_comments
                );

                const ordered = test_result.sort((x, y) => {
                    return x - y;
                });

                expect(test_result).toEqual(ordered);
            });
            it('404: Returns an error containing valid_columns when passed a sort_by with invalid column name', async () => {
                const res = await request(app)
                    .get('/api/reviews?sort_by=not_real_column_name')
                    .expect(404);
                expect(res.body.error).toEqual({
                    status: 404,
                    endpoint: '/api/reviews?sort_by=column_to_sort_by',
                    error: {
                        invalid_column: 'not_real_column_name',
                        valid_columns: [
                            'owner',
                            'title',
                            'review_id',
                            'category',
                            'votes',
                            'comment_count',
                        ],
                    },
                });
            });
        });
    });
    describe('Reviews/:review_id/comments', () => {
        describe('GET', () => {
            it("400: Returns an error when passed an id that isn't a number", async () => {
                const res = await request(app)
                    .get('/api/reviews/not_a_number/comments')
                    .expect(400);

                expect(res.body.error).toEqual({
                    status: 400,
                    endpoint: '/api/reviews/:id/comments',
                    error: 'id must be a number',
                });
            });
            it('200: Returns a full list of filtered comments when passed a valid id', async () => {
                const res = await request(app)
                    .get('/api/reviews/2/comments')
                    .expect(200);
                expect(res.body.reviews).toHaveLength(3);
            });
        });
        describe('POST', () => {
            const errorObject = {
                status: 400,
                endpoint: '/api/reviews/:id/comments',
                valid_format: `{ username: string, body: string}`,
            };
            it('400: Returns an error if passed an object with invalid keys ', async () => {
                const res = await request(app)
                    .post('/api/reviews/2/comments')
                    .expect(400)
                    .send({
                        invalid_key: 'invalid username',
                        body: 'valid key',
                    });

                expect(res.body.error).toEqual(errorObject);
            });
            it('400: Returns an error if the object values are not strings', async () => {
                const res = await request(app)
                    .post('/api/reviews/2/comments')
                    .expect(400)
                    .send({
                        username: 1,
                        body: { not_a: 'string ' },
                    });

                expect(res.body.error).toEqual(errorObject);
            });
            it('200: Returns the sent comment after adding it to the database', async () => {
                const res = await request(app)
                    .post('/api/reviews/2/comments')
                    .expect(200)
                    .send({
                        username: 'bainesface',
                        body: 'This is the body of the comment',
                    });

                expect(res.body.comment).toMatchObject({
                    comment_id: expect.any(Number),
                    author: expect.any(String),
                    review_id: expect.any(Number),
                    votes: expect.any(Number),
                    created_at: expect.any(String),
                    body: expect.any(String),
                });
            });
            it("400: Returns an error if passed a user that doesn'nt exist", async () => {
                const res = await request(app)
                    .post('/api/reviews/2/comments')
                    .expect(400)
                    .send({
                        username: 'non-existent-user',
                        body: "I'm not sure how i'm writing this comment. I don't exist",
                    });
                expect(res.body.error).toEqual("User doesn't exist");
            });
        });
    });
});
