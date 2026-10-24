'use strict';
const crypto = require('crypto');

const boards = {};

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

module.exports = function (app) {
  
  // ==========================================
  // RUTE THREADS: /api/threads/:board
  // ==========================================
  app.route('/api/threads/:board')
    
    // Poin 5: POST thread baru
    .post(function (req, res) {
      const board = req.params.board;
      const { text, delete_password } = req.body;

      if (!boards[board]) {
        boards[board] = [];
      }

      const now = new Date();
      const newThread = {
        _id: generateId(),
        text: text || '',
        created_on: now,
        bumped_on: now,
        reported: false,
        delete_password: delete_password || '',
        replies: []
      };

      // unshift memastikan thread terbaru selalu berada di urutan pertama
      boards[board].unshift(newThread);

      return res.redirect(`/b/${board}/`);
    })

    // Poin 7: GET 10 thread terbaru dengan maksimal 3 replies terbaru
    .get(function (req, res) {
      const board = req.params.board;
      const threads = boards[board] || [];

      const sortedThreads = [...threads]
        .sort((a, b) => b.bumped_on.getTime() - a.bumped_on.getTime())
        .slice(0, 10)
        .map(thread => {
          const recentReplies = thread.replies
            .slice(-3)
            .map(reply => ({
              _id: reply._id,
              text: reply.text,
              created_on: reply.created_on
            }));

          return {
            _id: thread._id,
            text: thread.text,
            created_on: thread.created_on,
            bumped_on: thread.bumped_on,
            replies: recentReplies,
            replycount: thread.replies.length
          };
        });

      return res.json(sortedThreads);
    })

    // Poin 9: DELETE thread
    .delete(function (req, res) {
      const board = req.params.board;
      const { thread_id, delete_password } = req.body;
      const threads = boards[board] || [];

      const index = threads.findIndex(t => String(t._id) === String(thread_id));
      if (index === -1) {
        return res.send('incorrect password');
      }

      if (threads[index].delete_password !== delete_password) {
        return res.send('incorrect password');
      }

      threads.splice(index, 1);
      return res.send('success');
    })

    // Poin 11: PUT (report) thread
    .put(function (req, res) {
      const board = req.params.board;
      const threadId = req.body.thread_id || req.body.report_id;
      const threads = boards[board] || [];

      const thread = threads.find(t => String(t._id) === String(threadId));
      if (thread) {
        thread.reported = true;
      }

      return res.send('reported');
    });


  // ==========================================
  // RUTE REPLIES: /api/replies/:board
  // ==========================================
  app.route('/api/replies/:board')

    // Poin 6: POST reply baru
    .post(function (req, res) {
      const board = req.params.board;
      const { thread_id, text, delete_password } = req.body;
      const threads = boards[board] || [];

      const thread = threads.find(t => String(t._id) === String(thread_id));
      if (!thread) {
        return res.status(404).send('Thread not found');
      }

      // Pastikan timestamp reply & bumped_on selalu lebih baru dari waktu pembuatan thread
      let now = new Date();
      if (now.getTime() <= thread.bumped_on.getTime()) {
        now = new Date(thread.bumped_on.getTime() + 10);
      }

      const newReply = {
        _id: generateId(),
        text: text || '',
        created_on: now,
        delete_password: delete_password || '',
        reported: false
      };

      thread.bumped_on = now;
      thread.replies.push(newReply);

      return res.redirect(`/b/${board}/${thread_id}`);
    })

    // Poin 8: GET 1 thread penuh beserta semua replies
    .get(function (req, res) {
      const board = req.params.board;
      const thread_id = req.query.thread_id;
      const threads = boards[board] || [];

      const thread = threads.find(t => String(t._id) === String(thread_id));
      if (!thread) {
        return res.status(404).send('Thread not found');
      }

      const fullThread = {
        _id: thread._id,
        text: thread.text,
        created_on: thread.created_on,
        bumped_on: thread.bumped_on,
        replies: thread.replies.map(r => ({
          _id: r._id,
          text: r.text,
          created_on: r.created_on
        })),
        replycount: thread.replies.length
      };

      return res.json(fullThread);
    })

    // Poin 10: DELETE reply (ubah text menjadi '[deleted]')
    .delete(function (req, res) {
      const board = req.params.board;
      const { thread_id, reply_id, delete_password } = req.body;
      const threads = boards[board] || [];

      const thread = threads.find(t => String(t._id) === String(thread_id));
      if (!thread) {
        return res.send('incorrect password');
      }

      const reply = thread.replies.find(r => String(r._id) === String(reply_id));
      if (!reply || reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      }

      reply.text = '[deleted]';
      return res.send('success');
    })

    // Poin 12: PUT (report) reply
    .put(function (req, res) {
      const board = req.params.board;
      const { thread_id, reply_id } = req.body;
      const threads = boards[board] || [];

      const thread = threads.find(t => String(t._id) === String(thread_id));
      if (thread) {
        const reply = thread.replies.find(r => String(r._id) === String(reply_id));
        if (reply) {
          reply.reported = true;
        }
      }

      return res.send('reported');
    });

};