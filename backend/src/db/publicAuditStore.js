import { v4 as uuidv4 } from "uuid";
import { supabase } from "./supabase.js";
import { joinUrl } from "../utils/url.js";
import { buildPublicAuditPayload } from "../utils/publicAudit.js";

const PUBLIC_AUDITS_TABLE = "public_audits";
const memoryAuditStore = new Map();

function createPublicId() {
  return uuidv4()
    .replaceAll("-", "")
    .slice(0, 12);
}

function normalizeStoredAudit(
  storedAudit,
  storage
) {
  if (!storedAudit) {
    return null;
  }

  return {
    id: storedAudit.id,
    publicId:
      storedAudit.public_id ||
      storedAudit.publicId,
    publicUrl:
      storedAudit.public_url ||
      storedAudit.publicUrl,
    companyName:
      storedAudit.company_name ||
      storedAudit.companyName ||
      null,
    email: storedAudit.email || null,
    report:
      storedAudit.report || null,
    publicReport:
      storedAudit.public_report ||
      storedAudit.publicReport,
    llmResponse:
      storedAudit.llm_response ||
      storedAudit.llmResponse ||
      "",
    createdAt:
      storedAudit.created_at ||
      storedAudit.createdAt,
    storage,
  };
}

async function persistToSupabase(record) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(PUBLIC_AUDITS_TABLE)
    .insert({
      id: record.id,
      public_id: record.publicId,
      public_url: record.publicUrl,
      company_name: record.companyName,
      email: record.email,
      report: record.report,
      public_report: record.publicReport,
      llm_response: record.llmResponse,
      created_at: record.createdAt,
    })
    .select(
      "id, public_id, public_url, company_name, email, report, public_report, llm_response, created_at"
    )
    .single();

  if (error) {
    console.warn(
      "Supabase persistence failed. Falling back to in-memory public audit storage.",
      error.message
    );
    return null;
  }

  return normalizeStoredAudit(
    data,
    "supabase"
  );
}

async function fetchFromSupabase(publicId) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(PUBLIC_AUDITS_TABLE)
    .select(
      "id, public_id, public_url, company_name, email, report, public_report, llm_response, created_at"
    )
    .eq("public_id", publicId)
    .maybeSingle();

  if (error) {
    console.warn(
      "Supabase fetch failed for public audit.",
      error.message
    );
    return null;
  }

  return normalizeStoredAudit(
    data,
    "supabase"
  );
}

export async function createPublicAuditRecord({
  companyName,
  email,
  publicOrigin,
  report,
  llmResponse,
}) {
  const publicId = createPublicId();
  const publicUrl = joinUrl(
    publicOrigin,
    `/public/audits/${publicId}`
  );
  const createdAt = new Date().toISOString();
  const record = {
    id: uuidv4(),
    publicId,
    publicUrl,
    companyName: companyName || null,
    email: email || null,
    report,
    publicReport: buildPublicAuditPayload({
      publicId,
      publicUrl,
      createdAt,
      report,
      llmResponse,
    }),
    llmResponse,
    createdAt,
  };

  const persistedRecord =
    await persistToSupabase(record);

  if (persistedRecord) {
    memoryAuditStore.set(
      publicId,
      persistedRecord
    );
    return persistedRecord;
  }

  const memoryRecord =
    normalizeStoredAudit(record, "memory");
  memoryAuditStore.set(publicId, memoryRecord);

  return memoryRecord;
}

export async function getPublicAuditRecord(
  publicId
) {
  if (memoryAuditStore.has(publicId)) {
    return memoryAuditStore.get(publicId);
  }

  const storedAudit =
    await fetchFromSupabase(publicId);

  if (storedAudit) {
    memoryAuditStore.set(
      publicId,
      storedAudit
    );
  }

  return storedAudit;
}
