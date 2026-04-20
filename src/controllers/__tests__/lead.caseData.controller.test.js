"use strict";

jest.mock("../../utils/asyncHandler", () => (fn) => fn);
jest.mock("../../config/db", () => ({
  lead: { findUnique: jest.fn(), update: jest.fn() },
}));
jest.mock("../../utils/leadAccess", () => ({
  assertLeadAccess: jest.fn().mockResolvedValue(undefined),
}));

const prisma = require("../../config/db");
const ctrl = require("../lead.caseData.controller");

function makeReqRes(params, body, user) {
  const req = { params, body, user };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return { req, res };
}

describe("updateCaseData", () => {
  afterEach(() => jest.clearAllMocks());

  test("LAWYER tum alanlari guncelleyebilir", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: "l1", assignments: [] });
    prisma.lead.update.mockResolvedValue({ id: "l1", accidentDate: new Date(), age: 35 });
    const { req, res } = makeReqRes(
      { id: "l1" },
      { accidentDate: "2024-05-01", age: 35, monthlyIncome: 20000 },
      { role: "LAWYER", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(prisma.lead.update).toHaveBeenCalled();
  });

  test("REPRESENTATIVE sadece accidentDate guncelleyebilir", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: "l1", assignments: [] });
    prisma.lead.update.mockResolvedValue({ id: "l1", accidentDate: new Date() });
    const { req, res } = makeReqRes(
      { id: "l1" },
      { accidentDate: "2024-05-01" },
      { role: "REPRESENTATIVE", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("REPRESENTATIVE age guncelleyemez", async () => {
    const { req, res } = makeReqRes(
      { id: "l1" },
      { age: 40 },
      { role: "REPRESENTATIVE", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  test("CUSTOMER yasak", async () => {
    const { req, res } = makeReqRes(
      { id: "l1" },
      { accidentDate: "2024-05-01" },
      { role: "CUSTOMER", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("Yasak alan (status) reddi", async () => {
    const { req, res } = makeReqRes(
      { id: "l1" },
      { status: "WON" },
      { role: "LAWYER", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  test("Yasak alan (customerName) reddi", async () => {
    const { req, res } = makeReqRes(
      { id: "l1" },
      { customerName: "Hack" },
      { role: "LAWYER", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test("Gecersiz age (negatif) reddi", async () => {
    const { req, res } = makeReqRes(
      { id: "l1" },
      { age: -5 },
      { role: "LAWYER", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("Gecersiz accidentDate reddi", async () => {
    const { req, res } = makeReqRes(
      { id: "l1" },
      { accidentDate: "not-a-date" },
      { role: "LAWYER", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("Lead bulunamadi 404", async () => {
    prisma.lead.findUnique.mockResolvedValue(null);
    const { req, res } = makeReqRes(
      { id: "yok" },
      { accidentDate: "2024-05-01" },
      { role: "LAWYER", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("Bos body reddi", async () => {
    const { req, res } = makeReqRes(
      { id: "l1" },
      {},
      { role: "LAWYER", id: "u1" }
    );
    await ctrl.updateCaseData(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
