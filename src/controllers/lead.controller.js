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
const { hesaplaSureler } = require("../services/sureMotoru.service");
const path = require("path");
const fs = require("fs");

exports.createLead = asyncHandler(async (req, res) => {
  const userId = req.user?.id || null;
  const role = req.user?.role;
  // CUSTOMER kendi başvurusunu oluşturuyorsa ownerId = kendi id'si; SALES/REP oluşturursa createdById olarak kaydedilir
  const ownerId = role === "CUSTOMER" ? userId : null;
  const createdById = userId;
  const lead = await leadService.createLead(req.body, ownerId, createdById);
  res.status(201).json({ success: true, data: lead });
});

exports.listLeads = asyncHandler(async (req, res) => {
  const leads = await leadService.listLeads(req.query, req.user);
  res.json({ success: true, data: leads });
});

exports.archiveLead = asyncHandler(async (req, res) => {
  const lead = await leadService.archiveLead(req.params.id);
  await prisma.activityLog.create({
    data: { leadId: req.params.id, action: "LEAD_ARCHIVED", detail: `Arsivlendi — ${req.user.id}` },
  }).catch(() => {});
  return res.json({ success: true, lead });
});

exports.unarchiveLead = asyncHandler(async (req, res) => {
  const lead = await leadService.unarchiveLead(req.params.id);
  await prisma.activityLog.create({
    data: { leadId: req.params.id, action: "LEAD_UNARCHIVED", detail: `Arsivden cikartildi — ${req.user.id}` },
  }).catch(() => {});
  return res.json({ success: true, lead });
});

exports.softDeleteLead = asyncHandler(async (req, res) => {
  const lead = await leadService.softDeleteLead(req.params.id);
  await prisma.activityLog.create({
    data: { leadId: req.params.id, action: "LEAD_DELETED", detail: `Soft-delete — ${req.user.id}` },
  }).catch(() => {});
  return res.json({ success: true, lead });
});

exports.restoreLead = asyncHandler(async (req, res) => {
  const lead = await leadService.restoreLead(req.params.id);
  await prisma.activityLog.create({
    data: { leadId: req.params.id, action: "LEAD_RESTORED", detail: `Geri alindi — ${req.user.id}` },
  }).catch(() => {});
  return res.json({ success: true, lead });
});

exports.getLead = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id, req.user);
  lead.sureler = hesaplaSureler(lead);

  // KVKK log — muvekkil verisi goruntulenme kaniti
  try {
    const tedbirgeOS = require("../os");
    if (tedbirgeOS.modules?.kvkk?.logDataAccess) {
      await tedbirgeOS.modules.kvkk.logDataAccess(req.user?.id, "lead", "view");
    }
  } catch (_) {}

  res.json({ success: true, data: lead });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLeadStatus(req.params.id, req.body.status, req.body.note, req.user);
  res.json({ success: true, data: lead });
});


exports.assignOwner = asyncHandler(async (req, res) => {
  const lead = await leadService.assignLeadOwner(req.params.id, req.body.ownerId);
  res.json({ success: true, data: lead });
});

exports.bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, action, value } = req.body;
  const result = await leadService.bulkUpdateLeads({
    ids, action, value,
    actorId: req.user?.id,
    actorRole: req.user?.role,
  });
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
  if (!lead) {
    return res.status(404).json({ success: false, error: { message: "Lead bulunamadı" } });
  }
  if (req.user?.role === "LAWYER") {
    const assigned = lead.assignments?.some(
      (a) => a.lawyerId === req.user.id && a.status !== "REVOKED"
    );
    if (!assigned) {
      return res.status(403).json({ success: false, error: { message: "Bu lead size atanmamış" } });
    }
  }
  const rapor = generateKazaRaporu(lead);
  if (req.query.format !== "pdf") {
    return res.json({ success: true, data: rapor });
  }
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const filename = `kaza-raporu-${lead.leadCode || lead.id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  doc.pipe(res);
  const arialPath = "C:/Windows/Fonts/arial.ttf";
  const arialBoldPath = "C:/Windows/Fonts/arialbd.ttf";
  const hasArial = fs.existsSync(arialPath);
  const useFont = (bold = false) => {
    if (hasArial) {
      const p = bold && fs.existsSync(arialBoldPath) ? arialBoldPath : arialPath;
      doc.font(p);
    } else {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica");
    }
  };
  const labels = {
    tur: "Kaza Türü", tarih: "Kaza Tarihi", sehir: "Şehir",
    yaralanmaSiddeti: "Yaralanma Şiddeti", ozet: "Özet",
    musteri: "Müşteri", telefon: "Telefon", yas: "Yaş",
    aylikGelir: "Aylık Gelir", maluliyetOrani: "Maluliyet Oranı",
    baslik: "Başlık", yasal: "Yasal Dayanak",
    musterKusurOrani: "Müşteri Kusur Oranı", aciklama: "Açıklama",
    sure: "Süre", kanun: "İlgili Kanun",
    ilkDerece: "İlk Derece", istinaf: "İstinaf", temyiz: "Temyiz", toplam: "Toplam Süre",
    olumTazminati: "Ölüm Tazminatı", sakatlikTazminati: "Sakatlık Tazminatı", malVarligi: "Mal Varlığı Zararı",
    min: "Alt Sınır", max: "Üst Sınır", label: "Etiket"
  };
  const labelOf = (k) => labels[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
  const section = (title, body) => {
    if (!body) return;
    doc.moveDown(0.6);
    useFont(true); doc.fontSize(13).fillColor("#1F4E79").text(title);
    useFont(false); doc.fontSize(11).fillColor("black");
    doc.moveDown(0.25);
    if (typeof body === "string") {
      doc.text(body, { align: "justify" });
    } else if (Array.isArray(body)) {
      body.forEach((item) => {
        if (item && typeof item === "object") {
          Object.entries(item).forEach(([k, v]) => {
            useFont(true); doc.text(`${labelOf(k)}: `, { continued: true });
            useFont(false); doc.text(String(v ?? "-"));
          });
        } else {
          doc.text(`- ${String(item)}`, { indent: 10 });
        }
      });
    } else if (typeof body === "object") {
      Object.entries(body).forEach(([k, v]) => {
        let dv;
        if (v === null || v === undefined || v === "") dv = "-";
        else if (Array.isArray(v)) dv = v.map(String).join(", ");
        else if (typeof v === "object") dv = Object.entries(v).map(([kk, vv]) => `${labelOf(kk)}: ${vv}`).join(" - ");
        else dv = String(v);
        useFont(true); doc.text(`${labelOf(k)}: `, { continued: true });
        useFont(false); doc.text(dv);
      });
    }
  };
  useFont(true);
  doc.fontSize(18).fillColor("black").text("KAZA DEĞERLENDİRME RAPORU", { align: "center" });
  doc.moveDown(0.3);
  useFont(false);
  doc.fontSize(10).fillColor("#666")
     .text(`Rapor No: ${lead.leadCode || lead.id}`, { align: "center" });
  doc.text(`Tarih: ${new Date().toLocaleDateString("tr-TR")}`, { align: "center" });
  doc.moveDown(0.8);
  doc.fillColor("black");
  if (rapor.kazaBilgisi)       section("KAZA BİLGİSİ",          rapor.kazaBilgisi);
  if (rapor.taraflar)          section("TARAFLAR",               rapor.taraflar);
  if (rapor.kusurAnalizi)      section("KUSUR ANALİZİ",          rapor.kusurAnalizi);
  if (rapor.eksikBelgeler)     section("EKSİK BELGELER",         rapor.eksikBelgeler);
  if (rapor.zamanAsimi || rapor.zamAnasimi) section("ZAMANAŞIMI", rapor.zamanAsimi || rapor.zamAnasimi);
  if (rapor.tahminiDavaSuresi) section("TAHMİNİ DAVA SÜRESİ",   rapor.tahminiDavaSuresi);
  if (rapor.zmss2026)          section("ZMSS 2026 LİMİTLERİ",   rapor.zmss2026);
  if (rapor.tahminiTazminat)   section("TAHMİNİ TAZMİNAT",      rapor.tahminiTazminat);
  doc.moveDown(2);
  useFont(false);
  doc.fontSize(9).fillColor("#888").text(
    "Bu rapor otomatik olarak Tedbirge.ai tarafından üretilmiştir. Bağlayıcı bir bilirkişi raporu değildir; avukat değerlendirmesine yardımcı ön analiz niteliğindedir.",
    { align: "justify" }
  );
  doc.end();
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
    prisma.chatMessage.deleteMany({ where: { leadId: id } }),
    prisma.chatSession.deleteMany({ where: { leadId: id } }),
    prisma.contract.deleteMany({ where: { leadId: id } }),
    prisma.assignment.deleteMany({ where: { leadId: id } }),
    prisma.document.deleteMany({ where: { leadId: id } }),
    prisma.activityLog.deleteMany({ where: { leadId: id } }),
    prisma.bilirkisi.deleteMany({ where: { leadId: id } }),
    prisma.durusma.deleteMany({ where: { leadId: id } }),
    prisma.masraf.deleteMany({ where: { leadId: id } }),
    prisma.uYAPDosyaSync.deleteMany({ where: { leadId: id } }),
    prisma.ihtarnameTakip.deleteMany({ where: { leadId: id } }),
    prisma.petition.deleteMany({ where: { leadId: id } }),
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

exports.gdprExport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      activities: true,
      assignments: true,
      Bilirkisi: true,
      messages: true,
      ChatSession: true,
      contracts: true,
      davaSurec: true,
      documents: true,
      durusmalar: true,
      ihtarnameler: true,
      Masraf: true,
      Petition: true,
      uyapDosyaSyncs: true,
    },
  });

  if (!lead) {
    return res.status(404).json({ success: false, message: "Lead bulunamadı." });
  }

  res.json({
    success: true,
    exportedAt: new Date().toISOString(),
    exportedBy: req.user.email,
    data: lead,
  });
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
