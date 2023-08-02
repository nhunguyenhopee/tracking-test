const Joi = require('joi');
const { dateTimeIso, date, typeCalendar, yearMonth } = require('./custom.validation');
const { objectId } = require('./custom.validation');

const createTrack = {
  body: Joi.array().items(
    Joi.object().keys({
      name: Joi.string().required(),
      title: Joi.string().required(),
      url: Joi.string(),
      time: Joi.string().required().custom(dateTimeIso),
    })
  ),
};

const getTracks = {
  query: Joi.object().keys({
    date: Joi.string().required().custom(date),
    type: Joi.string().required().custom(typeCalendar),
  }),
};

const getTracksByUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    date: Joi.string().required().custom(date),
    type: Joi.string().required().custom(typeCalendar),
  }),
};

const getLatestUsers = {
  query: Joi.object().keys({
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const countByDate = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
  query: Joi.object().keys({
    yearMonth: Joi.string().required().custom(yearMonth),
  }),
};

module.exports = {
  createTrack,
  getTracks,
  getTracksByUser,
  getLatestUsers,
  countByDate,
};
