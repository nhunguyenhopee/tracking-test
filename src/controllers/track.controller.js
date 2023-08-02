const httpStatus = require('http-status');
const moment = require('moment');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');
const { trackService } = require('../services');
const { userService } = require('../services');

/**
 * Combine data
 */
const combineTrackData = (data, type, startDate, endDate) => {
  const result = data.reduce(
    (res, itemCurrent) => {
      // current name
      const currentName = itemCurrent.name;
      // minimum time to belong to 1 row
      const minutes = 7;
      // total time of 1 track
      // eslint-disable-next-line no-param-reassign
      itemCurrent.totalSecond = moment(itemCurrent.end).diff(moment(itemCurrent.start), 'seconds');

      // get last item same name as current item
      const sameNameArr = Object.keys(res.data).filter((key) => res.data[key].name === currentName);
      let sameFlag = false;
      let sameKey = '';

      // If 2 similar apps are open within 7 minutes of each other, they will be combined
      if (sameNameArr.at(-1) !== undefined && moment(itemCurrent.start).diff(moment(res.data[sameNameArr.at(-1)].end), 'minutes') <= minutes) {
        sameKey = sameNameArr.at(-1);
        sameFlag = true;
      } else if (currentName === res.lastName && moment(itemCurrent.start).diff(moment(res.lastEndTime), 'minutes') <= minutes) { // Conversely, if the item immediately preceding it is the same as the name of the app and is less than 7 minutes apart, it will be combined
        sameKey = res.idx - 1;
        sameFlag = true;
      }

      if (sameFlag) {
        let dataSameKey = res.data[sameKey];
        let lastTrack = dataSameKey.tracks.at(-1);

        // fix conflict data app and extension
        const seconds = 30;
        if (moment(itemCurrent.start) < moment(lastTrack.end) || (itemCurrent.title === lastTrack.title && moment(itemCurrent.start).diff(moment(lastTrack.end), 'seconds') <= seconds)) {
          if (itemCurrent.url) {
            dataSameKey.tracks.pop();
          } else {
            return res;
          }
        }

        // push data
        dataSameKey.totalSecond += itemCurrent.totalSecond; // Total time of a row
        dataSameKey.memories += 1;
        dataSameKey.end = itemCurrent.end;
        dataSameKey.positionLast = moment(itemCurrent.end).diff(moment(itemCurrent.end).startOf('day'), 'minutes');
        res.lastEndTime = itemCurrent.end; // set end new time
        dataSameKey.tracks.push(itemCurrent);
        return res;
      }

      // Add first element to row
      Object.assign(res.data, {
        [res.idx]: {
          name: itemCurrent.name,
          totalSecond: itemCurrent.totalSecond,
          memories: 1,
          start: itemCurrent.start,
          end: itemCurrent.end,
          positionFirst: moment(itemCurrent.start).diff(moment(itemCurrent.start).startOf('day'), 'minutes'),
          tracks: [itemCurrent],
        },
      });

      // Retain the information of the before track
      res.lastName = currentName;
      res.lastItem = itemCurrent;
      res.lastEndTime = itemCurrent.end;
      res.idx += 1;
      return res;
    },
    { data: {}, idx: 0, lastName: null, lastItem: {}, lastEndTime: null }
  );

  // create data overlap
  const minutes = 0; // Minutes are added to overlap
  // create data type week or month
  let outData = {};
  if (type === 'week' || type === 'month') {
    for (let i = moment(startDate); i < moment(endDate); i = i.add(1, 'days')) {
      let keyDay = i.format('YYYY-MM-DD');
      Object.assign(outData, {
        [keyDay]: {
          totalSecond: 0,
          trackRows: []
        },
      });
    }
  }

  let results = Object.keys(result.data).reduce((res, key) => {
    // Delete track if it is less than 1 minute
    // if (moment(res.inData[key].end).diff(moment(res.inData[key].start), 'seconds') < 60) {
    //   delete res.inData[key];
    //   return res;
    // }

    // check type
    if (type === 'week' || type === 'month') {
      delete res.inData[key].tracks;
      let dataDate = res.outData[moment(res.inData[key].start).format('YYYY-MM-DD')];
      dataDate.totalSecond += res.inData[key].totalSecond;
      dataDate.trackRows.push(res.inData[key]);
    } else {
      const overlapArr = Object.keys(res.inData).filter((keyFilter) => {
        // If the start time of one row is less than the end time of another row when adding minutes, it is an overlap
        return parseInt(keyFilter) < parseInt(key) && moment(res.inData[key].start) <=  moment(res.inData[keyFilter].end).add(minutes, 'minutes');
      });

      let overlapNth = 0;
      if (overlapArr.at(-1) !== undefined) {
        overlapNth = res.inData[overlapArr.at(-1)].overlapNth + 1;
      }

      res.inData[key].overlapNth = overlapNth;
      res.outData = res.inData;
    }

    // total all second
    res.totalSecond += res.inData[key].totalSecond;

    return res;
  }, { inData: result.data, outData: outData, totalSecond: 0 });

  const response = {
    totalSecond: results.totalSecond,
    results: results.outData,
  };

  return response;
};

/**
 * Create track
 */
const createTrack = catchAsync(async (req, res) => {
  let timeTrackBefore = null;
  let item = {};
  const userId = req.user.id;
  const trackBody = [];
  const bodyData = req.body;
  const minutes = 2;
  const lastTrack = await trackService.getLastTrack(userId);

  bodyData.sort(function (a, b) {
    return new Date(a.time) - new Date(b.time);
  });

  // foreach track data
  bodyData.forEach((element, index) => {
    // first item
    if (Object.keys(item).length === 0) {
      // set item default
      item = {
        user: userId,
        name: element.name,
        title: element.title,
        url: element.url ? element.url : null,
        start: element.time,
        end: null,
      };

      // if last track is same as current track then get start info in db
      if (
        index === 0 &&
        lastTrack &&
        lastTrack.name === element.name &&
        lastTrack.title === element.title &&
        moment(element.time).diff(moment(lastTrack.end), 'minutes') <= minutes
      ) {
        item.id = lastTrack.id;
        item.start = lastTrack.start;
      }
    } else {
      // check not last element
      // is the current element's time 1 second behind the previous element
      if (item.name === element.name && item.title === element.title) {
        // Add time if the distance is less than 2 minutes
        if (moment(element.time).diff(moment(timeTrackBefore), 'minutes') <= minutes) {
          // continue
          timeTrackBefore = element.time;
          if (index !== req.body.length - 1) {
            return;
          }
        }
      }

      // set track end time
      item.end = timeTrackBefore;

      // update track in db
      if (item.id) {
        delete item.id;
        trackService.updateTrack(lastTrack, item);
      } else if (moment(item.end).diff(moment(item.start), 'seconds') > 5) {
        // If the same application changes files or tabs for more than 5 seconds, it will be counted.
        // create a new track
        trackBody.push({ ...item });
      }

      // set item first new
      item = {
        user: userId,
        name: element.name,
        title: element.title,
        url: element.url ? element.url : null,
        start: element.time,
      };

      // If it's the last and it's not on the previous track
      if (index === req.body.length - 1 && timeTrackBefore !== element.time) {
        item.end = element.time;
        trackBody.push({ ...item });
      }
    }
    // set time track before with element current
    timeTrackBefore = element.time;
  });

  // create
  await trackService.createTrack(trackBody);

  return res.status(httpStatus.CREATED).send();
});

/**
 * Get track list by user
 */
const getTracksByUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const targetDate = moment(req.query.date);
  const type = req.query.type;
  let startDate = targetDate.clone().startOf('day').toDate();
  let endDate = targetDate.clone().endOf('day').toDate();

  if (type === 'week') {
    startDate = targetDate.clone().startOf('isoWeek').toDate();
    endDate = targetDate.clone().endOf('isoWeek').toDate();
  } else if (type === 'month') {
    startDate = targetDate.clone().startOf('month').startOf('isoWeek').toDate();
    endDate = targetDate.clone().endOf('month').endOf('isoWeek').toDate();
  }

  const tracks = await trackService.getTracks(user.id, startDate, endDate);
  let combineData = combineTrackData(tracks, type, startDate, endDate);
  res.send(combineData);
});

/**
 * list of latest user tracks
 */
const getLatestUsers = catchAsync(async (req, res) => {
  const options = pick(req.query, ['limit', 'page']);
  const result = await trackService.getLatestUsers(options);
  const resultFinal = result[0];
  const metadata = resultFinal.metadata[0];
  const response = {
    results: resultFinal.results,
    page: req.query.page,
    limit: req.query.limit,
    totalPages: Math.ceil(parseInt(metadata.totalResults) / parseInt(req.query.limit)),
    totalResults: metadata.totalResults,
  }
  res.send(response);
});

/**
 * Count track by date of user
 */
const countByDate = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const targetDate = moment(req.query.yearMonth, "YYYY-MM");
  let startDate = targetDate.clone().startOf('month').startOf("isoWeek").toDate();
  let endDate = targetDate.clone().endOf('month').endOf("isoWeek").toDate();

  const countByDate = await trackService.countTrackWithDate(user.id, startDate, endDate);
  res.send(countByDate);
});

module.exports = {
  createTrack,
  getTracksByUser,
  getLatestUsers,
  countByDate,
};
