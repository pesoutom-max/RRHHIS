const SUPABASE_URL = "https://psdtmyoouqsldxskncth.supabase.co";
const SUPABASE_KEY = "sb_publishable_tjTcbQ6_4Sc2xmOPH9eSbA_cQd4jLZf";
const STORAGE_KEY = "rrhh-central-state";

const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
const ADMIN_EMAIL = "pesoutom@gmail.com";

const state = {
  employees: [],
  payrolls: [],
  certificates: [],
  company: null,
  user: null,
  profile: null,
  remoteReady: false,
};

const els = {
  viewTitle: document.querySelector("#viewTitle"),
  navTabs: document.querySelectorAll(".nav-tab"),
  views: document.querySelectorAll(".view"),
  storageStatus: document.querySelector("#storageStatus"),
  activeEmployeesMetric: document.querySelector("#activeEmployeesMetric"),
  monthlyPayrollMetric: document.querySelector("#monthlyPayrollMetric"),
  vacationDaysMetric: document.querySelector("#vacationDaysMetric"),
  lastPayrollMetric: document.querySelector("#lastPayrollMetric"),
  recentEmployeesTable: document.querySelector("#recentEmployeesTable"),
  employeeForm: document.querySelector("#employeeForm"),
  employeeFormTitle: document.querySelector("#employeeFormTitle"),
  cancelEditBtn: document.querySelector("#cancelEditBtn"),
  employeeList: document.querySelector("#employeeList"),
  employeeSearch: document.querySelector("#employeeSearch"),
  payrollForm: document.querySelector("#payrollForm"),
  payrollEmployee: document.querySelector("#payrollEmployee"),
  payrollMonth: document.querySelector("#payrollMonth"),
  payrollTaxable: document.querySelector("#payrollTaxable"),
  payrollList: document.querySelector("#payrollList"),
  printPayrollBtn: document.querySelector("#printPayrollBtn"),
  certificateForm: document.querySelector("#certificateForm"),
  certificateEmployee: document.querySelector("#certificateEmployee"),
  certificatePreview: document.querySelector("#certificatePreview"),
  printCertificateBtn: document.querySelector("#printCertificateBtn"),
  seedDataBtn: document.querySelector("#seedDataBtn"),
  exportDataBtn: document.querySelector("#exportDataBtn"),
  authBtn: document.querySelector("#authBtn"),
  authDialog: document.querySelector("#authDialog"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authMessage: document.querySelector("#authMessage"),
  closeAuthBtn: document.querySelector("#closeAuthBtn"),
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

function readableDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "long" }).format(new Date(`${value}T12:00:00`));
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
  els.authBtn.textContent = signedIn ? "Salir" : "Ingresar";
  els.currentUser.textContent = signedIn ? `${state.user.email} · ${admin ? "Admin" : "Personal"}` : "Sin sesión";
  els.seedDataBtn.disabled = !admin;
  els.exportDataBtn.disabled = !signedIn;
  els.printCertificateBtn.disabled = !signedIn;
  els.printPayrollBtn.disabled = !signedIn;
  [els.employeeForm, els.payrollForm, els.certificateForm].forEach((form) => {
    form.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = !admin;
    });
  });
  els.navTabs.forEach((tab) => {
    const employeeOnlyHidden = !admin && tab.dataset.view === "employees";
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
  els.views.forEach((viewEl) => viewEl.classList.toggle("active", viewEl.id === `${view}View`));
  els.navTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === view));
  const activeView = document.querySelector(`#${view}View`);
  els.viewTitle.textContent = activeView?.dataset.title || "RRHH Central";
}

function activeEmployees() {
  return state.employees.filter((employee) => employee.status === "Activo");
}

function dbEmployee(row) {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.full_name,
    rut: row.rut,
    email: row.email || "",
    phone: row.phone || "",
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
  renderEmployeeList();
  renderEmployeeOptions();
  renderPayrollDefaults();
  renderPayrolls();
  saveLocalState();
}

function renderMetrics() {
  const active = activeEmployees();
  const totalSalary = active.reduce((sum, employee) => sum + Number(employee.salary || 0), 0);
  const vacationDays = active.reduce((sum, employee) => sum + Number(employee.vacationDays || 0), 0);
  const lastPayroll = state.payrolls[0];

  els.activeEmployeesMetric.textContent = active.length;
  els.monthlyPayrollMetric.textContent = money(totalSalary);
  els.vacationDaysMetric.textContent = vacationDays.toLocaleString("es-CL");
  els.lastPayrollMetric.textContent = lastPayroll ? monthLabel(lastPayroll.month) : "Sin registros";
}

function renderRecentEmployees() {
  clearNode(els.recentEmployeesTable);
  const employees = isAdmin() ? state.employees.slice(0, 5) : state.employees.slice(0, 1);

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

function renderEmployeeList() {
  clearNode(els.employeeList);
  const query = els.employeeSearch.value.trim().toLowerCase();
  const employees = state.employees.filter((employee) => {
    return [employee.name, employee.rut, employee.email, employee.phone, employee.role, employee.department, employee.status]
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
    item.innerHTML = `
      <div>
        <span class="employee-name">${employee.name}</span>
        <span class="employee-meta">${employee.rut} · ${employee.role} · ${employee.department}<br>${contact ? `${contact}<br>` : ""}${money(employee.salary)} · ${employee.vacationDays} días vacaciones</span>
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
    clearNode(select);
    if (!state.employees.length) {
      const option = new Option("Agrega un empleado primero", "", true, true);
      option.disabled = true;
      select.append(option);
      return;
    }

    state.employees.forEach((employee) => {
      select.append(new Option(`${employee.name} · ${employee.role}`, employee.id));
    });
    if (previousValue) select.value = previousValue;
  });
}

function renderPayrollDefaults() {
  const employee = state.employees.find((item) => item.id === els.payrollEmployee.value) || state.employees[0];
  if (!employee) return;
  if (!els.payrollTaxable.value || Number(els.payrollTaxable.value) === 0) {
    els.payrollTaxable.value = employee.salary;
  }
  if (!els.payrollMonth.value) {
    els.payrollMonth.value = new Date().toISOString().slice(0, 7);
  }
}

function renderPayrolls() {
  clearNode(els.payrollList);
  if (!state.payrolls.length) {
    els.payrollList.append(emptyState());
    return;
  }

  state.payrolls.forEach((payroll) => {
    const employee = state.employees.find((item) => item.id === payroll.employeeId);
    const item = document.createElement("article");
    item.className = "record-item";
    item.innerHTML = `
      <div>
        <span class="record-title">${employee?.name || "Empleado eliminado"} · ${monthLabel(payroll.month)}</span>
        <span class="record-meta">Líquido a pago: ${money(payroll.netPay)} · Descuentos: ${money(payroll.totalDeductions)}</span>
      </div>
      <div class="item-actions">
        <button class="mini-button" type="button" title="Ver" aria-label="Ver liquidación" data-view-payroll="${payroll.id}">▤</button>
        <button class="mini-button danger" type="button" title="Eliminar" aria-label="Eliminar liquidación" data-delete-payroll="${payroll.id}" ${isAdmin() ? "" : "hidden"}>×</button>
      </div>
    `;
    els.payrollList.append(item);
  });
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
    role: form.get("role").trim(),
    department: form.get("department").trim(),
    startDate: form.get("startDate"),
    salary: Number(form.get("salary")),
    vacationDays: Number(form.get("vacationDays")),
    status: form.get("status"),
  };

  try {
    if (state.remoteReady) {
      const query = id
        ? supabaseClient.from("employees").update(toEmployeeRow(employee)).eq("id", id).select().single()
        : supabaseClient.from("employees").insert(toEmployeeRow(employee)).select().single();
      const { data, error } = await query;
      if (error) throw error;
      employee.id = data.id;
      employee.companyId = data.company_id;
      if (accountPassword) await createEmployeeAccess({ ...employee, email: data.email }, accountPassword);
    }

    const index = state.employees.findIndex((item) => item.id === employee.id);
    if (index >= 0) {
      state.employees[index] = employee;
    } else {
      state.employees.unshift(employee);
    }

    resetEmployeeForm();
    renderAll();
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
  document.querySelector("#employeeVacationDays").value = 15;
  document.querySelector("#employeeStatus").value = "Activo";
  els.employeeFormTitle.textContent = "Nuevo empleado";
  els.cancelEditBtn.classList.add("hidden");
}

function calculatePayroll(values) {
  const taxable = Number(values.taxable) || 0;
  const nonTaxable = Number(values.nonTaxable) || 0;
  const otherDeductions = Number(values.otherDeductions) || 0;
  const workedDays = Number(values.workedDays) || 30;
  const proportionalTaxable = Math.round((taxable / 30) * workedDays);
  const pension = Math.round(proportionalTaxable * 0.1);
  const health = Math.round(proportionalTaxable * 0.07);
  const unemployment = Math.round(proportionalTaxable * 0.006);
  const totalDeductions = pension + health + unemployment + otherDeductions;
  const grossPay = proportionalTaxable + nonTaxable;
  const netPay = grossPay - totalDeductions;

  return { proportionalTaxable, pension, health, unemployment, totalDeductions, grossPay, netPay };
}

async function submitPayroll(event) {
  event.preventDefault();
  if (!requireSignedIn() || !requireAdmin()) return;
  if (!state.employees.length) return;

  const values = {
    employeeId: els.payrollEmployee.value,
    month: els.payrollMonth.value,
    taxable: Number(document.querySelector("#payrollTaxable").value),
    nonTaxable: Number(document.querySelector("#payrollNonTaxable").value),
    otherDeductions: Number(document.querySelector("#payrollOtherDeductions").value),
    workedDays: Number(document.querySelector("#payrollWorkedDays").value),
  };
  const payroll = { id: uid("pay"), createdAt: new Date().toISOString(), ...values, ...calculatePayroll(values) };

  try {
    if (state.remoteReady) {
      const { data, error } = await supabaseClient.from("payrolls").insert(toPayrollRow(payroll)).select().single();
      if (error) throw error;
      state.payrolls.unshift(dbPayroll(data));
    } else {
      state.payrolls.unshift(payroll);
    }
    renderAll();
  } catch (error) {
    alert(`No se pudo generar la liquidación: ${error.message}`);
  }
}

function payrollDocument(payroll) {
  const employee = state.employees.find((item) => item.id === payroll.employeeId);
  return `
    <h3>Liquidación de sueldo</h3>
    <p><strong>Trabajador:</strong> ${employee?.name || "Empleado eliminado"}</p>
    <p><strong>RUT / ID:</strong> ${employee?.rut || "No disponible"}</p>
    <p><strong>Cargo:</strong> ${employee?.role || "No disponible"}</p>
    <p><strong>Período:</strong> ${monthLabel(payroll.month)}</p>
    <hr>
    <p><strong>Haberes imponibles proporcionales:</strong> ${money(payroll.proportionalTaxable)}</p>
    <p><strong>Haberes no imponibles:</strong> ${money(payroll.nonTaxable)}</p>
    <p><strong>Total haberes:</strong> ${money(payroll.grossPay)}</p>
    <p><strong>AFP referencial 10%:</strong> ${money(payroll.pension)}</p>
    <p><strong>Salud referencial 7%:</strong> ${money(payroll.health)}</p>
    <p><strong>Seguro cesantía referencial 0,6%:</strong> ${money(payroll.unemployment)}</p>
    <p><strong>Otros descuentos:</strong> ${money(payroll.otherDeductions)}</p>
    <p><strong>Total descuentos:</strong> ${money(payroll.totalDeductions)}</p>
    <p><strong>Líquido a pago:</strong> ${money(payroll.netPay)}</p>
    <p class="muted">Cálculo referencial editable según normativa, contratos y parámetros previsionales vigentes.</p>
    <div class="signature">Firma empleador</div>
  `;
}

function showPayroll(id) {
  const payroll = state.payrolls.find((item) => item.id === id);
  if (!payroll) return;
  setView("certificates");
  els.certificatePreview.innerHTML = payrollDocument(payroll);
}

async function deletePayroll(id) {
  if (!requireSignedIn() || !requireAdmin()) return;
  try {
    if (state.remoteReady) {
      const { error } = await supabaseClient.from("payrolls").delete().eq("id", id);
      if (error) throw error;
    }
    state.payrolls = state.payrolls.filter((payroll) => payroll.id !== id);
    renderAll();
  } catch (error) {
    alert(`No se pudo eliminar la liquidación: ${error.message}`);
  }
}

async function submitCertificate(event) {
  event.preventDefault();
  if (!requireSignedIn() || !requireAdmin()) return;
  const employee = state.employees.find((item) => item.id === els.certificateEmployee.value);
  if (!employee) return;

  const certificate = {
    id: uid("cert"),
    type: document.querySelector("#certificateType").value,
    employeeId: employee.id,
    start: document.querySelector("#certificateStart").value,
    end: document.querySelector("#certificateEnd").value,
    notes: document.querySelector("#certificateNotes").value.trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    if (state.remoteReady) {
      const { data, error } = await supabaseClient.from("certificates").insert(toCertificateRow(certificate)).select().single();
      if (error) throw error;
      state.certificates.unshift(dbCertificate(data));
      els.certificatePreview.innerHTML = certificateDocument(dbCertificate(data));
    } else {
      state.certificates.unshift(certificate);
      els.certificatePreview.innerHTML = certificateDocument(certificate);
    }
    renderAll();
  } catch (error) {
    alert(`No se pudo emitir el certificado: ${error.message}`);
  }
}

function certificateDocument(certificate) {
  const employee = state.employees.find((item) => item.id === certificate.employeeId);
  const label = certificate.type === "vacaciones" ? "vacaciones" : "permiso laboral";
  const title = certificate.type === "vacaciones" ? "Certificado de vacaciones" : "Certificado de permiso";

  return `
    <h3>${title}</h3>
    <p>Se certifica que <strong>${employee?.name || "Empleado"}</strong>, RUT / ID <strong>${employee?.rut || "No disponible"}</strong>, quien se desempeña como <strong>${employee?.role || "No disponible"}</strong> en el área <strong>${employee?.department || "No disponible"}</strong>, cuenta con autorización para hacer uso de ${label}.</p>
    <p><strong>Desde:</strong> ${readableDate(certificate.start)}</p>
    <p><strong>Hasta:</strong> ${readableDate(certificate.end)}</p>
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
      const { data, error } = await supabaseClient.from("employees").insert(examples.map(toEmployeeRow)).select();
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
  els.authDialog.close();
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
  els.authDialog.showModal();
}

els.navTabs.forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.jump));
});

els.employeeForm.addEventListener("submit", submitEmployee);
els.cancelEditBtn.addEventListener("click", resetEmployeeForm);
els.employeeSearch.addEventListener("input", renderEmployeeList);
els.payrollEmployee.addEventListener("change", () => {
  els.payrollTaxable.value = "";
  renderPayrollDefaults();
});
els.payrollForm.addEventListener("submit", submitPayroll);
els.certificateForm.addEventListener("submit", submitCertificate);
els.seedDataBtn.addEventListener("click", seedData);
els.exportDataBtn.addEventListener("click", exportData);
els.authBtn.addEventListener("click", toggleAuth);
els.authForm.addEventListener("submit", signIn);
els.closeAuthBtn.addEventListener("click", () => els.authDialog.close());
els.printCertificateBtn.addEventListener("click", () => window.print());
els.printPayrollBtn.addEventListener("click", () => {
  if (state.payrolls[0]) {
    els.certificatePreview.innerHTML = payrollDocument(state.payrolls[0]);
    setView("certificates");
    window.print();
  }
});

els.employeeList.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) editEmployee(editId);
  if (deleteId) deleteEmployee(deleteId);
});

els.payrollList.addEventListener("click", (event) => {
  const viewId = event.target.dataset.viewPayroll;
  const deleteId = event.target.dataset.deletePayroll;
  if (viewId) showPayroll(viewId);
  if (deleteId) deletePayroll(deleteId);
});

init();
