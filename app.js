const STORAGE_KEY = "rrhh-central-state";

const state = loadState();

const els = {
  viewTitle: document.querySelector("#viewTitle"),
  navTabs: document.querySelectorAll(".nav-tab"),
  views: document.querySelectorAll(".view"),
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
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
};

function loadState() {
  const fallback = { employees: [], payrolls: [], certificates: [] };
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  return new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(new Date(`${value}-02T12:00:00`));
}

function clearNode(node) {
  node.replaceChildren();
}

function emptyState() {
  return els.emptyStateTemplate.content.cloneNode(true);
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

function renderAll() {
  renderMetrics();
  renderRecentEmployees();
  renderEmployeeList();
  renderEmployeeOptions();
  renderPayrollDefaults();
  renderPayrolls();
  saveState();
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
  const employees = state.employees.slice(0, 5);

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
    return [employee.name, employee.rut, employee.role, employee.department, employee.status]
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
    item.innerHTML = `
      <div>
        <span class="employee-name">${employee.name}</span>
        <span class="employee-meta">${employee.rut} · ${employee.role} · ${employee.department}<br>${money(employee.salary)} · ${employee.vacationDays} días vacaciones</span>
      </div>
      <div class="item-actions">
        <button class="mini-button" type="button" title="Editar" aria-label="Editar ${employee.name}" data-edit="${employee.id}">✎</button>
        <button class="mini-button danger" type="button" title="Eliminar" aria-label="Eliminar ${employee.name}" data-delete="${employee.id}">×</button>
      </div>
    `;
    els.employeeList.append(item);
  });
}

function renderEmployeeOptions() {
  [els.payrollEmployee, els.certificateEmployee].forEach((select) => {
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
  });
}

function renderPayrollDefaults() {
  const employee = state.employees.find((item) => item.id === els.payrollEmployee.value) || state.employees[0];
  if (!employee) return;
  els.payrollTaxable.value = employee.salary;
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
        <button class="mini-button danger" type="button" title="Eliminar" aria-label="Eliminar liquidación" data-delete-payroll="${payroll.id}">×</button>
      </div>
    `;
    els.payrollList.append(item);
  });
}

function submitEmployee(event) {
  event.preventDefault();
  const form = new FormData(els.employeeForm);
  const id = document.querySelector("#employeeId").value || uid("emp");
  const employee = {
    id,
    name: form.get("name").trim(),
    rut: form.get("rut").trim(),
    role: form.get("role").trim(),
    department: form.get("department").trim(),
    startDate: form.get("startDate"),
    salary: Number(form.get("salary")),
    vacationDays: Number(form.get("vacationDays")),
    status: form.get("status"),
  };

  const index = state.employees.findIndex((item) => item.id === id);
  if (index >= 0) {
    state.employees[index] = employee;
  } else {
    state.employees.unshift(employee);
  }

  resetEmployeeForm();
  renderAll();
}

function editEmployee(id) {
  const employee = state.employees.find((item) => item.id === id);
  if (!employee) return;

  document.querySelector("#employeeId").value = employee.id;
  document.querySelector("#employeeName").value = employee.name;
  document.querySelector("#employeeRut").value = employee.rut;
  document.querySelector("#employeeRole").value = employee.role;
  document.querySelector("#employeeDepartment").value = employee.department;
  document.querySelector("#employeeStartDate").value = employee.startDate;
  document.querySelector("#employeeSalary").value = employee.salary;
  document.querySelector("#employeeVacationDays").value = employee.vacationDays;
  document.querySelector("#employeeStatus").value = employee.status;
  els.employeeFormTitle.textContent = "Editar empleado";
  els.cancelEditBtn.classList.remove("hidden");
}

function deleteEmployee(id) {
  const employee = state.employees.find((item) => item.id === id);
  if (!employee) return;
  const confirmed = window.confirm(`¿Eliminar a ${employee.name}? También se mantendrán sus liquidaciones históricas.`);
  if (!confirmed) return;
  state.employees = state.employees.filter((item) => item.id !== id);
  renderAll();
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

function submitPayroll(event) {
  event.preventDefault();
  if (!state.employees.length) return;

  const values = {
    employeeId: els.payrollEmployee.value,
    month: els.payrollMonth.value,
    taxable: Number(document.querySelector("#payrollTaxable").value),
    nonTaxable: Number(document.querySelector("#payrollNonTaxable").value),
    otherDeductions: Number(document.querySelector("#payrollOtherDeductions").value),
    workedDays: Number(document.querySelector("#payrollWorkedDays").value),
  };

  const payroll = {
    id: uid("pay"),
    createdAt: new Date().toISOString(),
    ...values,
    ...calculatePayroll(values),
  };

  state.payrolls.unshift(payroll);
  renderAll();
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

function deletePayroll(id) {
  state.payrolls = state.payrolls.filter((payroll) => payroll.id !== id);
  renderAll();
}

function submitCertificate(event) {
  event.preventDefault();
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

  state.certificates.unshift(certificate);
  els.certificatePreview.innerHTML = certificateDocument(certificate);
  renderAll();
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

function seedData() {
  if (state.employees.length && !window.confirm("Esto agregará datos de ejemplo a los registros actuales. ¿Continuar?")) return;

  const examples = [
    {
      id: uid("emp"),
      name: "Camila Araya Soto",
      rut: "12.345.678-9",
      role: "Analista de personas",
      department: "Recursos Humanos",
      startDate: "2023-03-01",
      salary: 1280000,
      vacationDays: 12,
      status: "Activo",
    },
    {
      id: uid("emp"),
      name: "Matías Fuentes Rojas",
      rut: "18.456.111-2",
      role: "Coordinador de operaciones",
      department: "Operaciones",
      startDate: "2022-08-15",
      salary: 1450000,
      vacationDays: 8.5,
      status: "Activo",
    },
    {
      id: uid("emp"),
      name: "Daniela Morales Vera",
      rut: "16.789.432-1",
      role: "Ejecutiva comercial",
      department: "Ventas",
      startDate: "2024-01-10",
      salary: 980000,
      vacationDays: 15,
      status: "Activo",
    },
  ];

  state.employees.unshift(...examples);
  renderAll();
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

els.navTabs.forEach((tab) => tab.addEventListener("click", () => setView(tab.dataset.view)));
document.querySelectorAll("[data-jump]").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.jump));
});

els.employeeForm.addEventListener("submit", submitEmployee);
els.cancelEditBtn.addEventListener("click", resetEmployeeForm);
els.employeeSearch.addEventListener("input", renderEmployeeList);
els.payrollEmployee.addEventListener("change", renderPayrollDefaults);
els.payrollForm.addEventListener("submit", submitPayroll);
els.certificateForm.addEventListener("submit", submitCertificate);
els.seedDataBtn.addEventListener("click", seedData);
els.exportDataBtn.addEventListener("click", exportData);
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

renderAll();
