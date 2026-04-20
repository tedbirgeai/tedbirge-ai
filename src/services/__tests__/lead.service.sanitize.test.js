"use strict";

const { __test } = require("../lead.service");
const { sanitizeLawyerForRepresentative } = __test;

describe("sanitizeLawyerForRepresentative", () => {
  test("lawyer tamamen null dondurur", () => {
    const input = [{
      id: "a1", leadId: "l1", status: "ACTIVE", createdAt: new Date(),
      note: "GIZLI: ucret anlasmasi 30%",
      lawyer: { id: "u1", fullName: "Av. Ahmet Yilmaz", email: "a@x.com", phone: "0555" }
    }];
    const result = sanitizeLawyerForRepresentative(input);
    expect(result[0].lawyer).toBeNull();
  });

  test("note (atama notu) kirpilir", () => {
    const input = [{ id: "a1", note: "GIZLI NOT", status: "ACTIVE", lawyer: null }];
    const result = sanitizeLawyerForRepresentative(input);
    expect(result[0]).not.toHaveProperty("note");
  });

  test("sadece beyaz liste alanlar donur", () => {
    const input = [{
      id: "a1", leadId: "l1", status: "ACTIVE", createdAt: new Date(),
      note: "x", internalField: "secret", lawyer: { id: "u1", fullName: "X" }
    }];
    const result = sanitizeLawyerForRepresentative(input);
    expect(Object.keys(result[0]).sort()).toEqual(
      ["createdAt", "id", "lawyer", "leadId", "status"]
    );
  });

  test("bos array bos array dondurur", () => {
    expect(sanitizeLawyerForRepresentative([])).toEqual([]);
  });

  test("null/undefined bos array dondurur", () => {
    expect(sanitizeLawyerForRepresentative(null)).toEqual([]);
    expect(sanitizeLawyerForRepresentative(undefined)).toEqual([]);
  });
});
