const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const trackValidation = require('../../validations/track.validation');
const trackController = require('../../controllers/track.controller');

const router = express.Router();

router.route('/').post(auth(), validate(trackValidation.createTrack), trackController.createTrack);

router
  .route('/user/:userId')
  .get(auth('getTracks'), validate(trackValidation.getTracksByUser), trackController.getTracksByUser);
router.get('/count-by-date/:userId', auth('getTracks'), validate(trackValidation.countByDate), trackController.countByDate);
router.get('/latest-user', auth('getTracks'), validate(trackValidation.getLatestUsers), trackController.getLatestUsers);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Track
 *   description: Track management and retrieval
 */

/**
 * @swagger
 * /track:
 *   post:
 *     summary: Create track
 *     description: Track data send by users.
 *     tags: [Track]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             $ref: '#/components/schemas/TrackRequest'
 *     responses:
 *       "204":
 *         description: No content
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /track/user/{userId}:
 *   get:
 *     summary: Get track list by user
 *     description: Logged in users can fetch only their own user track list. Only admins can fetch other users track.
 *     tags: [Track]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Target date get track
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Type calendar day, month or week
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSecond:
 *                   type: number
 *                   value: 0
 *                 results:
 *                   $ref: '#/components/schemas/TrackList'
 *                 countByDate:
 *                   type: object
 *                   $ref: '#/components/schemas/TrackDay'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /track/latest-user:
 *   get:
 *     summary: Get list of latest user tracks
 *     description: Only admins can fetch.
 *     tags: [Track]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Maximum number of users
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *     responses:
 *       "201":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrackUserResponse'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *                 totalResults:
 *                   type: integer
 *                   example: 1
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /track/count-by-date/{userId}:
 *   get:
 *     summary: Count track by date of user
 *     description: Logged in users can fetch only their own user track list. Only admins can fetch other users track.
 *     tags: [Track]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User id
*       -  in: query
 *         name: yearMonth
 *         required: true
 *         schema:
 *           type: string
 *         description: Year month
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrackByDate'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */