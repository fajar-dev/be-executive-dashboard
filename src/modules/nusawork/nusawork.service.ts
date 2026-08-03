import axios, { AxiosInstance } from 'axios'
import { config } from '../../config/config'
import { INusaworkService, NusaworkEmployee, NusaworkSales } from './nusawork.service.interface'

export class NusaworkService implements INusaworkService {
    private readonly http: AxiosInstance = axios.create({
        baseURL: config.nusawork.apiUrl,
        headers: {
            Accept: 'application/json',
        },
    })

    private async getToken(): Promise<string> {
        const res = await this.http.post<any>('/auth/api/oauth/token', {
            grant_type: 'client_credentials',
            client_id: config.nusawork.clientId,
            client_secret: config.nusawork.clientSecret,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })

        return res.data.access_token as string
    }

    async getEmployees(): Promise<any[]> {
        const token = await this.getToken()

        const res = await this.http.post<any>('/emp/api/v4.2/client/employee/filter', {
            fields: { active_status: ['active'] },
            is_paginate: false,
            multi_value: false,
            currentPage: 1,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        return (res?.data?.data as any[]) ?? []
    }

    async getExecutive(): Promise<NusaworkEmployee[]> {
        const employees = await this.getEmployees()

        return employees
            .filter((emp: any) =>
                emp.job_level === 'Direksi' || 
                emp.job_level === 'VP' ||
                emp.job_level === 'Senior Manager'
            )
            .map((emp: any): NusaworkEmployee => ({
                userId: emp.user_id,
                employeeId: emp.employee_id,
                name: emp.full_name,
                email: emp.email,
                photoProfile: emp.photo_profile,
                jobPosition: emp.job_position,
            }))
    }

    async getAdmin(): Promise<NusaworkEmployee[]> {
        const employees = await this.getEmployees()

        return employees
            .filter((emp: any) =>
                emp.employee_id === '0202589' ||
                emp.employee_id === '0201325' || 
                emp.employee_id === '0201001' ||
                emp.employee_id === '0202478' ||
                emp.organization_name === 'BIS'
            )
            .map((emp: any): NusaworkEmployee => ({
                userId: emp.user_id,
                employeeId: emp.employee_id,
                name: emp.full_name,
                email: emp.email,
                photoProfile: emp.photo_profile,
                jobPosition: emp.job_position,
            }))
    }

    /**
     * Ambil daftar account manager access home dari Nusawork.
     */
    async getSalesHome(): Promise<NusaworkSales[]> {
        const employees = await this.getEmployees()
        const employeeMap = new Map<string, any>(employees.map((e: any) => [e.user_id, e]))

        // Ambil account manager
        const accountManagers = employees.filter((emp: any) =>
            emp.job_position && emp.job_position.includes('Account Manager')
        )
        
        const relevantEmployees = new Map<string, any>()

        // Traverse upwards until VP Internet Access Home
        for (const am of accountManagers) {
            let current = am
            const path: any[] = []
            let isValidPath = false
            while (current) {
                // If we hit someone already in the valid set, this whole branch is valid
                if (relevantEmployees.has(current.user_id)) {
                    isValidPath = true
                    break
                }
                if (current.job_position === 'VP Internet Access Home') {
                    isValidPath = true
                    break
                }
                path.push(current)
                // Jika sampai ke atas (self-reporting or no manager) dan belum ketemu VP -> Invalid
                if (!current.id_report_to_value || current.id_report_to_value === current.user_id) {
                    break
                }
                // Move up
                current = employeeMap.get(current.id_report_to_value)
            }
            if (isValidPath) {
                path.forEach(emp => relevantEmployees.set(emp.user_id, emp))
            }
        }

        return Array.from(relevantEmployees.values()).map((emp: any) => ({
            id: emp.user_id,
            employeeId: emp.employee_id,
            name: emp.full_name,
            email: emp.email,
            photoProfile: emp.photo_profile,
            jobPosition: emp.job_position,
            organizationName: emp.organization_name,
            jobLevel: emp.job_level,
            branchId: emp.branch_id,
            managerId: emp.id_report_to_value,
            status: emp.status_join,
            type: 'access_home',
        }))
    }

    /**
     * Ambil daftar account manager access business dari Nusawork.
     */
    async getSalesBusiness(): Promise<NusaworkSales[]> {
        const employees = await this.getEmployees()
        const employeeMap = new Map<string, any>(employees.map((e: any) => [e.user_id, e]))

        // Ambil account manager
        const accountManagers = employees.filter((emp: any) => 
            emp.job_position && emp.job_position.includes('Business Development Executive')
        )
        
        const relevantEmployees = new Map<string, any>()

        // Traverse upwards until VP Internet Access Business
        for (const am of accountManagers) {
            let current = am
            const path: any[] = []
            let isValidPath = false
            while (current) {
                // If we hit someone already in the valid set, this whole branch is valid
                if (relevantEmployees.has(current.user_id)) {
                    isValidPath = true
                    break
                }
                if (current.job_position === 'VP Internet Access Business') {
                    isValidPath = true
                    break
                }
                path.push(current)
                // Jika sampai ke atas (self-reporting or no manager) dan belum ketemu VP -> Invalid
                if (!current.id_report_to_value || current.id_report_to_value === current.user_id) {
                    break
                }
                // Move up
                current = employeeMap.get(current.id_report_to_value)
            }
            if (isValidPath) {
                path.forEach(emp => relevantEmployees.set(emp.user_id, emp))
            }
        }

        return Array.from(relevantEmployees.values()).map((emp: any) => ({
            id: emp.user_id,
            employeeId: emp.employee_id,
            name: emp.full_name,
            email: emp.email,
            photoProfile: emp.photo_profile,
            jobPosition: emp.job_position,
            organizationName: emp.organization_name,
            jobLevel: emp.job_level,
            branchId: emp.branch_id,
            managerId: emp.id_report_to_value,
            status: emp.status_join,
            type: 'access_business',
        }))
    }
}
