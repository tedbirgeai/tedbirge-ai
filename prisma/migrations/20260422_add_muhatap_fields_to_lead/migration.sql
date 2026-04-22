-- CreateEnum
CREATE TYPE "MuhatapTipi" AS ENUM (
  'TRAFIK_SIGORTASI',
  'KASKO',
  'FERDI_KAZA_KOLTUK',
  'TMTB',
  'GUVENCE_HESABI',
  'ISVEREN',
  'SGK',
  'HASTANE',
  'TARSIM',
  'DASK',
  'SORUMLU_UCUNCU_KISI',
  'KAMU_KURUMU',
  'DIGER'
);

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "muhatapTipi"          "MuhatapTipi";
ALTER TABLE "Lead" ADD COLUMN "muhatapAdi"            TEXT;
ALTER TABLE "Lead" ADD COLUMN "muhatapTespitKaynagi"  TEXT;
ALTER TABLE "Lead" ADD COLUMN "muhatapGuvenSkoru"     DOUBLE PRECISION;
ALTER TABLE "Lead" ADD COLUMN "muhatapGerekce"        TEXT;
