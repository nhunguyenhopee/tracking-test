const moment = require('moment');

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
    return helpers.message('password must contain at least 1 letter and 1 number');
  }
  return value;
};

/**
 * Validate date time format YYYY-MM-DD HH:mm:ss
 */
const dateTime = (value, helpers) => {
  if (!moment(value, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
    return helpers.message('date time format must be YYYY-MM-DD HH:mm:ss');
  }
  return value;
};

/**
 * Validate date time format ISO_8601 YYYY-MM-DDTHH:mm:ss
 */
const dateTimeIso = (value, helpers) => {
  if (!moment(value, moment.ISO_8601, true).isValid()) {
    return helpers.message('date time format must be YYYY-MM-DDTHH:mm:ss');
  }
  return value;
};

/**
 * Validate date format YYYY-MM-DD
 */
const date = (value, helpers) => {
  if (!moment(value, 'YYYY-MM-DD', true).isValid()) {
    return helpers.message('date format must be YYYY-MM-DD');
  }
  return value;
};

/**
 * Validate type calendar
 */
const typeCalendar = (value, helpers) => {
  const types = ['day', 'week', 'month'];
  if (!types.includes(value)) {
    return helpers.message('invalid calendar type.');
  }
  return value;
};

/**
 * Validate year-month format YYYY-MM-DD
 */
const yearMonth = (value, helpers) => {
  if (!moment(value, 'YYYY-MM', true).isValid()) {
    return helpers.message('date format must be YYYY-MM');
  }
  return value;
};

module.exports = {
  objectId,
  password,
  dateTime,
  dateTimeIso,
  date,
  typeCalendar,
  yearMonth,
};
