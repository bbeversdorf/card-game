const express = require('express');

const router = function(controller: any) {
  const router = express.Router();
  router.route('/').get(controller.index);
  router.route('/new').get(controller.new);
  router.route('/create/:name').get(controller.create);
  router.route('/join/:code/:name').get(controller.join);
  router.route('/join').get(controller.joinIndex);
  router.route('/lobby/:code').get(controller.lobby);
  router.route('/game/start/:code').get(controller.gameStart);
  router.route('/game/:code').get(controller.game);
  router.route('/game/:code/play').post(controller.gamePlayerMove);
  router.route('/leave').get(controller.leave);
  return router;
}

module.exports = router;
