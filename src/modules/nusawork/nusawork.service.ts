import axios, { AxiosInstance } from 'axios'
import { config } from '../../config/config'
import { INusaworkService, NusaworkEmployee } from './nusawork.service.interface'

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
            }))
    }

    async getAdmin(): Promise<NusaworkEmployee[]> {
        const employees = await this.getEmployees()

        return employees
            .filter((emp: any) =>
                emp.employee_id === '0202589' ||
                emp.employee_id === '0201325' || 
                emp.employee_id === '0201001'
            )
            .map((emp: any): NusaworkEmployee => ({
                userId: emp.user_id,
                employeeId: emp.employee_id,
                name: emp.full_name,
                email: emp.email,
                photoProfile: emp.photo_profile,
            }))
    }
}
