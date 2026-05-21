import { v4 as uuidv4 } from "uuid";
import { supabase } from "./supabase.js";
import { joinUrl } from "../utils/url.js";
import { buildPublicAuditPayload } from "../utils/publicAudit.js";

const PUBLIC_AUDITS_TABLE = "public_audits";
const AUDITS_TABLE = "audits";
const memoryAuditStore = new Map();
const memoryInternalAuditStore = new Map();

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

async function updateSupabaseAuditRecord(
  updatedRecord
) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(PUBLIC_AUDITS_TABLE)
    .update({
      company_name:
        updatedRecord.companyName,
      email: updatedRecord.email,
      report: updatedRecord.report,
    })
    .eq("public_id", updatedRecord.publicId)
    .select(
      "id, public_id, public_url, company_name, email, report, public_report, llm_response, created_at"
    )
    .maybeSingle();

  if (error) {
    console.warn(
      "Supabase update failed for public audit.",
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

export async function updatePublicAuditLeadCapture(
  {
    publicId,
    email,
    companyName,
    interestType,
  }
) {
  const existingRecord =
    memoryAuditStore.get(publicId) ||
    (await fetchFromSupabase(publicId));

  if (!existingRecord) {
    return null;
  }

  const nextCompanyName =
    companyName ||
    existingRecord.companyName ||
    null;
  const nextEmail =
    email || existingRecord.email || null;
  const updatedRecord = {
    ...existingRecord,
    companyName: nextCompanyName,
    email: nextEmail,
    report: {
      ...(existingRecord.report || {}),
      leadCapture: {
        ...(
          existingRecord.report
            ?.leadCapture || {}
        ),
        interestType,
        email: nextEmail,
        companyName: nextCompanyName,
        requestedAt:
          new Date().toISOString(),
      },
    },
  };

  const persistedRecord =
    await updateSupabaseAuditRecord(
      updatedRecord
    );
  const nextRecord =
    persistedRecord ||
    normalizeStoredAudit(
      updatedRecord,
      existingRecord.storage
    );

  memoryAuditStore.set(publicId, nextRecord);
  return nextRecord;
}

function normalizeStoredAuditRecord(storedAudit) {
  if (!storedAudit) {
    return null;
  }

  return {
    id: storedAudit.id,
    auditId:
      storedAudit.audit_id ||
      storedAudit.auditId,
    userEmail:
      storedAudit.user_email ||
      storedAudit.userEmail ||
      null,
    inputStack:
      storedAudit.input_stack ||
      storedAudit.inputStack ||
      null,
    outputResult:
      storedAudit.output_result ||
      storedAudit.outputResult ||
      null,
    pricingSnapshot:
      storedAudit.pricing_snapshot ||
      storedAudit.pricingSnapshot ||
      null,
    invalidated:
      storedAudit.invalidated ||
      false,
    changeSummary:
      storedAudit.change_summary ||
      storedAudit.changeSummary ||
      null,
    originalAuditId:
      storedAudit.original_audit_id ||
      storedAudit.originalAuditId ||
      null,
    notifiedAt:
      storedAudit.notified_at ||
      storedAudit.notifiedAt ||
      null,
    createdAt:
      storedAudit.created_at ||
      storedAudit.createdAt,
  };
}

async function persistAuditToSupabase(audit) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(AUDITS_TABLE)
    .insert({
      id: audit.id,
      audit_id: audit.auditId,
      user_email: audit.userEmail,
      input_stack: audit.inputStack,
      output_result: audit.outputResult,
      pricing_snapshot: audit.pricingSnapshot,
      invalidated: audit.invalidated,
      change_summary: audit.changeSummary,
      original_audit_id: audit.originalAuditId,
      notified_at: audit.notifiedAt,
      created_at: audit.createdAt,
    })
    .select(
      "id, audit_id, user_email, input_stack, output_result, pricing_snapshot, invalidated, change_summary, original_audit_id, notified_at, created_at"
    )
    .single();

  if (error) {
    console.warn(
      "Supabase persistence failed for internal audit.",
      error.message
    );
    return null;
  }

  return normalizeStoredAuditRecord(data);
}

async function fetchAuditFromSupabase(auditId) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(AUDITS_TABLE)
    .select(
      "id, audit_id, user_email, input_stack, output_result, pricing_snapshot, invalidated, change_summary, original_audit_id, notified_at, created_at"
    )
    .eq("audit_id", auditId)
    .maybeSingle();

  if (error) {
    console.warn(
      "Supabase fetch failed for internal audit.",
      error.message
    );
    return null;
  }

  return normalizeStoredAuditRecord(data);
}

async function fetchAllAuditsFromSupabase() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from(AUDITS_TABLE)
    .select(
      "id, audit_id, user_email, input_stack, output_result, pricing_snapshot, invalidated, change_summary, original_audit_id, notified_at, created_at"
    );

  if (error) {
    console.warn(
      "Supabase fetch all audits failed.",
      error.message
    );
    return [];
  }

  return (data || []).map(normalizeStoredAuditRecord);
}

async function updateSupabaseInternalAuditRecord(updatedAudit) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(AUDITS_TABLE)
    .update({
      invalidated: updatedAudit.invalidated,
      change_summary: updatedAudit.changeSummary,
      notified_at: updatedAudit.notifiedAt,
    })
    .eq("audit_id", updatedAudit.auditId)
    .select(
      "id, audit_id, user_email, input_stack, output_result, pricing_snapshot, invalidated, change_summary, original_audit_id, notified_at, created_at"
    )
    .maybeSingle();

  if (error) {
    console.warn(
      "Supabase update failed for internal audit.",
      error.message
    );
    return null;
  }

  return normalizeStoredAuditRecord(data);
}

export async function saveAudit({
  auditId,
  userEmail,
  inputStack,
  outputResult,
  pricingSnapshot,
  originalAuditId = null,
}) {
  const createdAt = new Date().toISOString();
  const record = {
    id: uuidv4(),
    auditId,
    userEmail,
    inputStack,
    outputResult,
    pricingSnapshot,
    invalidated: false,
    changeSummary: null,
    originalAuditId,
    notifiedAt: null,
    createdAt,
  };

  const persistedRecord = await persistAuditToSupabase(record);
  if (persistedRecord) {
    memoryInternalAuditStore.set(auditId, persistedRecord);
    return persistedRecord;
  }

  memoryInternalAuditStore.set(auditId, record);
  return record;
}

export async function getAuditById(auditId) {
  if (memoryInternalAuditStore.has(auditId)) {
    return memoryInternalAuditStore.get(auditId);
  }

  const record = await fetchAuditFromSupabase(auditId);
  if (record) {
    memoryInternalAuditStore.set(auditId, record);
  }

  return record;
}

export async function getAllAudits() {
  const records = await fetchAllAuditsFromSupabase();
  records.forEach((record) => {
    if (record?.auditId) {
      memoryInternalAuditStore.set(record.auditId, record);
    }
  });

  return records;
}

export async function markAuditInvalidated(
  auditId,
  changeSummary
) {
  const existingRecord =
    memoryInternalAuditStore.get(auditId) ||
    (await fetchAuditFromSupabase(auditId));

  if (!existingRecord) {
    return null;
  }

  const updatedRecord = {
    ...existingRecord,
    invalidated: true,
    changeSummary,
  };

  const persistedRecord =
    await updateSupabaseInternalAuditRecord(
      updatedRecord
    );

  const nextRecord =
    persistedRecord || updatedRecord;
  memoryInternalAuditStore.set(auditId, nextRecord);
  return nextRecord;
}

export async function markAuditNotified(auditId, notifiedAt = null) {
  const existingRecord =
    memoryInternalAuditStore.get(auditId) ||
    (await fetchAuditFromSupabase(auditId));

  if (!existingRecord) return null;

  const updatedRecord = {
    ...existingRecord,
    notifiedAt,
  };

  const persistedRecord = await updateSupabaseInternalAuditRecord(updatedRecord);
  const nextRecord = persistedRecord || updatedRecord;
  memoryInternalAuditStore.set(auditId, nextRecord);
  return nextRecord;
}
