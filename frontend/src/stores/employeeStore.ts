import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export interface Employee {
  id: string
  name: string
  department: string
  email: string
}

export const useEmployeeStore = defineStore('employee', {
  state: () => ({
    employees: [] as Employee[]
  }),

  actions: {
    async fetchEmployees() {
      try {
        const response = await axios.get(`${API_URL}/employees`)
        this.employees = response.data
      } catch (error) {
        console.error('Error fetching employees:', error)
      }
    },

    async addEmployee(employee: Omit<Employee, 'id'>) {
      try {
        const newId = 'EMP-' + String(Math.floor(Math.random() * 9000) + 1000)
        const newEmp = { id: newId, ...employee }
        await axios.post(`${API_URL}/employees`, newEmp)
        this.employees.push(newEmp)
      } catch (error) {
        console.error('Error adding employee:', error)
      }
    },

    async updateEmployee(id: string, updatedEmp: Partial<Employee>) {
      try {
        await axios.put(`${API_URL}/employees/${id}`, updatedEmp)
        const index = this.employees.findIndex(e => e.id === id)
        if (index !== -1) {
          this.employees[index] = { ...this.employees[index], ...updatedEmp }
        }
      } catch (error) {
        console.error('Error updating employee:', error)
      }
    },

    async deleteEmployee(id: string) {
      try {
        await axios.delete(`${API_URL}/employees/${id}`)
        this.employees = this.employees.filter(e => e.id !== id)
      } catch (error) {
        console.error('Error deleting employee:', error)
      }
    }
  }
})
