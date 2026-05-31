const SUPABASE_URL = "https://psdtmyoouqsldxskncth.supabase.co";
const SUPABASE_KEY = "sb_publishable_tjTcbQ6_4Sc2xmOPH9eSbA_cQd4jLZf";
const STORAGE_KEY = "rrhh-central-state";

const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN_EMAIL = "pesoutom@gmail.com";
const PAYROLL_INDICATORS = {
  periodLabel: "Mayo 2026",
  uf: 40610.69,
  utm: 70588,
  taxableCap: 3654962,
  unemploymentCap: 5490565,
  minimumWage: 539000,
  sisRate: 0.0162,
  employerSocialSecurityRate: 0.009,
  healthRate: 0.07,
  afp: {
    capital: { label: "Capital", workerRate: 0.1144, employerRate: 0.001 },
    cuprum: { label: "Cuprum", workerRate: 0.1144, employerRate: 0.001 },
    habitat: { label: "Habitat", workerRate: 0.1127, employerRate: 0.001 },
    planvital: { label: "PlanVital", workerRate: 0.1116, employerRate: 0.001 },
    provida: { label: "Provida", workerRate: 0.1145, employerRate: 0.001 },
    modelo: { label: "Modelo", workerRate: 0.1058, employerRate: 0.001 },
    uno: { label: "Uno", workerRate: 0.1046, employerRate: 0.001 },
  },
  unemployment: {
    indefinite: { label: "Plazo indefinido", employerRate: 0.024, workerRate: 0.006 },
    fixed: { label: "Plazo fijo", employerRate: 0.03, workerRate: 0 },
  },
  incomeTaxBrackets: [
    { from: 0, to: 13.5, rate: 0, rebate: 0 },
    { from: 13.5, to: 30, rate: 0.04, rebate: 0.54 },
    { from: 30, to: 50, rate: 0.08, rebate: 1.74 },
    { from: 50, to: 70, rate: 0.135, rebate: 4.49 },
    { from: 70, to: 90, rate: 0.23, rebate: 11.14 },
    { from: 90, to: 120, rate: 0.304, rebate: 17.8 },
    { from: 120, to: 150, rate: 0.35, rebate: 23.32 },
    { from: 150, to: Infinity, rate: 0.4, rebate: 30.82 },
  ],
};

const state = {
  employees: [],
  payrolls: [],
  certificates: [],
  selectedPayrollId: null,
  company: null,
  user: null,
  profile: null,
  remoteReady: false,
};

const els = {
  viewTitle: document.querySelector("#viewTitle"),
  navTabs: document.querySelectorAll(".nav-tab"),
  views: document.querySelectorAll(".view"),
  appNav: document.querySelector(".app-nav"),
  mobileNavToggle: document.querySelector("#mobileNavToggle"),
  storageStatus: document.querySelector("#storageStatus"),
  activeEmployeesMetric: document.querySelector("#activeEmployeesMetric"),
  monthlyPayrollMetric: document.querySelector("#monthlyPayrollMetric"),
  vacationDaysMetric: document.querySelector("#vacationDaysMetric"),
  lastPayrollMetric: document.querySelector("#lastPayrollMetric"),
  recentEmployeesTable: document.querySelector("#recentEmployeesTable"),
  operationalAlerts: document.querySelector("#operationalAlerts"),
  employeeForm: document.querySelector("#employeeForm"),
  employeeFormTitle: document.querySelector("#employeeFormTitle"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  employeeList: document.querySelector("#employeeList"),
  employeeSearch: document.querySelector("#employeeSearch"),
  payrollForm: document.querySelector("#payrollForm"),
  payrollEmployee: document.querySelector("#payrollEmployee"),
  payrollMonth: document.querySelector("#payrollMonth"),
  payrollTaxable: document.querySelector("#payrollTaxable"),
  payrollBonus: document.querySelector("#payrollBonus"),
  payrollOvertime: document.querySelector("#payrollOvertime"),
  payrollOvertimeHours: document.querySelector("#payrollOvertimeHours"),
  payrollOvertimeMultiplier: document.querySelector("#payrollOvertimeMultiplier"),
  calculateOvertimeBtn: document.querySelector("#calculateOvertimeBtn"),
  overtimeCalculationNote: document.querySelector("#overtimeCalculationNote"),
  payrollAdvance: document.querySelector("#payrollAdvance"),
  payrollLoan: document.querySelector("#payrollLoan"),
  payrollThirdParty: document.querySelector("#payrollThirdParty"),
  payrollList: document.querySelector("#payrollList"),
  payrollPreview: document.querySelector("#payrollPreview"),
  printPayrollBtn: document.querySelector("#printPayrollBtn"),
  certificateForm: document.querySelector("#certificateForm"),
  certificateId: document.querySelector("#certificateId"),
  certificateFormTitle: document.querySelector("#certificateFormTitle"),
  certificateEmployee: document.querySelector("#certificateEmployee"),
  certificatePreview: document.querySelector("#certificatePreview"),
  cancelCertificateEditBtn: document.querySelector("#cancelCertificateEditBtn"),
  printCertificateBtn: document.querySelector("#printCertificateBtn"),
  seedDataBtn: document.querySelector("#seedDataBtn"),
  exportDataBtn: document.querySelector("#exportDataBtn"),
  accountingMonth: document.querySelector("#accountingMonth"),
  accountingSummary: document.querySelector("#accountingSummary"),
  appShell: document.querySelector("#appShell"),
  loginScreen: document.querySelector("#loginScreen"),
  authBtn: document.querySelector("#authBtn"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authMessage: document.querySelector("#authMessage"),
  currentUser: document.querySelector("#currentUser"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
};

function localState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { employees: [], payrolls: [], certificates: [] };
  } catch {
    return { employees: [], payrolls: [], certificates: [] };
  }
}

function saveLocalState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      employees: state.employees,
      payrolls: state.payrolls,
      certificates: state.certificates,
    }),
  );
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function money(value) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function payrollMoney(value) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0));
}

function bankAccountTypeLabel(value) {
  return {
    corriente: "Cuenta corriente",
    vista: "Cuenta vista",
    "cuenta-rut": "Cuenta RUT",
  }[value] || "";
}

function readableDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "long" }).format(new Date(`${value}T12:00:00`));
}

function businessDaysBetween(start, end) {
  if (!start || !end) return 0;
  const current = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  if (Number.isNaN(current.getTime()) || Number.isNaN(last.getTime()) || current > last) return 0;
  let days = 0;
  while (current <= last) {
    const weekday = current.getDay();
    if (weekday !== 0 && weekday !== 6) days += 1;
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function monthLabel(value) {
  if (!value) return "Sin mes";
  const normalized = value.length === 7 ? `${value}-02` : value;
  return new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(new Date(`${normalized}T12:00:00`));
}

function monthDate(value) {
  return `${value}-01`;
}

function clearNode(node) {
  node.replaceChildren();
}

function emptyState() {
  return els.emptyStateTemplate.content.cloneNode(true);
}

function setStatus(message) {
  if (els.storageStatus) els.storageStatus.textContent = message;
}

function setAuthUi() {
  const signedIn = Boolean(state.user);
  const admin = isAdmin();
  els.loginScreen.classList.toggle("hidden", signedIn);
  els.appShell.classList.toggle("hidden", !signedIn);
  els.authBtn.textContent = signedIn ? "Salir" : "Ingresar";
  els.currentUser.textContent = signedIn ? `${state.user.email} · ${admin ? "Admin" : "Personal"}` : "Sin sesión";
  if (els.seedDataBtn) els.seedDataBtn.disabled = !admin;
  if (els.exportDataBtn) els.exportDataBtn.disabled = !signedIn;
  els.printCertificateBtn.disabled = !signedIn;
  els.printPayrollBtn.disabled = !signedIn;
  [els.employeeForm, els.payrollForm, els.certificateForm].forEach((form) => {
    form.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = !admin;
    });
  });
  els.navTabs.forEach((tab) => {
    const employeeOnlyHidden = !admin && ["employees", "accounting"].includes(tab.dataset.view);
    tab.hidden = employeeOnlyHidden;
  });
  document.querySelectorAll("[data-admin-only]").forEach((node) => {
    node.hidden = !admin;
  });
}

function clearRemoteState() {
  state.company = null;
  state.employees = [];
  state.payrolls = [];
  state.certificates = [];
  state.profile = null;
  state.remoteReady = false;
}

function requireSignedIn() {
  if (state.user) return true;
  alert("Inicia sesión para modificar los datos.");
  return false;
}

function isAdmin() {
  return state.profile?.role === "admin" || state.user?.email === ADMIN_EMAIL;
}

function requireAdmin() {
  if (isAdmin()) return true;
  alert("Solo el administrador puede modificar estos datos.");
  return false;
}

async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("user_profiles")
    .select("user_id, email, role, employee_id")
    .eq("user_id", state.user.id)
    .maybeSingle();

  if (error) {
    if (state.user.email === ADMIN_EMAIL) {
      state.profile = { user_id: state.user.id, email: state.user.email, role: "admin", employee_id: null };
      return;
    }
    throw error;
  }

  state.profile = data || {
    user_id: state.user.id,
    email: state.user.email,
    role: state.user.email === ADMIN_EMAIL ? "admin" : "employee",
    employee_id: null,
  };
}

function setView(view) {
  if (!state.user) return;
  if (!isAdmin() && view === "employees") view = "dashboard";
  if (!isAdmin() && view === "accounting") view = "dashboard";
  els.views.forEach((viewEl) => viewEl.classList.toggle("active", viewEl.id === `${view}View`));
  els.navTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  const activeView = document.querySelector(`#${view}View`);
  els.viewTitle.textContent = activeView?.dataset.title || "RRHH Central";
  els.appNav?.classList.remove("menu-open");
  els.mobileNavToggle?.setAttribute("aria-expanded", "false");
}

function activeEmployees() {
  return state.employees.filter((employee) => employee.status === "Activo");
}

function currentEmployeeId() {
  if (isAdmin()) return null;
  return state.profile?.employee_id || state.employees.find((employee) => employee.email && employee.email === state.user?.email)?.id || null;
}

function visibleEmployees() {
  const employeeId = currentEmployeeId();
  if (!isAdmin() && !employeeId) return [];
  return employeeId ? state.employees.filter((employee) => employee.id === employeeId) : state.employees;
}

function visiblePayrolls() {
  const employeeId = currentEmployeeId();
  if (!isAdmin() && !employeeId) return [];
  return employeeId ? state.payrolls.filter((payroll) => payroll.employeeId === employeeId) : state.payrolls;
}

function selectedPayrollEmployeeId() {
  return currentEmployeeId() || els.payrollEmployee.value || null;
}

function payrollsForSelectedEmployee() {
  const employeeId = selectedPayrollEmployeeId();
  return employeeId ? state.payrolls.filter((payroll) => payroll.employeeId === employeeId) : visiblePayrolls();
}

function dbEmployee(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.full_name,
    rut: row.rut,
    email: row.email || "",
    phone: row.phone || "",
    address: row.address || "",
    bankName: row.bank_name || "",
    bankAccountType: row.bank_account_type || "",
    bankAccountNumber: row.bank_account_number || "",
    afp: row.afp_code || "modelo",
    healthProvider: row.health_provider || "fonasa",
    healthPlanAmount: Number(row.health_plan_amount || 0),
    contractType: row.contract_type || "indefinite",
    contractEndDate: row.contract_end_date || "",
    transportAllowance: Number(row.transport_allowance || 0),
    mealAllowance: Number(row.meal_allowance || 0),
    emergencyName: row.emergency_contact_name || "",
    emergencyRelationship: row.emergency_contact_relationship || "",
    emergencyPhone: row.emergency_contact_phone || "",
    role: row.position,
    department: row.department,
    startDate: row.start_date,
    salary: Number(row.base_salary || 0),
    vacationDays: Number(row.vacation_days || 0),
    status: row.status,
  };
}

function toEmployeeRow(employee) {
  return {
    company_id: employee.companyId || state.company?.id || null,
    full_name: employee.name,
    rut: employee.rut,
    email: employee.email || null,
    phone: employee.phone || null,
    address: employee.address || null,
    bank_name: employee.bankName || null,
    bank_account_type: employee.bankAccountType || null,
    bank_account_number: employee.bankAccountNumber || null,
    afp_code: employee.afp || "modelo",
    health_provider: employee.healthProvider || "fonasa",
    health_plan_amount: employee.healthPlanAmount || 0,
    contract_type: employee.contractType || "indefinite",
    contract_end_date: employee.contractType === "fixed" ? employee.contractEndDate || null : null,
    transport_allowance: employee.transportAllowance || 0,
    meal_allowance: employee.mealAllowance || 0,
    emergency_contact_name: employee.emergencyName || null,
    emergency_contact_relationship: employee.emergencyRelationship || null,
    emergency_contact_phone: employee.emergencyPhone || null,
    position: employee.role,
    department: employee.department,
    start_date: employee.startDate,
    base_salary: employee.salary,
    vacation_days: employee.vacationDays,
    status: employee.status,
  };
}

function toLegacyEmployeeRow(employee) {
  return {
    company_id: employee.companyId || state.company?.id || null,
    full_name: employee.name,
    rut: employee.rut,
    email: employee.email || null,
    phone: employee.phone || null,
    position: employee.role,
    department: employee.department,
    start_date: employee.startDate,
    base_salary: employee.salary,
    vacation_days: employee.vacationDays,
    status: employee.status,
  };
}

function dbPayroll(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    month: row.period_month?.slice(0, 7),
    taxable: Number(row.taxable_income || 0),
    nonTaxable: Number(row.non_taxable_income || 0),
    otherDeductions: Number(row.other_deductions || 0),
    workedDays: Number(row.worked_days || 0),
    pension: Number(row.pension_deduction || 0),
    health: Number(row.health_deduction || 0),
    unemployment: Number(row.unemployment_deduction || 0),
    totalDeductions: Number(row.total_deductions || 0),
    grossPay: Number(row.gross_pay || 0),
    netPay: Number(row.net_pay || 0),
    bonus: Number(row.bonus_special || 0),
    overtime: Number(row.overtime_pay || 0),
    familyAllowance: Number(row.family_allowance || 0),
    transport: Number(row.transport_allowance || 0),
    meal: Number(row.meal_allowance || 0),
    advance: Number(row.advance_payment || 0),
    loan: Number(row.loan_deduction || 0),
    thirdParty: Number(row.third_party_deduction || 0),
    afp: row.afp_code || "modelo",
    healthProvider: row.health_provider || "fonasa",
    healthPlanAmount: Number(row.health_plan_amount || 0),
    contractType: row.contract_type || "indefinite",
    employerSis: Number(row.employer_sis || 0),
    employerUnemployment: Number(row.employer_unemployment || 0),
    employerAfp: Number(row.employer_afp || 0),
    employerSocialSecurity: Number(row.employer_social_security || 0),
    employerTotal: Number(row.employer_total || 0),
    createdAt: row.created_at,
  };
}

function toPayrollRow(payroll) {
  return {
    employee_id: payroll.employeeId,
    period_month: monthDate(payroll.month),
    taxable_income: payroll.taxable,
    non_taxable_income: payroll.nonTaxable,
    other_deductions: payroll.otherDeductions,
    worked_days: payroll.workedDays,
    pension_deduction: payroll.pension,
    health_deduction: payroll.health,
    unemployment_deduction: payroll.unemployment,
    total_deductions: payroll.totalDeductions,
    gross_pay: payroll.grossPay,
    net_pay: payroll.netPay,
    bonus_special: payroll.bonus,
    overtime_pay: payroll.overtime,
    family_allowance: payroll.familyAllowance,
    transport_allowance: payroll.transport,
    meal_allowance: payroll.meal,
    advance_payment: payroll.advance,
    loan_deduction: payroll.loan,
    third_party_deduction: payroll.thirdParty,
    afp_code: payroll.afp,
    health_provider: payroll.healthProvider,
    health_plan_amount: payroll.healthPlanAmount,
    contract_type: payroll.contractType,
    employer_sis: payroll.employerSis,
    employer_unemployment: payroll.employerUnemployment,
    employer_afp: payroll.employerAfp,
    employer_social_security: payroll.employerSocialSecurity,
    employer_total: payroll.employerTotal,
  };
}

function toLegacyPayrollRow(payroll) {
  return {
    employee_id: payroll.employeeId,
    period_month: monthDate(payroll.month),
    taxable_income: payroll.taxable,
    non_taxable_income: payroll.nonTaxable,
    other_deductions: payroll.totalOtherDeductions || payroll.otherDeductions,
    worked_days: payroll.workedDays,
    pension_deduction: payroll.pension,
    health_deduction: payroll.health,
    unemployment_deduction: payroll.unemployment,
    total_deductions: payroll.totalDeductions,
    gross_pay: payroll.grossPay,
    net_pay: payroll.netPay,
  };
}

function dbCertificate(row) {
  return {
    id: row.id,
    type: row.type,
    employeeId: row.employee_id,
    start: row.start_date,
    end: row.end_date,
    notes: row.notes || "",
    createdAt: row.issued_at,
  };
}

function toCertificateRow(certificate) {
  return {
    employee_id: certificate.employeeId,
    type: certificate.type,
    start_date: certificate.start,
    end_date: certificate.end,
    notes: certificate.notes,
  };
}

async function loadRemoteState() {
  if (!supabaseClient) throw new Error("Supabase no está disponible.");
  await loadProfile();

  const [{ data: companies, error: companyError }, { data: employees, error: employeeError }, { data: payrolls, error: payrollError }, { data: certificates, error: certificateError }] =
    await Promise.all([
      supabaseClient.from("companies").select("*").order("created_at", { ascending: true }).limit(1),
      supabaseClient.from("employees").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("payrolls").select("*").order("created_at", { ascending: false }),
      supabaseClient.from("certificates").select("*").order("issued_at", { ascending: false }),
    ]);

  const error = companyError || employeeError || payrollError || certificateError;
  if (error) throw error;

  state.company = companies?.[0] || null;
  state.employees = (employees || []).map(dbEmployee);
  state.payrolls = (payrolls || []).map(dbPayroll);
  state.certificates = (certificates || []).map(dbCertificate);
  state.remoteReady = true;
  setStatus(`Conectado a Supabase · ${isAdmin() ? "Administrador" : "Portal personal"}${state.company ? ` · ${state.company.name}` : ""}`);
}

function loadFallbackState(error) {
  console.error("No se pudo conectar con Supabase:", error);
  const fallback = localState();
  state.employees = fallback.employees || [];
  state.payrolls = fallback.payrolls || [];
  state.certificates = fallback.certificates || [];
  state.remoteReady = false;
  setStatus("Usando respaldo local. Revisa RLS o conexión.");
}

function renderAll() {
  setAuthUi();
  renderMetrics();
  renderRecentEmployees();
  renderOperationalAlerts();
  renderEmployeeList();
  renderEmployeeOptions();
  renderPayrollDefaults();
  renderPayrolls();
  renderCertificates();
  renderAccountingSummary();
  saveLocalState();
}

function renderMetrics() {
  const employeeScope = visibleEmployees();
  const active = employeeScope.filter((employee) => employee.status === "Activo");
  const totalSalary = active.reduce((sum, employee) => sum + Number(employee.salary || 0), 0);
  const vacationDays = active.reduce((sum, employee) => sum + Number(employee.vacationDays || 0), 0);
  const lastPayroll = visiblePayrolls()[0];

  els.activeEmployeesMetric.textContent = active.length;
  els.monthlyPayrollMetric.textContent = money(totalSalary);
  els.vacationDaysMetric.textContent = vacationDays.toLocaleString("es-CL");
  els.lastPayrollMetric.textContent = lastPayroll ? monthLabel(lastPayroll.month) : "Sin registros";
}

function renderRecentEmployees() {
  clearNode(els.recentEmployeesTable);
  const employees = isAdmin() ? state.employees.slice(0, 5) : visibleEmployees().slice(0, 1);

  if (!employees.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.append(emptyState());
    row.append(cell);
    els.recentEmployeesTable.append(row);
    return;
  }

  employees.forEach((employee) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${employee.name}</td>
      <td>${employee.role}</td>
      <td>${employee.department}</td>
      <td><span class="status-pill ${employee.status === "Activo" ? "" : "off"}">${employee.status}</span></td>
    `;
    els.recentEmployeesTable.append(row);
  });
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function daysFromToday(value) {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T12:00:00`);
  return Math.ceil((target - today) / 86400000);
}

function incompleteEmployeeFields(employee) {
  return [
    ["email", employee.email],
    ["telefono", employee.phone],
    ["dirección", employee.address],
    ["banco", employee.bankName],
    ["tipo de cuenta", employee.bankAccountType],
    ["número de cuenta", employee.bankAccountNumber],
    ["AFP", employee.afp],
    ["salud", employee.healthProvider],
    ["contacto emergencia", employee.emergencyName],
    ["fono emergencia", employee.emergencyPhone],
  ]
    .filter(([, value]) => !value)
    .map(([label]) => label);
}

function renderOperationalAlerts() {
  if (!els.operationalAlerts) return;
  clearNode(els.operationalAlerts);
  const employees = visibleEmployees();
  const active = employees.filter((employee) => employee.status === "Activo");
  const month = currentMonthKey();
  const payrollEmployeeIds = new Set(visiblePayrolls().filter((payroll) => payroll.month === month).map((payroll) => payroll.employeeId));
  const missingPayrolls = active.filter((employee) => !payrollEmployeeIds.has(employee.id));
  const expiringContracts = employees
    .filter((employee) => employee.contractType === "fixed" && employee.contractEndDate)
    .map((employee) => ({ employee, days: daysFromToday(employee.contractEndDate) }))
    .filter((item) => item.days !== null && item.days >= 0 && item.days <= 45)
    .sort((a, b) => a.days - b.days);
  const incompleteProfiles = employees
    .map((employee) => ({ employee, fields: incompleteEmployeeFields(employee) }))
    .filter((item) => item.fields.length > 0);
  const lowVacations = active.filter((employee) => Number(employee.vacationDays || 0) <= 5);

  const cards = [
    {
      title: "Liquidaciones del mes",
      value: missingPayrolls.length,
      detail: missingPayrolls.length ? `${missingPayrolls.length} trabajador(es) sin liquidacion de ${monthLabel(month)}` : `Todas emitidas para ${monthLabel(month)}`,
      action: "payroll",
      tone: missingPayrolls.length ? "warn" : "ok",
      items: missingPayrolls.slice(0, 3).map((employee) => employee.name),
    },
    {
      title: "Contratos por vencer",
      value: expiringContracts.length,
      detail: expiringContracts.length ? "Plazo fijo dentro de los proximos 45 dias" : "Sin vencimientos cercanos",
      action: "employees",
      tone: expiringContracts.length ? "warn" : "ok",
      items: expiringContracts.slice(0, 3).map(({ employee, days }) => `${employee.name} · ${days} dia(s)`),
    },
    {
      title: "Fichas incompletas",
      value: incompleteProfiles.length,
      detail: incompleteProfiles.length ? "Faltan datos utiles para documentos y portal" : "Fichas principales completas",
      action: "employees",
      tone: incompleteProfiles.length ? "info" : "ok",
      items: incompleteProfiles.slice(0, 3).map(({ employee, fields }) => `${employee.name} · ${fields.slice(0, 2).join(", ")}`),
    },
    {
      title: "Vacaciones bajas",
      value: lowVacations.length,
      detail: lowVacations.length ? "Saldos iguales o menores a 5 dias" : "Sin saldos criticos",
      action: "certificates",
      tone: lowVacations.length ? "info" : "ok",
      items: lowVacations.slice(0, 3).map((employee) => `${employee.name} · ${Number(employee.vacationDays || 0).toLocaleString("es-CL")} dia(s)`),
    },
  ];

  cards.forEach((card) => {
    const item = document.createElement("article");
    item.className = `operation-card ${card.tone}`;
    item.innerHTML = `
      <div>
        <span class="operation-label">${card.title}</span>
        <strong>${card.value}</strong>
        <p>${card.detail}</p>
      </div>
      ${
        card.items.length
          ? `<ul>${card.items.map((entry) => `<li>${entry}</li>`).join("")}</ul>`
          : `<span class="operation-empty">Sin acciones pendientes</span>`
      }
      <button class="text-button subtle" type="button" data-jump="${card.action}">Revisar</button>
    `;
    els.operationalAlerts.append(item);
  });
}

function renderEmployeeList() {
  clearNode(els.employeeList);
  const query = els.employeeSearch.value.trim().toLowerCase();
  const employees = visibleEmployees().filter((employee) => {
    return [employee.name, employee.rut, employee.email, employee.phone, employee.address, employee.bankName, employee.bankAccountType, employee.bankAccountNumber, employee.afp, employee.healthProvider, employee.role, employee.department, employee.status]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  if (!employees.length) {
    els.employeeList.append(emptyState());
    return;
  }

  employees.forEach((employee) => {
    const item = document.createElement("article");
    item.className = "employee-item";
    const contact = [employee.email, employee.phone].filter(Boolean).join(" · ");
    const address = employee.address ? `${employee.address}<br>` : "";
    const bank = [employee.bankName, bankAccountTypeLabel(employee.bankAccountType), employee.bankAccountNumber].filter(Boolean).join(" · ");
    const afp = PAYROLL_INDICATORS.afp[employee.afp]?.label || "Modelo";
    const health = employee.healthProvider === "isapre" ? `ISAPRE${employee.healthPlanAmount ? ` ${money(employee.healthPlanAmount)}` : ""}` : "FONASA";
    const contract = employee.contractType === "fixed" ? `Plazo fijo hasta ${readableDate(employee.contractEndDate)}` : "Plazo indefinido";
    const employeeCertificates = state.certificates.filter((certificate) => certificate.employeeId === employee.id);
    const employeePayrolls = state.payrolls.filter((payroll) => payroll.employeeId === employee.id);
    const certificateHistory = employeeCertificates.length
      ? `
        <details class="employee-history">
          <summary>Historial de certificados · ${employeeCertificates.length}</summary>
          <div class="history-list">
            ${employeeCertificates
              .slice(0, 5)
              .map(
                (certificate) => `
                  <button class="history-item" type="button" data-view-certificate="${certificate.id}">
                    <span>${certificate.type === "vacaciones" ? "Vacaciones" : "Permiso"}</span>
                    <small>${readableDate(certificate.start)} al ${readableDate(certificate.end)}${certificate.type === "vacaciones" ? ` · ${certificate.days || businessDaysBetween(certificate.start, certificate.end)} día(s)` : ""}</small>
                  </button>
                `,
              )
              .join("")}
          </div>
        </details>
      `
      : `<span class="employee-history-empty">Sin certificados guardados</span>`;
    const payrollHistory = employeePayrolls.length
      ? `
        <details class="employee-history">
          <summary>Historial de liquidaciones · ${employeePayrolls.length}</summary>
          <div class="history-list">
            ${employeePayrolls
              .slice(0, 5)
              .map(
                (payroll) => `
                  <button class="history-item" type="button" data-view-payroll="${payroll.id}">
                    <span>${monthLabel(payroll.month)}</span>
                    <small>Líquido ${money(payroll.netPay)} · Imponible ${money(payroll.totalTaxable || payroll.taxable)}</small>
                  </button>
                `,
              )
              .join("")}
          </div>
        </details>
      `
      : `<span class="employee-history-empty">Sin liquidaciones guardadas</span>`;
    item.innerHTML = `
      <div>
        <span class="employee-name">${employee.name}</span>
        <span class="employee-meta">${employee.rut} · ${employee.role} · ${employee.department}<br>${contact ? `${contact}<br>` : ""}${address}${bank ? `Depósito: ${bank}<br>` : ""}${afp} · ${health} · ${contract}<br>${money(employee.salary)} · Vacaciones ${Number(employee.vacationDays || 0).toLocaleString("es-CL")} día(s) · Locomoción ${money(employee.transportAllowance)} · Colación ${money(employee.mealAllowance)}</span>
        ${payrollHistory}
        ${certificateHistory}
      </div>
      <div class="item-actions" ${isAdmin() ? "" : "hidden"}>
        <button class="mini-button" type="button" title="Editar" aria-label="Editar ${employee.name}" data-edit="${employee.id}">✎</button>
        <button class="mini-button danger" type="button" title="Eliminar" aria-label="Eliminar ${employee.name}" data-delete="${employee.id}">×</button>
      </div>
    `;
    els.employeeList.append(item);
  });
}

function renderEmployeeOptions() {
  [els.payrollEmployee, els.certificateEmployee].forEach((select) => {
    const previousValue = select.value;
    const employees = visibleEmployees();
    clearNode(select);
    if (!employees.length) {
      const option = new Option("Agrega un empleado primero", "", true, true);
      option.disabled = true;
      select.append(option);
      return;
    }

    employees.forEach((employee) => {
      select.append(new Option(`${employee.name} · ${employee.role}`, employee.id));
    });
    if (previousValue) select.value = previousValue;
  });
}

function renderPayrollDefaults() {
  const employees = visibleEmployees();
  const employee = employees.find((item) => item.id === els.payrollEmployee.value) || employees[0];
  if (!employee) return;
  if (!els.payrollTaxable.value || Number(els.payrollTaxable.value) === 0) {
    els.payrollTaxable.value = employee.salary;
  }
  if (!els.payrollMonth.value) {
    els.payrollMonth.value = new Date().toISOString().slice(0, 7);
  }
  renderOvertimeNote();
}

function safeAmount(selector) {
  return Number(document.querySelector(selector)?.value || 0);
}

function selectedPayrollEmployee() {
  const employees = visibleEmployees();
  return employees.find((item) => item.id === els.payrollEmployee.value) || employees[0] || null;
}

function overtimeAmount(employee, hours, multiplier) {
  const baseSalary = Number(els.payrollTaxable.value || employee?.salary || 0);
  const hourlyRate = baseSalary / 180;
  return Math.round(hourlyRate * Number(hours || 0) * Number(multiplier || 1.5));
}

function renderOvertimeNote() {
  if (!els.overtimeCalculationNote) return;
  const employee = selectedPayrollEmployee();
  const baseSalary = Number(els.payrollTaxable.value || employee?.salary || 0);
  const hourlyRate = Math.round(baseSalary / 180);
  els.overtimeCalculationNote.textContent = `Valor hora base estimado: ${money(hourlyRate)}. Se calcula sobre sueldo base / 180 horas.`;
}

function applyOvertimeCalculation() {
  const employee = selectedPayrollEmployee();
  if (!employee) return;
  const amount = overtimeAmount(employee, els.payrollOvertimeHours.value, els.payrollOvertimeMultiplier.value);
  els.payrollOvertime.value = amount;
  renderOvertimeNote();
}

function calculateIncomeTax(taxableBase) {
  const taxableUtm = taxableBase / PAYROLL_INDICATORS.utm;
  const bracket = PAYROLL_INDICATORS.incomeTaxBrackets.find((item) => taxableUtm > item.from && taxableUtm <= item.to);
  if (!bracket || bracket.rate === 0) return 0;
  return Math.max(Math.round((taxableUtm * bracket.rate - bracket.rebate) * PAYROLL_INDICATORS.utm), 0);
}

function renderPayrolls() {
  clearNode(els.payrollList);
  const payrolls = payrollsForSelectedEmployee();
  if (!payrolls.length) {
    els.payrollList.append(emptyState());
    els.printPayrollBtn.disabled = true;
    state.selectedPayrollId = null;
    els.payrollPreview.innerHTML = `<p class="muted">No hay liquidaciones emitidas para este empleado.</p>`;
    delete els.payrollPreview.dataset.payrollId;
    return;
  }

  const selectedPayroll = payrolls.find((payroll) => payroll.id === state.selectedPayrollId) || payrolls[0];
  state.selectedPayrollId = selectedPayroll.id;
  els.printPayrollBtn.disabled = !state.user;
  els.printPayrollBtn.textContent = "Imprimir seleccionada";
  if (!els.payrollPreview.querySelector(".payroll-document") || els.payrollPreview.dataset.payrollId !== selectedPayroll.id) {
    els.payrollPreview.innerHTML = payrollDocument(selectedPayroll);
    els.payrollPreview.dataset.payrollId = selectedPayroll.id;
  }

  payrolls.forEach((payroll) => {
    const employee = state.employees.find((item) => item.id === payroll.employeeId);
    const item = document.createElement("article");
    item.className = `record-item ${payroll.id === state.selectedPayrollId ? "selected" : ""}`;
    item.innerHTML = `
      <div>
        <span class="record-title">${employee?.name || "Empleado eliminado"} · ${monthLabel(payroll.month)}</span>
        <span class="record-meta">Líquido a pago: ${money(payroll.netPay)} · Descuentos: ${money(payroll.totalDeductions)}</span>
      </div>
      <div class="item-actions">
        <button class="mini-button" type="button" title="Ver" aria-label="Ver liquidación" data-view-payroll="${payroll.id}">▤</button>
        <button class="mini-button" type="button" title="Imprimir" aria-label="Imprimir liquidación" data-print-payroll="${payroll.id}">⇩</button>
        <button class="mini-button danger" type="button" title="Eliminar" aria-label="Eliminar liquidación" data-delete-payroll="${payroll.id}" ${isAdmin() ? "" : "hidden"}>×</button>
      </div>
    `;
    els.payrollList.append(item);
  });
}

function payrollValue(payroll, key) {
  const calculated = calculatePayroll(payroll);
  return Number(payroll[key] ?? calculated[key] ?? 0);
}

function renderAccountingSummary() {
  if (!els.accountingSummary) return;
  if (!els.accountingMonth.value) els.accountingMonth.value = currentMonthKey();
  const month = els.accountingMonth.value;
  const payrolls = visiblePayrolls().filter((payroll) => payroll.month === month);
  const summary = payrolls.reduce(
    (totals, payroll) => {
      const calculated = calculatePayroll(payroll);
      totals.taxable += Number(payroll.totalTaxable ?? calculated.totalTaxable ?? payroll.taxable ?? 0);
      totals.nonTaxable += Number(payroll.nonTaxable ?? calculated.nonTaxable ?? 0);
      totals.personalContributions += Number(payroll.pension ?? calculated.pension ?? 0) + Number(payroll.health ?? calculated.health ?? 0) + Number(payroll.unemployment ?? calculated.unemployment ?? 0);
      totals.incomeTax += Number(payroll.incomeTax ?? calculated.incomeTax ?? 0);
      totals.otherDeductions += Number(payroll.totalOtherDeductions ?? calculated.totalOtherDeductions ?? 0);
      totals.employerContributions += Number(payroll.employerTotal ?? calculated.employerTotal ?? 0);
      totals.netPay += Number(payroll.netPay ?? calculated.netPay ?? 0);
      return totals;
    },
    { taxable: 0, nonTaxable: 0, personalContributions: 0, incomeTax: 0, otherDeductions: 0, employerContributions: 0, netPay: 0 },
  );

  const rows = [
    ["Bruto imponible", summary.taxable],
    ["Total no imponible", summary.nonTaxable],
    ["Descuento imposiciones personal", summary.personalContributions],
    ["Impuesto único", summary.incomeTax],
    ["Otros descuentos", summary.otherDeductions],
    ["Aportes del empleador", summary.employerContributions],
    ["Total líquido pagado", summary.netPay],
  ];

  els.accountingSummary.innerHTML = `
    <div class="accounting-total">
      <span>${monthLabel(month)}</span>
      <strong>${money(summary.netPay)}</strong>
      <small>${payrolls.length} liquidación(es) consideradas</small>
    </div>
    <div class="accounting-grid">
      ${rows
        .map(
          ([label, value]) => `
            <article class="accounting-card">
              <span>${label}</span>
              <strong>${money(value)}</strong>
            </article>
          `,
        )
        .join("")}
    </div>
    ${
      payrolls.length
        ? `<div class="table-wrap accounting-table">
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Imponible</th>
                  <th>No imponible</th>
                  <th>Imposiciones</th>
                  <th>Aporte empleador</th>
                  <th>Líquido</th>
                </tr>
              </thead>
              <tbody>
                ${payrolls
                  .map((payroll) => {
                    const employee = state.employees.find((item) => item.id === payroll.employeeId);
                    const calculated = calculatePayroll(payroll);
                    const personal = Number(payroll.pension ?? calculated.pension ?? 0) + Number(payroll.health ?? calculated.health ?? 0) + Number(payroll.unemployment ?? calculated.unemployment ?? 0);
                    return `
                      <tr>
                        <td>${employee?.name || "Empleado eliminado"}</td>
                        <td>${money(payroll.totalTaxable ?? calculated.totalTaxable ?? payroll.taxable)}</td>
                        <td>${money(payroll.nonTaxable ?? calculated.nonTaxable)}</td>
                        <td>${money(personal)}</td>
                        <td>${money(payroll.employerTotal ?? calculated.employerTotal)}</td>
                        <td>${money(payroll.netPay ?? calculated.netPay)}</td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>`
        : `<div class="empty-state"><strong>Sin liquidaciones para este mes</strong><span>Genera liquidaciones para completar el resumen contable.</span></div>`
    }
  `;
}

function renderCertificates() {
  if (!state.certificates.length) {
    els.certificatePreview.innerHTML = `<p class="muted">No hay certificados emitidos todavía.</p>`;
    return;
  }

  els.certificatePreview.innerHTML = `
    <div class="records-list">
      ${state.certificates
        .map((certificate) => {
          const employee = state.employees.find((item) => item.id === certificate.employeeId);
          return `
            <article class="record-item">
              <div>
                <span class="record-title">${certificate.type === "vacaciones" ? "Certificado de vacaciones" : "Certificado de permiso"}</span>
                <span class="record-meta">${employee?.name || "Empleado"} · ${readableDate(certificate.start)} al ${readableDate(certificate.end)}</span>
              </div>
              <div class="item-actions">
                <button class="mini-button" type="button" title="Ver" aria-label="Ver certificado" data-view-certificate="${certificate.id}">▤</button>
                <button class="mini-button" type="button" title="Editar" aria-label="Editar certificado" data-edit-certificate="${certificate.id}" ${isAdmin() ? "" : "hidden"}>✎</button>
                <button class="mini-button danger" type="button" title="Eliminar" aria-label="Eliminar certificado" data-delete-certificate="${certificate.id}" ${isAdmin() ? "" : "hidden"}>×</button>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function showCertificate(id) {
  const certificate = state.certificates.find((item) => item.id === id);
  if (!certificate) return;
  els.certificatePreview.innerHTML = certificateDocument(certificate);
  setView("certificates");
}

function certificateVacationDays(certificate) {
  return certificate?.type === "vacaciones" ? Number(certificate.days || businessDaysBetween(certificate.start, certificate.end) || 0) : 0;
}

async function saveEmployeeVacationBalance(employee, vacationDays) {
  const updatedEmployee = { ...employee, vacationDays: Math.max(Number(vacationDays || 0), 0) };
  const persistedEmployee = await persistEmployee(updatedEmployee);
  const index = state.employees.findIndex((item) => item.id === employee.id);
  if (index >= 0) state.employees[index] = persistedEmployee;
  return persistedEmployee;
}

function resetCertificateForm() {
  els.certificateForm.reset();
  els.certificateId.value = "";
  els.certificateFormTitle.textContent = "Nuevo certificado";
  els.cancelCertificateEditBtn.classList.add("hidden");
}

function editCertificate(id) {
  const certificate = state.certificates.find((item) => item.id === id);
  if (!certificate) return;
  els.certificateId.value = certificate.id;
  document.querySelector("#certificateType").value = certificate.type;
  els.certificateEmployee.value = certificate.employeeId;
  document.querySelector("#certificateStart").value = certificate.start;
  document.querySelector("#certificateEnd").value = certificate.end;
  document.querySelector("#certificateNotes").value = certificate.notes || "";
  els.certificateFormTitle.textContent = "Editar certificado";
  els.cancelCertificateEditBtn.classList.remove("hidden");
  els.certificatePreview.innerHTML = certificateDocument(certificate);
  setView("certificates");
}

async function deleteCertificate(id) {
  if (!requireSignedIn() || !requireAdmin()) return;
  const certificate = state.certificates.find((item) => item.id === id);
  if (!certificate) return;
  const employee = state.employees.find((item) => item.id === certificate.employeeId);
  const confirmed = window.confirm("¿Eliminar este certificado del historial del empleado?");
  if (!confirmed) return;

  try {
    if (employee) {
      await saveEmployeeVacationBalance(employee, Number(employee.vacationDays || 0) + certificateVacationDays(certificate));
    }
    if (state.remoteReady) {
      const { error } = await supabaseClient.from("certificates").delete().eq("id", id);
      if (error) throw error;
    }
    state.certificates = state.certificates.filter((item) => item.id !== id);
    resetCertificateForm();
    renderAll();
    setView("employees");
  } catch (error) {
    alert(`No se pudo eliminar el certificado: ${error.message}`);
  }
}

async function persistEmployee(employee) {
  if (!state.remoteReady) return employee;
  let { data, error } = await supabaseClient.from("employees").update(toEmployeeRow(employee)).eq("id", employee.id).select().single();
  if (error && /column|schema cache/i.test(error.message || "")) {
    ({ data, error } = await supabaseClient.from("employees").update(toLegacyEmployeeRow(employee)).eq("id", employee.id).select().single());
  }
  if (error) throw error;
  const savedEmployee = dbEmployee(data);
  return {
    ...employee,
    ...savedEmployee,
    address: savedEmployee.address || employee.address,
    bankName: savedEmployee.bankName || employee.bankName,
    bankAccountType: savedEmployee.bankAccountType || employee.bankAccountType,
    bankAccountNumber: savedEmployee.bankAccountNumber || employee.bankAccountNumber,
  };
}

async function submitEmployee(event) {
  event.preventDefault();
  if (!requireSignedIn() || !requireAdmin()) return;
  const form = new FormData(els.employeeForm);
  const id = document.querySelector("#employeeId").value;
  const accountPassword = form.get("accountPassword")?.trim();
  const employee = {
    id: id || uid("emp"),
    companyId: state.company?.id || null,
    name: form.get("name").trim(),
    rut: form.get("rut").trim(),
    email: form.get("email").trim(),
    phone: form.get("phone").trim(),
    address: form.get("address").trim(),
    bankName: form.get("bankName").trim(),
    bankAccountType: form.get("bankAccountType"),
    bankAccountNumber: form.get("bankAccountNumber").trim(),
    afp: form.get("afp"),
    healthProvider: form.get("healthProvider"),
    healthPlanAmount: Number(form.get("healthPlanAmount")),
    contractType: form.get("contractType"),
    contractEndDate: form.get("contractEndDate"),
    transportAllowance: Number(form.get("transportAllowance")),
    mealAllowance: Number(form.get("mealAllowance")),
    emergencyName: form.get("emergencyName").trim(),
    emergencyRelationship: form.get("emergencyRelationship").trim(),
    emergencyPhone: form.get("emergencyPhone").trim(),
    role: form.get("role").trim(),
    department: form.get("department").trim(),
    startDate: form.get("startDate"),
    salary: Number(form.get("salary")),
    vacationDays: Number(form.get("vacationDays")),
    status: form.get("status"),
  };

  try {
    if (state.remoteReady) {
      let query = id
        ? supabaseClient.from("employees").update(toEmployeeRow(employee)).eq("id", id).select().single()
        : supabaseClient.from("employees").insert(toEmployeeRow(employee)).select().single();
      let { data, error } = await query;
      if (error && /column|schema cache/i.test(error.message || "")) {
        query = id
          ? supabaseClient.from("employees").update(toLegacyEmployeeRow(employee)).eq("id", id).select().single()
          : supabaseClient.from("employees").insert(toLegacyEmployeeRow(employee)).select().single();
        ({ data, error } = await query);
      }
      if (error) throw error;
      employee.id = data.id;
      employee.companyId = data.company_id;
    }

    const index = state.employees.findIndex((item) => item.id === employee.id);
    if (index >= 0) {
      state.employees[index] = employee;
    } else {
      state.employees.unshift(employee);
    }

    resetEmployeeForm();
    renderAll();
    if (accountPassword && state.remoteReady) {
      try {
        await createEmployeeAccess(employee, accountPassword);
      } catch (accessError) {
        alert(`Empleado guardado, pero no se pudo crear su acceso: ${accessError.message}`);
      }
    }
  } catch (error) {
    alert(`No se pudo guardar el empleado: ${error.message}`);
  }
}

function editEmployee(id) {
  const employee = state.employees.find((item) => item.id === id);
  if (!employee) return;

  document.querySelector("#employeeId").value = employee.id;
  document.querySelector("#employeeName").value = employee.name;
  document.querySelector("#employeeRut").value = employee.rut;
  document.querySelector("#employeeEmail").value = employee.email || "";
  document.querySelector("#employeePhone").value = employee.phone || "";
  document.querySelector("#employeeAddress").value = employee.address || "";
  document.querySelector("#employeeBankName").value = employee.bankName || "";
  document.querySelector("#employeeBankAccountType").value = employee.bankAccountType || "";
  document.querySelector("#employeeBankAccountNumber").value = employee.bankAccountNumber || "";
  document.querySelector("#employeeAfp").value = employee.afp || "modelo";
  document.querySelector("#employeeHealthProvider").value = employee.healthProvider || "fonasa";
  document.querySelector("#employeeHealthPlanAmount").value = employee.healthPlanAmount || 0;
  document.querySelector("#employeeContractType").value = employee.contractType || "indefinite";
  document.querySelector("#employeeContractEndDate").value = employee.contractEndDate || "";
  document.querySelector("#employeeTransportAllowance").value = employee.transportAllowance || 0;
  document.querySelector("#employeeMealAllowance").value = employee.mealAllowance || 0;
  document.querySelector("#employeeEmergencyName").value = employee.emergencyName || "";
  document.querySelector("#employeeEmergencyRelationship").value = employee.emergencyRelationship || "";
  document.querySelector("#employeeEmergencyPhone").value = employee.emergencyPhone || "";
  document.querySelector("#employeeRole").value = employee.role;
  document.querySelector("#employeeDepartment").value = employee.department;
  document.querySelector("#employeeStartDate").value = employee.startDate;
  document.querySelector("#employeeSalary").value = employee.salary;
  document.querySelector("#employeeVacationDays").value = employee.vacationDays;
  document.querySelector("#employeeStatus").value = employee.status;
  els.employeeFormTitle.textContent = "Editar empleado";
  els.cancelEditBtn.classList.remove("hidden");
}

async function deleteEmployee(id) {
  if (!requireSignedIn() || !requireAdmin()) return;
  const employee = state.employees.find((item) => item.id === id);
  if (!employee) return;
  const confirmed = window.confirm(`¿Eliminar a ${employee.name}? También se eliminarán sus registros relacionados.`);
  if (!confirmed) return;

  try {
    if (state.remoteReady) {
      const { error } = await supabaseClient.from("employees").delete().eq("id", id);
      if (error) throw error;
    }
    state.employees = state.employees.filter((item) => item.id !== id);
    state.payrolls = state.payrolls.filter((item) => item.employeeId !== id);
    state.certificates = state.certificates.filter((item) => item.employeeId !== id);
    renderAll();
  } catch (error) {
    alert(`No se pudo eliminar el empleado: ${error.message}`);
  }
}

function resetEmployeeForm() {
  els.employeeForm.reset();
  document.querySelector("#employeeId").value = "";
  document.querySelector("#employeeAfp").value = "modelo";
  document.querySelector("#employeeHealthProvider").value = "fonasa";
  document.querySelector("#employeeHealthPlanAmount").value = 0;
  document.querySelector("#employeeAddress").value = "";
  document.querySelector("#employeeBankName").value = "";
  document.querySelector("#employeeBankAccountType").value = "";
  document.querySelector("#employeeBankAccountNumber").value = "";
  document.querySelector("#employeeContractType").value = "indefinite";
  document.querySelector("#employeeContractEndDate").value = "";
  document.querySelector("#employeeTransportAllowance").value = 0;
  document.querySelector("#employeeMealAllowance").value = 0;
  document.querySelector("#employeeVacationDays").value = 15;
  document.querySelector("#employeeStatus").value = "Activo";
  els.employeeFormTitle.textContent = "Nuevo empleado";
  els.cancelEditBtn.classList.add("hidden");
}

function calculatePayroll(values) {
  const employee = state.employees.find((item) => item.id === values.employeeId);
  const employeeAfp = values.afp || employee?.afp || "modelo";
  const healthProvider = values.healthProvider || employee?.healthProvider || "fonasa";
  const contractType = values.contractType || employee?.contractType || "indefinite";
  const afpRules = PAYROLL_INDICATORS.afp[employeeAfp] || PAYROLL_INDICATORS.afp.modelo;
  const unemploymentRules = contractType === "fixed" ? PAYROLL_INDICATORS.unemployment.fixed : PAYROLL_INDICATORS.unemployment.indefinite;
  const taxable = Number(values.taxable) || 0;
  const bonus = Number(values.bonus) || 0;
  const overtime = Number(values.overtime) || 0;
  const familyAllowance = Number(values.familyAllowance) || 0;
  const transport = Number(values.transport ?? employee?.transportAllowance) || 0;
  const meal = Number(values.meal ?? employee?.mealAllowance) || 0;
  const advance = Number(values.advance) || 0;
  const loan = Number(values.loan) || 0;
  const thirdParty = Number(values.thirdParty) || 0;
  const otherDeductions = Number(values.otherDeductions) || 0;
  const workedDays = Number(values.workedDays) || 30;
  const proportionalTaxable = Math.round((taxable / 30) * workedDays);
  const totalTaxable = proportionalTaxable + bonus + overtime;
  const cappedTaxable = Math.min(totalTaxable, PAYROLL_INDICATORS.taxableCap);
  const cappedUnemployment = Math.min(totalTaxable, PAYROLL_INDICATORS.unemploymentCap);
  const pension = Math.round(cappedTaxable * afpRules.workerRate);
  const legalHealth = Math.round(cappedTaxable * PAYROLL_INDICATORS.healthRate);
  const health = healthProvider === "isapre" ? Math.max(legalHealth, Number(values.healthPlanAmount ?? employee?.healthPlanAmount) || 0) : legalHealth;
  const unemployment = Math.round(cappedUnemployment * unemploymentRules.workerRate);
  const totalLegalDeductions = pension + health + unemployment;
  const incomeTaxBase = Math.max(totalTaxable - totalLegalDeductions, 0);
  const incomeTax = calculateIncomeTax(incomeTaxBase);
  const totalOtherDeductions = advance + loan + thirdParty + otherDeductions;
  const totalDeductions = totalLegalDeductions + incomeTax + totalOtherDeductions;
  const nonTaxable = familyAllowance + transport + meal;
  const grossPay = totalTaxable + nonTaxable;
  const netPay = grossPay - totalDeductions;
  const employerSis = Math.round(cappedTaxable * PAYROLL_INDICATORS.sisRate);
  const employerUnemployment = Math.round(cappedUnemployment * unemploymentRules.employerRate);
  const employerAfp = Math.round(cappedTaxable * afpRules.employerRate);
  const employerSocialSecurity = Math.round(cappedTaxable * PAYROLL_INDICATORS.employerSocialSecurityRate);
  const employerTotal = employerSis + employerUnemployment + employerAfp + employerSocialSecurity;

  return {
    proportionalTaxable,
    totalTaxable,
    cappedTaxable,
    nonTaxable,
    pension,
    health,
    unemployment,
    totalLegalDeductions,
    incomeTaxBase,
    incomeTax,
    totalOtherDeductions,
    totalDeductions,
    grossPay,
    netPay,
    employerSis,
    employerUnemployment,
    employerAfp,
    employerSocialSecurity,
    employerTotal,
  };
}

async function submitPayroll(event) {
  event.preventDefault();
  if (!requireSignedIn() || !requireAdmin()) return;
  if (!state.employees.length) return;
  const employee = state.employees.find((item) => item.id === els.payrollEmployee.value);
  if (!employee) return;

  const values = {
    employeeId: els.payrollEmployee.value,
    month: els.payrollMonth.value,
    taxable: safeAmount("#payrollTaxable"),
    bonus: safeAmount("#payrollBonus"),
    overtime: safeAmount("#payrollOvertime"),
    familyAllowance: 0,
    transport: employee?.transportAllowance || 0,
    meal: employee?.mealAllowance || 0,
    afp: employee?.afp || "modelo",
    healthProvider: employee?.healthProvider || "fonasa",
    healthPlanAmount: employee?.healthPlanAmount || 0,
    contractType: employee?.contractType || "indefinite",
    advance: safeAmount("#payrollAdvance"),
    loan: safeAmount("#payrollLoan"),
    thirdParty: safeAmount("#payrollThirdParty"),
    otherDeductions: safeAmount("#payrollOtherDeductions"),
    workedDays: safeAmount("#payrollWorkedDays"),
  };
  const payroll = { id: uid("pay"), createdAt: new Date().toISOString(), ...values, ...calculatePayroll(values) };

  try {
    if (state.remoteReady) {
      let { data, error } = await supabaseClient.from("payrolls").insert(toPayrollRow(payroll)).select().single();
      if (error && /column|schema cache/i.test(error.message || "")) {
        ({ data, error } = await supabaseClient.from("payrolls").insert(toLegacyPayrollRow(payroll)).select().single());
      }
      if (error) throw error;
      state.payrolls.unshift({ ...payroll, id: data.id, createdAt: data.created_at });
    } else {
      state.payrolls.unshift(payroll);
    }
    state.selectedPayrollId = state.payrolls[0].id;
    els.payrollPreview.innerHTML = payrollDocument(state.payrolls[0]);
    els.payrollPreview.dataset.payrollId = state.payrolls[0].id;
    renderAll();
  } catch (error) {
    alert(`No se pudo generar la liquidación: ${error.message}`);
  }
}

function payrollDocument(payroll) {
  const employee = state.employees.find((item) => item.id === payroll.employeeId);
  const company = state.company || { name: "Empresa", tax_id: "No disponible" };
  const calculated = { ...payroll, ...calculatePayroll(payroll) };
  const afp = PAYROLL_INDICATORS.afp[payroll.afp] || PAYROLL_INDICATORS.afp.modelo;
  const healthLabel = payroll.healthProvider === "isapre" ? "ISAPRE" : "FONASA";
  const liquido = calculated.netPay;
  return `
    <article class="payroll-document">
      <header class="payroll-title">LIQUIDACION SUELDO</header>
      <section class="payroll-meta">
        <div><span>Empresa</span><strong>${company.name}</strong></div>
        <div><span>R.U.T.</span><strong>${company.tax_id || "No disponible"}</strong></div>
      </section>
      <section class="payroll-meta worker">
        <div><span>Trabajador</span><strong>${employee?.name || "Empleado eliminado"}</strong></div>
        <div><span>RUT</span><strong>${employee?.rut || "No disponible"}</strong></div>
        <div><span>Mes</span><strong>${monthLabel(payroll.month)}</strong></div>
      </section>
      <p class="payroll-days"><strong>Días trabajados</strong><b>${Number(payroll.workedDays || 30).toFixed(1)}</b></p>
      <div class="payroll-columns payroll-head"><strong>HABERES</strong><strong>DESCUENTOS</strong></div>
      <div class="payroll-columns">
        <div>
          ${payrollLine("SUELDO BASE", calculated.proportionalTaxable)}
          ${payrollLine("BONO ESPECIAL", payroll.bonus)}
          ${payrollLine("HORAS EXTRAS", payroll.overtime)}
        </div>
        <div>
          ${payrollLine(`AFP ${afp.label.toUpperCase()}`, calculated.pension)}
          ${payrollLine("SEG. CESANTIA", calculated.unemployment)}
          ${payrollLine(healthLabel, calculated.health)}
          ${payrollLine("ANTICIPO", payroll.advance)}
        </div>
      </div>
      <div class="payroll-total payroll-columns">
        ${payrollLine("TOTAL IMPONIBLE", calculated.totalTaxable, true)}
        ${payrollLine("", calculated.totalLegalDeductions + calculated.incomeTax + Number(payroll.advance || 0), true)}
      </div>
      <div class="payroll-columns">
        <div>
          ${payrollLine("ASIG.FAMILIAR", payroll.familyAllowance)}
          ${payrollLine("LOCOMOCION", payroll.transport)}
          ${payrollLine("COLACION", payroll.meal)}
        </div>
        <div>
          ${payrollLine("PRESTAMOS CUOTA", payroll.loan)}
          ${payrollLine("DESCUENTO DE TERCEROS", payroll.thirdParty)}
          ${payrollLine("OTROS DESCUENTOS", payroll.otherDeductions)}
        </div>
      </div>
      <div class="payroll-total payroll-columns">
        ${payrollLine("TOTAL HABER", calculated.grossPay, true)}
        ${payrollLine("TOTAL DESCUENTOS", calculated.totalDeductions, true)}
      </div>
      <section class="payroll-tax">
        <strong>CALCULO IMPUESTO UNICO</strong>
        ${payrollLine("RENTA IMPONIBLE", calculated.totalTaxable)}
        ${payrollLine("DESCTO.PREVISIONAL", calculated.totalLegalDeductions)}
        ${payrollLine("BASE IMPONIBLE", calculated.incomeTaxBase)}
        ${payrollLine("IMPUESTO A PAGAR**", calculated.incomeTax)}
      </section>
      <section class="payroll-employer">
        <strong>APORTES EMPLEADOR (NO INCLUIDOS EN LIQUIDO)</strong>
        ${payrollLine("SIS", calculated.employerSis)}
        ${payrollLine("AFC EMPLEADOR", calculated.employerUnemployment)}
        ${payrollLine("AFP EMPLEADOR", calculated.employerAfp)}
        ${payrollLine("SEGURO SOCIAL", calculated.employerSocialSecurity)}
        ${payrollLine("TOTAL APORTE EMPLEADOR", calculated.employerTotal, true)}
      </section>
      <section class="payroll-pay">
        ${payrollLine("SUELDO LIQUIDO", calculated.netPay, true)}
        ${payrollLine("ANTICIPOS", 0)}
        ${payrollLine("LIQUIDO A PAGAR", liquido, true, "highlight")}
      </section>
    </article>
  `;
}

function payrollLine(label, value, strong = false, className = "") {
  return `<p class="${strong ? "strong" : ""} ${className}"><span>${label}</span><span>$</span><b>${payrollMoney(value)}</b></p>`;
}

function showPayroll(id) {
  const payroll = state.payrolls.find((item) => item.id === id);
  if (!payroll) return;
  const employeeId = currentEmployeeId();
  if (employeeId && payroll.employeeId !== employeeId) return;
  state.selectedPayrollId = id;
  setView("payroll");
  els.payrollPreview.innerHTML = payrollDocument(payroll);
  els.payrollPreview.dataset.payrollId = payroll.id;
  renderPayrolls();
}

function printPayroll(id = state.selectedPayrollId) {
  const payrolls = payrollsForSelectedEmployee();
  const payroll = payrolls.find((item) => item.id === id) || payrolls[0];
  if (!payroll) return;
  state.selectedPayrollId = payroll.id;
  els.payrollPreview.innerHTML = payrollDocument(payroll);
  els.payrollPreview.dataset.payrollId = payroll.id;
  setView("payroll");
  window.print();
}

async function deletePayroll(id) {
  if (!requireSignedIn() || !requireAdmin()) return;
  try {
    if (state.remoteReady) {
      const { error } = await supabaseClient.from("payrolls").delete().eq("id", id);
      if (error) throw error;
    }
    state.payrolls = state.payrolls.filter((payroll) => payroll.id !== id);
    if (state.selectedPayrollId === id) state.selectedPayrollId = null;
    renderAll();
  } catch (error) {
    alert(`No se pudo eliminar la liquidación: ${error.message}`);
  }
}

async function submitCertificate(event) {
  event.preventDefault();
  if (!requireSignedIn() || !requireAdmin()) return;
  const editId = els.certificateId.value;
  const previousCertificate = editId ? state.certificates.find((item) => item.id === editId) : null;
  const employee = state.employees.find((item) => item.id === els.certificateEmployee.value);
  if (!employee) return;
  const type = document.querySelector("#certificateType").value;
  const start = document.querySelector("#certificateStart").value;
  const end = document.querySelector("#certificateEnd").value;
  if (new Date(`${start}T12:00:00`) > new Date(`${end}T12:00:00`)) {
    alert("La fecha de inicio no puede ser posterior a la fecha de término.");
    return;
  }
  const vacationDays = type === "vacaciones" ? businessDaysBetween(start, end) : 0;
  const previousDays = certificateVacationDays(previousCertificate);
  const availableDays = Number(employee.vacationDays || 0) + (previousCertificate?.employeeId === employee.id ? previousDays : 0);
  if (vacationDays > availableDays) {
    const confirmed = window.confirm(`El certificado descuenta ${vacationDays} día(s), pero ${employee.name} tiene ${availableDays.toLocaleString("es-CL")} disponible(s). ¿Guardar de todos modos?`);
    if (!confirmed) return;
  }

  const certificate = {
    id: editId || uid("cert"),
    type,
    employeeId: employee.id,
    start,
    end,
    notes: document.querySelector("#certificateNotes").value.trim(),
    days: vacationDays,
    createdAt: new Date().toISOString(),
  };

  try {
    let savedCertificate = certificate;
    if (state.remoteReady) {
      const query = editId
        ? supabaseClient.from("certificates").update(toCertificateRow(certificate)).eq("id", editId).select().single()
        : supabaseClient.from("certificates").insert(toCertificateRow(certificate)).select().single();
      const { data, error } = await query;
      if (error) throw error;
      savedCertificate = { ...dbCertificate(data), days: vacationDays };
    }

    if (previousCertificate) {
      const previousEmployee = state.employees.find((item) => item.id === previousCertificate.employeeId);
      if (previousEmployee && previousDays > 0) {
        await saveEmployeeVacationBalance(previousEmployee, Number(previousEmployee.vacationDays || 0) + previousDays);
      }
      state.certificates = state.certificates.filter((item) => item.id !== previousCertificate.id);
    }

    const currentEmployee = state.employees.find((item) => item.id === employee.id) || employee;
    if (type === "vacaciones" && vacationDays > 0) {
      await saveEmployeeVacationBalance(currentEmployee, Number(currentEmployee.vacationDays || 0) - vacationDays);
    }

    state.certificates.unshift(savedCertificate);
    els.certificatePreview.innerHTML = certificateDocument(savedCertificate);
    resetCertificateForm();
    renderAll();
    setView("employees");
    saveLocalState();
  } catch (error) {
    alert(`No se pudo guardar el certificado: ${error.message}`);
  }
}

function certificateDocument(certificate) {
  const employee = state.employees.find((item) => item.id === certificate.employeeId);
  const label = certificate.type === "vacaciones" ? "vacaciones" : "permiso laboral";
  const title = certificate.type === "vacaciones" ? "Certificado de vacaciones" : "Certificado de permiso";
  const days = certificate.type === "vacaciones" ? certificate.days || businessDaysBetween(certificate.start, certificate.end) : 0;

  return `
    <h3>${title}</h3>
    <p>Se certifica que <strong>${employee?.name || "Empleado"}</strong>, RUT / ID <strong>${employee?.rut || "No disponible"}</strong>, quien se desempeña como <strong>${employee?.role || "No disponible"}</strong> en el área <strong>${employee?.department || "No disponible"}</strong>, cuenta con autorización para hacer uso de ${label}.</p>
    <p><strong>Desde:</strong> ${readableDate(certificate.start)}</p>
    <p><strong>Hasta:</strong> ${readableDate(certificate.end)}</p>
    ${days ? `<p><strong>Días hábiles descontados:</strong> ${days}</p>` : ""}
    <p><strong>Fecha de emisión:</strong> ${readableDate(new Date().toISOString().slice(0, 10))}</p>
    ${certificate.notes ? `<p><strong>Observación:</strong> ${certificate.notes}</p>` : ""}
    <div class="signature">Firma Recursos Humanos</div>
  `;
}

async function seedData() {
  if (!requireSignedIn() || !requireAdmin()) return;
  if (state.employees.length && !window.confirm("Esto agregará datos de ejemplo a los registros actuales. ¿Continuar?")) return;

  const examples = [
    {
      companyId: state.company?.id || null,
      name: "Camila Araya Soto",
      rut: "12.345.678-9",
      email: "camila@empresa.cl",
      phone: "+56 9 1234 5678",
      address: "Av. Providencia 1234, Santiago",
      bankName: "BancoEstado",
      bankAccountType: "cuenta-rut",
      bankAccountNumber: "12345678",
      afp: "modelo",
      healthProvider: "fonasa",
      healthPlanAmount: 0,
      contractType: "indefinite",
      contractEndDate: "",
      transportAllowance: 50000,
      mealAllowance: 50000,
      emergencyName: "Juan Araya",
      emergencyRelationship: "Padre",
      emergencyPhone: "+56 9 1111 2222",
      role: "Analista de personas",
      department: "Recursos Humanos",
      startDate: "2023-03-01",
      salary: 1280000,
      vacationDays: 12,
      status: "Activo",
    },
    {
      companyId: state.company?.id || null,
      name: "Matías Fuentes Rojas",
      rut: "18.456.111-2",
      email: "matias@empresa.cl",
      phone: "+56 9 8765 4321",
      address: "Los Leones 845, Providencia",
      bankName: "Banco de Chile",
      bankAccountType: "corriente",
      bankAccountNumber: "0012345678",
      afp: "capital",
      healthProvider: "isapre",
      healthPlanAmount: 120000,
      contractType: "indefinite",
      contractEndDate: "",
      transportAllowance: 60000,
      mealAllowance: 55000,
      emergencyName: "Andrea Rojas",
      emergencyRelationship: "Cónyuge",
      emergencyPhone: "+56 9 3333 4444",
      role: "Coordinador de operaciones",
      department: "Operaciones",
      startDate: "2022-08-15",
      salary: 1450000,
      vacationDays: 8.5,
      status: "Activo",
    },
    {
      companyId: state.company?.id || null,
      name: "Daniela Morales Vera",
      rut: "16.789.432-1",
      email: "daniela@empresa.cl",
      phone: "+56 9 2222 3333",
      address: "Brasil 210, Valparaíso",
      bankName: "Santander",
      bankAccountType: "vista",
      bankAccountNumber: "987654321",
      afp: "uno",
      healthProvider: "fonasa",
      healthPlanAmount: 0,
      contractType: "fixed",
      contractEndDate: "2024-12-31",
      transportAllowance: 45000,
      mealAllowance: 45000,
      emergencyName: "Paula Vera",
      emergencyRelationship: "Madre",
      emergencyPhone: "+56 9 5555 6666",
      role: "Ejecutiva comercial",
      department: "Ventas",
      startDate: "2024-01-10",
      salary: 980000,
      vacationDays: 15,
      status: "Activo",
    },
  ];

  try {
    if (state.remoteReady) {
      let { data, error } = await supabaseClient.from("employees").insert(examples.map(toEmployeeRow)).select();
      if (error && /column|schema cache/i.test(error.message || "")) {
        ({ data, error } = await supabaseClient.from("employees").insert(examples.map(toLegacyEmployeeRow)).select());
      }
      if (error) throw error;
      state.employees.unshift(...data.map(dbEmployee));
    } else {
      state.employees.unshift(...examples.map((employee) => ({ ...employee, id: uid("emp") })));
    }
    renderAll();
  } catch (error) {
    alert(`No se pudieron cargar los datos de ejemplo: ${error.message}`);
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rrhh-central-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function init() {
  if (!supabaseClient) {
    loadFallbackState(new Error("Supabase no está disponible."));
    renderAll();
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) console.error("No se pudo leer la sesión:", error);
  state.user = data?.session?.user || null;
  setAuthUi();

  if (!state.user) {
    clearRemoteState();
    setStatus("Inicia sesión para usar Supabase.");
    renderAll();
    return;
  }

  try {
    setStatus("Conectando con Supabase...");
    await loadRemoteState();
  } catch (error) {
    loadFallbackState(error);
  }
  renderAll();
}

async function createEmployeeAccess(employee, password) {
  if (!employee.email) throw new Error("El empleado necesita email para crear acceso.");
  const { data } = await supabaseClient.auth.getSession();
  const response = await fetch("/api/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session.access_token}`,
    },
    body: JSON.stringify({
      email: employee.email,
      password,
      employeeId: employee.id,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "No se pudo crear el acceso del empleado.");
}

async function signIn(event) {
  event.preventDefault();
  els.authMessage.textContent = "Ingresando...";
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: els.authEmail.value.trim(),
    password: els.authPassword.value,
  });

  if (error) {
    els.authMessage.textContent = error.message;
    return;
  }

  state.user = data.user;
  els.authForm.reset();
  setStatus("Conectando con Supabase...");
  await loadRemoteState();
  renderAll();
}

async function toggleAuth() {
  if (state.user) {
    await supabaseClient.auth.signOut();
    state.user = null;
    clearRemoteState();
    setStatus("Sesión cerrada. Inicia sesión para usar Supabase.");
    renderAll();
    return;
  }
  els.authMessage.textContent = "";
  setAuthUi();
}

els.navTabs.forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
els.mobileNavToggle?.addEventListener("click", () => {
  const expanded = els.appNav.classList.toggle("menu-open");
  els.mobileNavToggle.setAttribute("aria-expanded", String(expanded));
});
document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.jump));
});

els.employeeForm.addEventListener("submit", submitEmployee);
els.cancelEditBtn.addEventListener("click", resetEmployeeForm);
els.employeeSearch.addEventListener("input", renderEmployeeList);
els.payrollEmployee.addEventListener("change", () => {
  els.payrollTaxable.value = "";
  state.selectedPayrollId = null;
  delete els.payrollPreview.dataset.payrollId;
  renderPayrollDefaults();
  renderPayrolls();
  applyOvertimeCalculation();
});
els.payrollTaxable.addEventListener("input", renderOvertimeNote);
els.payrollOvertimeHours.addEventListener("input", applyOvertimeCalculation);
els.payrollOvertimeMultiplier.addEventListener("change", applyOvertimeCalculation);
els.calculateOvertimeBtn.addEventListener("click", applyOvertimeCalculation);
els.payrollForm.addEventListener("submit", submitPayroll);
els.certificateForm.addEventListener("submit", submitCertificate);
els.cancelCertificateEditBtn.addEventListener("click", resetCertificateForm);
els.accountingMonth.addEventListener("change", renderAccountingSummary);
els.seedDataBtn?.addEventListener("click", seedData);
els.exportDataBtn?.addEventListener("click", exportData);
els.authBtn.addEventListener("click", toggleAuth);
els.authForm.addEventListener("submit", signIn);
els.printCertificateBtn.addEventListener("click", () => window.print());
els.printPayrollBtn.addEventListener("click", () => printPayroll());
els.operationalAlerts?.addEventListener("click", (event) => {
  const target = event.target.closest("[data-jump]");
  if (target) setView(target.dataset.jump);
});

els.employeeList.addEventListener("click", (event) => {
  const target = event.target.closest("[data-edit], [data-delete], [data-view-certificate], [data-view-payroll]");
  const editId = target?.dataset.edit;
  const deleteId = target?.dataset.delete;
  const certificateId = target?.dataset.viewCertificate;
  const payrollId = target?.dataset.viewPayroll;
  if (editId) editEmployee(editId);
  if (deleteId) deleteEmployee(deleteId);
  if (certificateId) showCertificate(certificateId);
  if (payrollId) showPayroll(payrollId);
});

els.payrollList.addEventListener("click", (event) => {
  const viewId = event.target.dataset.viewPayroll;
  const printId = event.target.dataset.printPayroll;
  const deleteId = event.target.dataset.deletePayroll;
  if (viewId) showPayroll(viewId);
  if (printId) printPayroll(printId);
  if (deleteId) deletePayroll(deleteId);
});

els.certificatePreview.addEventListener("click", (event) => {
  const target = event.target.closest("[data-view-certificate], [data-edit-certificate], [data-delete-certificate]");
  const certificateId = target?.dataset.viewCertificate;
  const editId = target?.dataset.editCertificate;
  const deleteId = target?.dataset.deleteCertificate;
  if (certificateId) showCertificate(certificateId);
  if (editId) editCertificate(editId);
  if (deleteId) deleteCertificate(deleteId);
});

init();
