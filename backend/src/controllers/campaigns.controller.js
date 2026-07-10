const service = require('../services/campaign.service');
const { asyncHandler } = require('../utils/asyncHandler');

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.list(req.organizationId, req.query);
  res.json({ data: items, meta });
});

const getById = asyncHandler(async (req, res) => {
  const campaign = await service.getById(req.organizationId, req.params.id);
  res.json({ data: campaign });
});

module.exports = { list, getById };
