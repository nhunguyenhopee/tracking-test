const catchAsync = require('../utils/catchAsync');

/**
 * Get track list by date
 */
const getInfo = catchAsync(async (req, res) => {
  res.send('Track API');
});

module.exports = {
  getInfo,
};
