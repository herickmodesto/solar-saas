// ─────────────────────────────────────────────────────────────
// Tipos compartilhados entre frontend e backend — SolarPro
// ─────────────────────────────────────────────────────────────

// ── Usuário ──────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  companyCnpj?: string | null;
  avatarUrl?: string | null;
  role: "USER" | "ADMIN";
  subscription?: SubscriptionInfo | null;
  createdAt: string;
}

export interface SubscriptionInfo {
  id: string;
  plan: "PROPOSTA" | "PRO" | "ENTERPRISE";
  status: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
}

// ── Cliente ───────────────────────────────────────────────────

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  cpf?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  companyName?: string | null;
  companyCnpj?: string | null;
  companyContact?: string | null;
  notes?: string | null;
  createdAt: string;
  _count?: { proposals: number; calculations: number };
}

export type CreateClientInput = Omit<Client, "id" | "createdAt" | "_count">;

// ── Proposta ──────────────────────────────────────────────────

export type ProposalStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export interface Proposal {
  id: string;
  proposalNumber: string;
  clientId: string;
  client?: Pick<Client, "id" | "name" | "city" | "state">;

  // Sistema
  numModules: number;
  modulePower: number;
  systemKwp: number;
  monthlyGenKwh: number;
  requiredAreaM2?: number | null;

  // Financeiro
  investmentValue: number;
  monthlyConsumptionKwh: number;
  currentEnergyCost: number;
  tariffDiscount: number;
  inflationRate: number;
  monthlyEconomy: number;
  paybackMonths: number;
  savings25y: number;

  // Equipamentos
  modulesBrand?: string | null;
  modulesModel?: string | null;
  inverterBrand?: string | null;
  inverterModel?: string | null;
  inverterQuantity?: number | null;

  // Ambiental
  co2TonsAvoided?: number | null;
  treesSaved?: number | null;
  kmEquivalent?: number | null;

  status: ProposalStatus;
  pdfUrl?: string | null;
  validUntil?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type CreateProposalInput = Omit<Proposal, "id" | "proposalNumber" | "status" | "pdfUrl" | "validUntil" | "createdAt" | "client">;

// ── Cálculo de Aluguel ────────────────────────────────────────

export interface Calculation {
  id: string;
  clientId?: string | null;
  client?: Pick<Client, "id" | "name"> | null;

  teRate: number;
  tusdRate: number;
  tusdFioBRate: number;
  pisRate: number;
  cofinsRate: number;
  icmsRate: number;

  referenceMonth: string;
  consumedKwh: number;
  compensatedKwh: number;
  tariffDiscount: number;
  gdTaxYear: number;

  costWithout: number;
  costWith: number;
  rentValue: number;
  savings: number;

  co2Avoided?: number | null;
  treesSaved?: number | null;
  createdAt: string;
}

// ── Análise Mensal ────────────────────────────────────────────

export interface MonthlyReportEntry {
  id: string;
  month: string;
  consumedKwh: number;
  compensatedKwh: number;
  billValue: number;
  rentValue: number;
}

export interface MonthlyReport {
  id: string;
  title: string;
  systemName?: string | null;
  clientId?: string | null;
  client?: Pick<Client, "id" | "name"> | null;
  periodStart: string;
  periodEnd: string;
  entries: MonthlyReportEntry[];
  createdAt: string;
}

// ── API Responses genéricos ───────────────────────────────────

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = T | ApiError;
