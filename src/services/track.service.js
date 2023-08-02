const moment = require('moment');
const { Track } = require('../models');
const mongoose = require('mongoose');

/**
 * Create track
 * @param {Object} trackBody
 * @returns {Promise<AppHistory>}
 */
const createTrack = async (trackBody) => {
  return Track.create(trackBody);
};

/**
 * Get tracks
 * @param {ObjectId} userId
 * @param {Date} date
 * @returns {Promise<AppHistory>}
 */
const getTracks = async (userId, startDate, endDate) => {
  return Track.find({
    user: userId,
    start: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ start: 'asc' });
};

/**
 * Count track by date
 * @param {ObjectId} userId
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<AppHistory>}
 */
const countTrackWithDate = async (userId, startDate, endDate) => {
  const ObjectId = mongoose.Types.ObjectId;
  return Track.aggregate([
    {
      $match: {
        user: ObjectId(userId),
        start: {
          $gte: startDate,
          $lte: endDate,
        }
      }
    },
    {
      $group : {
        _id :{ $dateToString: { format: "%Y-%m-%d", date: "$start"} },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1} }
  ])
};

/**
 * Get last track
 * @param {ObjectId} userId
 * @returns {Promise<Track>}
 */
const getLastTrack = async (userId) => {
  return Track.findOne({
    user: userId,
  }).sort({ end: 'desc' });
};

/**
 * Update track
 * @param {Object} track
 * @param {Object} updateBody
 * @returns {Promise<Track>}
 */
const updateTrack = async (track, updateBody) => {
  Object.assign(track, updateBody);
  await track.save();
  return track;
};

/**
 * Delete tracks
 * @param {ObjectId} userId
 * @returns {Promise<Track>}
 */
const deleteTracksByUserId = async (userId) => {
  const tracks = await Track.deleteMany({ user: userId })
  return tracks;
};

/**
 * Get list of latest user tracks
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<Track>}
 */
const getLatestUsers = async (options) => {
  const users = await Track.aggregate([
    {
      $group: {
        _id: '$user',
        trackId: {
          $last: '$_id',
        },
        name: {
          $last: '$name',
        },
        title: {
          $last: '$title',
        },
        url: {
          $last: '$url',
        },
        dateTime: {
          $last: '$end',
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDetail',
      },
    },
    {
      $sort: {
        dateTime: -1,
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'totalResults' }, { $addFields: { page: options.page } }],
        results: [
          { $skip: (options.page - 1) * options.limit },
          { $limit: options.limit },
          {
            $project: {
              trackId: 1,
              name: 1,
              title: 1,
              url: 1,
              dateTime: 1,
              'userDetail._id': 1,
              'userDetail.name': 1,
              'userDetail.email': 1,
            },
          },
        ],
      },
    },
  ]);
  return users;
};

module.exports = {
  createTrack,
  getTracks,
  getLastTrack,
  updateTrack,
  countTrackWithDate,
  deleteTracksByUserId,
  getLatestUsers,
};
