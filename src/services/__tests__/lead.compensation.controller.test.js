"use strict";

jest.mock("../../config/db", () => ({
  lead: {
    findUnique: jest.fn(),
    update:     jest.fn(),
  },
}));

jest.mock("../../utils/leadAccess", () => ({
  assertLeadAccess: jest.fn().mockResolvedValue(undefined),
}));

// asyncHandler promise'i return etmiyor — testte direkt fn olarak kullan
jest.mock("../../utils/asyncHandler", () => (fn) => fn);

const prisma = require("../../config/db");
const ctrl   = require("../../controllers/lead.compensation.controller");

function makeReqRes(params = {}, body = {}, user = { role: "ADMIN", id: "u1" }) {
  const next = jest.fn();
  const req  = { params, body, user };
  const res  = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn(),
  };
  return { req, res, next };
}

describe("updateEstimatedCompensation", () => {
  afterEach(() => jest.clearAllMocks());

  test("gecerli istek → 200, prisma.lead.update dogru args ile cagriliyor", async () => {
    prisma.lead.findUnique.mockResolvedValue({ id: "l1", assignments: [] });
    prisma.lead.update.mockResolvedValue({ id: "l1", estimatedCompensation: 60000 });

    const { req, res, next } = makeReqRes({ id: "l1" }, { estimatedCompensation: 60000 });
    await ctrl.updateEstimatedCompensation(req, res, next);

    expect(prisma.lead.update).toHaveBeenCalledWith({
      where:  { id: "l1" },
      data:   { estimatedCompensation: 60000 },
      select: { id: true, estimatedCompensation: true },
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, estimatedCompensation: 60000 });
    expect(res.status).not.toHaveBeenCalled();
  });

  test("lead bulunamadi → 404", async () => {
    prisma.lead.findUnique.mockResolvedValue(null);

    const { req, res, next } = makeReqRes({ id: "yok" }, { estimatedCompensation: 50000 });
    await ctrl.updateEstimatedCompensation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  test("negatif sayi → 400", async () => {
    const { req, res, next } = makeReqRes({ id: "l1" }, { estimatedCompensation: -1 });
    await ctrl.updateEstimatedCompensation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  test("string body → 400", async () => {
    const { req, res, next } = makeReqRes({ id: "l1" }, { estimatedCompensation: "abc" });
    await ctrl.updateEstimatedCompensation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });

  test("undefined body → 400", async () => {
    const { req, res, next } = makeReqRes({ id: "l1" }, {});
    await ctrl.updateEstimatedCompensation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.lead.update).not.toHaveBeenCalled();
  });
});
