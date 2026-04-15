const asyncHandler = require("../utils/asyncHandler");
const { saveSubscription, removeSubscription, VAPID_PUBLIC } = require("../services/pushNotification.service");

exports.getVapidKey = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { publicKey: VAPID_PUBLIC } });
});

exports.subscribe = asyncHandler(async (req, res) => {
  const sub = await saveSubscription(req.user.id, req.body);
  res.status(201).json({ success: true, data: sub });
});

exports.unsubscribe = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  await removeSubscription(req.user.id, endpoint);
  res.json({ success: true });
});
