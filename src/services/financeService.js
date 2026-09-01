import { financeQuery, financeRequest, listResult } from './financeApi.js'

export async function getFinanceOverview() {
  return financeRequest('/api/finance/overview')
}

export async function getFinanceEmployees(params = {}) {
  const data = await financeRequest(`/api/finance/employees${financeQuery(params)}`)
  return Array.isArray(data.rows) ? data.rows : []
}

export async function uploadFinanceAttachment(file) {
  const formData = new FormData()
  formData.append('file', file)
  return financeRequest('/api/finance/upload', { formData })
}

export async function getAccountingDashboard(params = {}) {
  const data = await financeRequest(`/api/accounting/dashboard${financeQuery(params)}`)
  return data.stats || {}
}

export async function getChartAccounts(params = {}) {
  const data = await financeRequest(`/api/accounting/accounts${financeQuery(params)}`)
  return Array.isArray(data.rows) ? data.rows : []
}

export async function saveChartAccount(body) {
  const data = await financeRequest('/api/accounting/accounts', { body })
  return data.entry
}

export async function setChartAccountStatus(id, status) {
  const data = await financeRequest(`/api/accounting/accounts/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
  })
  return data.entry
}

export async function getLedger(params = {}) {
  return financeRequest(`/api/accounting/ledger${financeQuery(params)}`)
}

export async function getAccountingTransactions(params = {}) {
  return listResult(await financeRequest(`/api/accounting/transactions${financeQuery(params)}`))
}

export async function getAccountingTransaction(id) {
  const data = await financeRequest(`/api/accounting/transactions/${encodeURIComponent(id)}`)
  return data.entry
}

export async function getCashFlow(params = {}) {
  return financeRequest(`/api/accounting/cash-flow${financeQuery(params)}`)
}

export async function getFinancialBooks() {
  const data = await financeRequest('/api/accounting/books')
  return Array.isArray(data.rows) ? data.rows : []
}

export async function saveFinancialBook(body) {
  const data = await financeRequest('/api/accounting/books', { body })
  return data.entry
}

export async function getExpensesDashboard(params = {}) {
  const data = await financeRequest(`/api/expenses/dashboard${financeQuery(params)}`)
  return data.stats || {}
}

export async function getExpenseCategories() {
  const data = await financeRequest('/api/expenses/categories')
  return Array.isArray(data.rows) ? data.rows : []
}

export async function saveExpenseCategory(body) {
  const data = await financeRequest('/api/expenses/categories', { body })
  return data.entry
}

export async function setExpenseCategoryStatus(id, status) {
  const data = await financeRequest(`/api/expenses/categories/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
  })
  return data.entry
}

export async function getExpenses(params = {}) {
  return listResult(await financeRequest(`/api/expenses${financeQuery(params)}`))
}

export async function getExpense(id) {
  const data = await financeRequest(`/api/expenses/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createExpense(body) {
  const data = await financeRequest('/api/expenses', { body })
  return data.entry
}

export async function updateExpense(id, body) {
  const data = await financeRequest(`/api/expenses/${encodeURIComponent(id)}`, { method: 'PUT', body })
  return data.entry
}

export async function submitExpense(id) {
  const data = await financeRequest(`/api/expenses/${encodeURIComponent(id)}/submit`, { method: 'POST', body: {} })
  return data.entry
}

export async function approveExpense(id, remarks = '') {
  const data = await financeRequest(`/api/expenses/${encodeURIComponent(id)}/approve`, { body: { remarks } })
  return data.entry
}

export async function rejectExpense(id, remarks = '') {
  const data = await financeRequest(`/api/expenses/${encodeURIComponent(id)}/reject`, { body: { remarks } })
  return data.entry
}

export async function payExpense(id, body) {
  const data = await financeRequest(`/api/expenses/${encodeURIComponent(id)}/pay`, { body })
  return data.entry
}

export async function generateRecurringExpenses() {
  return financeRequest('/api/expenses/recurring/generate', { method: 'POST', body: {} })
}

export async function getIncomeDashboard(params = {}) {
  const data = await financeRequest(`/api/income/dashboard${financeQuery(params)}`)
  return data.stats || {}
}

export async function getIncomeCategories() {
  const data = await financeRequest('/api/income/categories')
  return Array.isArray(data.rows) ? data.rows : []
}

export async function saveIncomeCategory(body) {
  const data = await financeRequest('/api/income/categories', { body })
  return data.entry
}

export async function setIncomeCategoryStatus(id, status) {
  const data = await financeRequest(`/api/income/categories/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { status },
  })
  return data.entry
}

export async function getIncomeList(params = {}) {
  return listResult(await financeRequest(`/api/income${financeQuery(params)}`))
}

export async function getIncome(id) {
  const data = await financeRequest(`/api/income/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createIncome(body) {
  const data = await financeRequest('/api/income', { body })
  return data.entry
}

export async function updateIncome(id, body) {
  const data = await financeRequest(`/api/income/${encodeURIComponent(id)}`, { method: 'PUT', body })
  return data.entry
}

export async function receiveIncomePayment(id, body) {
  const data = await financeRequest(`/api/income/${encodeURIComponent(id)}/receive-payment`, { body })
  return data.entry
}

export async function getSalaryOverview() {
  const data = await financeRequest('/api/salary-structures/overview')
  return data.stats || {}
}

export async function getSalaryStructures(params = {}) {
  return listResult(await financeRequest(`/api/salary-structures${financeQuery(params)}`))
}

export async function getSalaryStructure(id) {
  const data = await financeRequest(`/api/salary-structures/${encodeURIComponent(id)}`)
  return data.entry
}

export async function createSalaryStructure(body) {
  const data = await financeRequest('/api/salary-structures', { body })
  return data.entry
}

export async function updateSalaryStructure(id, body) {
  const data = await financeRequest(`/api/salary-structures/${encodeURIComponent(id)}`, { method: 'PUT', body })
  return data.entry
}

export async function reviseSalaryStructure(id, body) {
  const data = await financeRequest(`/api/salary-structures/${encodeURIComponent(id)}/revise`, { body })
  return data.entry
}

export async function getAdvances(params = {}) {
  return listResult(await financeRequest(`/api/employee-advances${financeQuery(params)}`))
}

export async function createAdvance(body) {
  const data = await financeRequest('/api/employee-advances', { body })
  return data.entry
}

export async function getLoans(params = {}) {
  return listResult(await financeRequest(`/api/employee-loans${financeQuery(params)}`))
}

export async function createLoan(body) {
  const data = await financeRequest('/api/employee-loans', { body })
  return data.entry
}

export async function getPayrollDashboard(params = {}) {
  const data = await financeRequest(`/api/payroll/dashboard${financeQuery(params)}`)
  return data.stats || {}
}

export async function generatePayroll(body) {
  return financeRequest('/api/payroll/generate', { body })
}

export async function getPayrollRuns(params = {}) {
  return listResult(await financeRequest(`/api/payroll/runs${financeQuery(params)}`))
}

export async function getPayrollItems(params = {}) {
  return listResult(await financeRequest(`/api/payroll${financeQuery(params)}`))
}

export async function getPayroll(id) {
  const data = await financeRequest(`/api/payroll/${encodeURIComponent(id)}`)
  return data
}

export async function approvePayroll(id) {
  const data = await financeRequest(`/api/payroll/${encodeURIComponent(id)}/approve`, { body: {} })
  return data.entry
}

export async function payPayroll(id, body) {
  const data = await financeRequest(`/api/payroll/${encodeURIComponent(id)}/pay`, { body })
  return data.entry
}

export async function adjustPayroll(id, body) {
  const data = await financeRequest(`/api/payroll/${encodeURIComponent(id)}/adjust`, { body })
  return data.entry
}

export async function setPayrollUnits(id, body) {
  const data = await financeRequest(`/api/payroll/${encodeURIComponent(id)}/units`, { body })
  return data.entry
}

export async function getPayslip(id) {
  const data = await financeRequest(`/api/payroll/${encodeURIComponent(id)}/payslip`)
  return data.entry
}

export async function getPaymentsDashboard(params = {}) {
  const data = await financeRequest(`/api/payments/dashboard${financeQuery(params)}`)
  return data.stats || {}
}

export async function getPayments(params = {}) {
  return listResult(await financeRequest(`/api/payments${financeQuery(params)}`))
}

export async function getPayment(id) {
  const data = await financeRequest(`/api/payments/${encodeURIComponent(id)}`)
  return data.entry
}

export async function refundPayment(id, body) {
  return financeRequest(`/api/payments/${encodeURIComponent(id)}/refund`, { body })
}

export async function syncFeePayments() {
  return financeRequest('/api/payments/sync-fees', { method: 'POST', body: {} })
}
