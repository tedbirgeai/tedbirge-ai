const service = require("../services/sigortaBasvuru.service");

async function create(req, res, next) {
  try {
    const { leadId } = req.params;
    const basvuru = await service.createBasvuru({ leadId, data: req.body });
    res.status(201).json({ success: true, data: basvuru });
  } catch (err) {
    next(err);
  }
}

async function listByLead(req, res, next) {
  try {
    const { leadId } = req.params;
    const basvurular = await service.getBasvurularByLeadId(leadId);
    res.json({ success: true, data: basvurular });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const basvuru = await service.getBasvuru(id);
    if (!basvuru) return res.status(404).json({ success: false, error: "Başvuru bulunamadı" });
    res.json({ success: true, data: basvuru });
  } catch (err) {
    next(err);
  }
}

async function changeStatus(req, res, next) {
  try {
    const { id } = req.params;
    const basvuru = await service.updateStatus(id, req.body);
    res.json({ success: true, data: basvuru });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listByLead, getOne, changeStatus };
