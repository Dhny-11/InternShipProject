const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let threadId1 = '';
let threadId2 = '';
let replyId1 = '';

suite('Functional Tests', function() {

  // 1. Creating a new thread
  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/fcc_test')
      .send({ text: 'Thread 1', delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Buat thread kedua sebagai cadangan untuk tes replies setelah thread pertama dihapus
        chai.request(server)
            .post('/api/threads/fcc_test')
            .send({ text: 'Thread 2', delete_password: 'pass' })
            .end(function(err2, res2) {
            assert.equal(res2.status, 200);
            done();
            });
        });
    });

  // 2. Viewing the 10 most recent threads with 3 replies each
    test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
    chai.request(server)
        .get('/api/threads/fcc_test')
        .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        assert.property(res.body[0], '_id');
        assert.property(res.body[0], 'text');
        assert.property(res.body[0], 'created_on');
        assert.property(res.body[0], 'bumped_on');
        assert.property(res.body[0], 'replies');
        assert.notProperty(res.body[0], 'reported');
        assert.notProperty(res.body[0], 'delete_password');
        threadId1 = res.body[0]._id;
        threadId2 = res.body[1]._id;
        done();
        });
    });

  // 3. Deleting a thread with the incorrect password
    test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
    chai.request(server)
        .delete('/api/threads/fcc_test')
        .send({ thread_id: threadId1, delete_password: 'wrong' })
        .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
        });
    });

  // 4. Deleting a thread with the correct password
    test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
    chai.request(server)
        .delete('/api/threads/fcc_test')
        .send({ thread_id: threadId1, delete_password: 'pass' })
        .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
        });
    });

  // 5. Reporting a thread
    test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    chai.request(server)
      .put('/api/threads/fcc_test')
      .send({ thread_id: threadId2 })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // 6. Creating a new reply
  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/replies/fcc_test')
      .send({ thread_id: threadId2, text: 'New reply', delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  // 7. Viewing a single thread with all replies
  test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    chai.request(server)
      .get('/api/replies/fcc_test')
      .query({ thread_id: threadId2 })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.equal(res.body._id, threadId2);
        assert.isArray(res.body.replies);
        assert.notProperty(res.body, 'reported');
        assert.notProperty(res.body, 'delete_password');
        assert.notProperty(res.body.replies[0], 'reported');
        assert.notProperty(res.body.replies[0], 'delete_password');
        replyId1 = res.body.replies[0]._id;
        done();
      });
  });

  // 8. Deleting a reply with the incorrect password
  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
    chai.request(server)
      .delete('/api/replies/fcc_test')
      .send({ thread_id: threadId2, reply_id: replyId1, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 9. Deleting a reply with the correct password
  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
    chai.request(server)
      .delete('/api/replies/fcc_test')
      .send({ thread_id: threadId2, reply_id: replyId1, delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 10. Reporting a reply
  test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    chai.request(server)
      .put('/api/replies/fcc_test')
      .send({ thread_id: threadId2, reply_id: replyId1 })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

});