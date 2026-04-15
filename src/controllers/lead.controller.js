const asyncHandler = require("../utils/asyncHandler");
const leadService = require("../services/lead.service");
const ApiError = require("../utils/ApiError");
const { createWhatsappRedirect, markRedirected } = require("../services/whatsapp.service");
const { runWorkflow } = require("../services/workflow.service");
const { getUyapStatus, saveUyapData } = require("../services/uyap.service");
const { getSgkData } = require("../services/sgk.service");
const { getEmsalKararlar } = require("../services/emsal.service");
const { generateKazaRaporu } = require("../services/kazaRapor.service");
const { generatePetition } = require("../services/ai.service");
const prisma = require("../config/db");
const PDFDocument = require("pdfkit");
const path = require("path");

exports.createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(req.body, req.user?.id || null);
  res.status(201).json({ success: true, data: lead });
});

exports.listLeads = asyncHandler(async (req, res) => {
  const leads = await leadService.listLeads(req.query, req.user);
  res.json({ success: true, data: leads });
});

exports.getLead = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id, req.user);
  res.json({ success: true, data: lead });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLeadStatus(req.params.id, req.body.status, req.body.note);
  res.json({ success: true, data: lead });
});


exports.assignOwner = asyncHandler(async (req, res) => {
  const lead = await leadService.assignLeadOwner(req.params.id, req.body.ownerId);
  res.json({ success: true, data: lead });
});

exports.bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, action, value } = req.body;
  const result = await leadService.bulkUpdateLeads({ ids, action, value, actorId: req.user?.id });
  res.json({ success: true, data: result });
});
exports.getWhatsappRedirect = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id, req.user);
  const url = createWhatsappRedirect(lead);
  await markRedirected(lead.id);
  res.json({ success: true, data: { url } });
});





exports.continueProcess = asyncHandler(async (req, res) => {
  const lead = await leadService.markReadyForContract(req.params.id);
  res.json({ success: true, data: lead });
});

exports.approveProcess = asyncHandler(async (req, res) => {
  const lead = await leadService.approveForContract(req.params.id, req.body.lawyerId);
  res.json({ success: true, data: lead });
});

exports.operationApproveLead = asyncHandler(async (req, res) => {
  const lead = await leadService.operationApproveLead(req.params.id, {
    caseType: req.body?.caseType,
    signerType: req.body?.signerType,
    lawyerId: req.body?.lawyerId,
    processType: req.body?.processType,
  });

  res.json({ success: true, data: lead });
});



exports.getDocumentDraft = asyncHandler(async (req, res) => {
  const data = await leadService.generateDocumentDraft(req.params.id);
  res.json({ success: true, data });
});


function normalizePdfText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function streamTextPdf(res, filename, title, text) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50
  });

  const regularFontPath = "C:\\Windows\\Fonts\\arial.ttf";
  const boldFontPath = "C:\\Windows\\Fonts\\arialbd.ttf";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

  doc.pipe(res);

  try {
    doc.registerFont("TedbirgeRegular", regularFontPath);
    doc.registerFont("TedbirgeBold", boldFontPath);

        // TEDBIRGE HEADER
    doc.font("Helvetica-Bold").fontSize(18).text("TEDBIRGE AI", { align: "left" });
    doc.font("Helvetica").fontSize(10).text("Hukuki Belge ve Danismanlik Sistemi", { align: "left" });
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
    doc.font("TedbirgeBold").fontSize(16).text(normalizePdfText(title || "Belge"), {
      align: "left"
    });
    doc.moveDown();
    doc.font("TedbirgeRegular").fontSize(11).text(normalizePdfText(text || "Belge metni bulunamadi."), {
      align: "left",
      lineGap: 4
    });
  } catch (error) {
    doc.font("Helvetica-Bold").fontSize(16).text(normalizePdfText(title || "Belge"), {
      align: "left"
    });
    doc.moveDown();
    doc.font("Helvetica").fontSize(11).text(normalizePdfText(text || "Belge metni bulunamadi."), {
      align: "left",
      lineGap: 4
    });
  }

  
  // === TEDBIRGE CTA BLOU ===
  doc.moveDown(2);

  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  doc.font("Helvetica-Bold").fontSize(12)
     .text("Bu belge Tedbirge AI tarafindan olusturulmustur.", { align: "left" });

  doc.moveDown(0.5);

  doc.font("Helvetica").fontSize(11)
     .text("Dosyanizin hukuki takibi icin uzman avukat destegi alabilirsiniz.", { align: "left" });

  doc.moveDown(0.5);

  doc.font("Helvetica-Bold").fontSize(11)
     .text("Yonlendirme almak icin bizimle iletisime gecin.", { align: "left" });

  doc.end();
}

exports.downloadContractPdf = asyncHandler(async (req, res) => {
  const data = await leadService.generateDocumentDraft(req.params.id);

  const contractText =
    data?.contractText ||
    data?.agreementText ||
    data?.attorneyAgreementText ||
    "Sozlesme taslagi bulunamadi.";

  streamTextPdf(
    res,
    `sozlesme-${req.params.id}.pdf`,
    "Avukatlik Hizmet Sozlesmesi",
    contractText
  );
});

exports.downloadPowerOfAttorneyPdf = asyncHandler(async (req, res) => {
  const data = await leadService.generateDocumentDraft(req.params.id);

  const poaText =
    data?.powerOfAttorneyText ||
    data?.poaText ||
    data?.powerText ||
    "Vekalet taslagi bulunamadi.";

  streamTextPdf(
    res,
    `vekalet-${req.params.id}.pdf`,
    "Vekalet Hazirlik Taslagi",
    poaText
  );
});

exports.runLeadWorkflow = asyncHandler(async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: { documents: true, assignments: true }
  });

  if (!lead) {
    return res.status(404).json({ success: false, message: "Lead bulunamadi." });
  }

  // workflow.service lastResponseText alanini kullanir; body'den gelebilir
  const workflowInput = Object.assign({}, lead, {
    lastResponseText: req.body?.lastResponseText || null,
    analysis: req.body?.analysis || {}
  });

  const result = await runWorkflow(workflowInput);

  return res.json({
    success: true,
    data: {
      leadId: lead.id,
      branch: result.branch,
      entity: result.entity,
      nextAction: result.nextAction,
      lastResponseType: result.lastResponseType || null,
      applicationText: result.applicationText || null,
      appealText: result.appealText || null
    }
  });
});

exports.getUyapStatus = asyncHandler(async (req, res) => {
  const data = await getUyapStatus(req.params.id);
  res.json({ success: true, data });
});

exports.saveUyapData = asyncHandler(async (req, res) => {
  const { dosyaNo, mahkeme, durum } = req.body;
  const lead = await saveUyapData(req.params.id, { dosyaNo, mahkeme, durum });
  res.json({ success: true, data: lead });
});

exports.getSgkData = asyncHandler(async (req, res) => {
  const data = await getSgkData(req.params.id);
  res.json({ success: true, data });
});

exports.verifyLead = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id, req.user);

  if (!lead) {
    return res.status(404).json({
      success: false,
      message: "Belge bulunamadi."
    });
  }

  return res.json({
    success: true,
    data: {
      leadId: lead.id,
      status: lead.status,
      customerName: lead.customerName || null,
      message: "Bu belge Tedbirge AI tarafindan olusturulmustur.",
      action: "Hukuki destek almak icin yonlendirme talep edebilirsiniz."
    }
  });
});

exports.getEmsalKararlar = asyncHandler(async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    select: { accidentType: true, assignments: true }
  });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadı." });
  if (req.user?.role === "LAWYER") {
    const isAssigned = (lead.assignments || []).some(
      (a) => a.lawyerId === req.user.id && a.status === "ACTIVE"
    );
    if (!isAssigned) return res.status(403).json({ success: false, message: "Bu dosyaya erişim yetkiniz yok." });
  }
  const kararlar = getEmsalKararlar(lead.accidentType);
  res.json({ success: true, data: kararlar });
});

exports.getKazaRaporu = asyncHandler(async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: { assignments: true }
  });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadı." });
  if (req.user?.role === "LAWYER") {
    const isAssigned = (lead.assignments || []).some(
      (a) => a.lawyerId === req.user.id && a.status === "ACTIVE"
    );
    if (!isAssigned) return res.status(403).json({ success: false, message: "Bu dosyaya erişim yetkiniz yok." });
  }
  const rapor = generateKazaRaporu(lead);
  res.json({ success: true, data: rapor });
});

exports.generateLeadPetition = asyncHandler(async (req, res) => {
  const { type = "CIVIL_COURT" } = req.query;
  const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
  if (!lead) return res.status(404).json({ success: false, message: "Lead bulunamadı." });
  const text = await generatePetition(lead, type);
  res.json({ success: true, data: { type, content: text } });
});

exports.gdprDelete = asyncHandler(async (req, res) => {
  const prisma = require("../config/db");
  const { id } = req.params;
  const requestingUser = req.user;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, leadCode: true, ownerId: true },
  });

  if (!lead) {
    return res.status(404).json({ success: false, message: "Lead bulunamadı." });
  }

  const isAdmin = requestingUser.role === "ADMIN";
  const isOwner = lead.ownerId && lead.ownerId === requestingUser.id;

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ success: false, message: "Bu işlem için yetkiniz yok." });
  }

  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { session: { leadId: id } } }),
    prisma.chatSession.deleteMany({ where: { leadId: id } }),
    prisma.contract.deleteMany({ where: { leadId: id } }),
    prisma.assignment.deleteMany({ where: { leadId: id } }),
    prisma.document.deleteMany({ where: { leadId: id } }),
    prisma.activityLog.deleteMany({ where: { leadId: id } }),
    prisma.lead.delete({ where: { id } }),
  ]);

  await prisma.activityLog.create({
    data: {
      action: "GDPR_DELETE",
      detail: `Lead ${lead.leadCode} KVKK kapsamında silindi. İşlemi yapan: ${requestingUser.email}`,
    },
  });

  res.json({ success: true, message: `Lead ${lead.leadCode} ve tüm ilişkili veriler silindi.` });
});


exports.addActivityNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note, action = "MANUAL_NOTE" } = req.body;
  if (!note) return res.status(400).json({ success: false, message: "Not alanı gerekli." });
  const log = await prisma.activityLog.create({
    data: {
      leadId: id,
      action,
      detail: `[${req.user.name || req.user.email}] ${note}`,
    },
  });
  res.status(201).json({ success: true, data: log });
});

exports.getActivityLogs = asyncHandler(async (req, res) => {
  const logs = await prisma.activityLog.findMany({
    where: { leadId: req.params.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ success: true, data: logs });
});
